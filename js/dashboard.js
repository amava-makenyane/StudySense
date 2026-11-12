/* ===== Teacher dashboard widgets =====
   Results, weekly marking activity, top performers, up next, achievements and the upgrade card.
   Everything is worked out from the saved modules (S.modules), so it matches what the backend will return. */
const COLS = ['#93DD0C', '#2DD4BF', '#60A5FA', '#FBBF24', '#C4B5FD'];
const fdate = d => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
const initials = n => n.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
const passN = s => s.rows.filter(r => pct(r.s, s.q) >= 50).length;
let actChart = null;

function allSessions() {
  return [].concat.apply([], (S.modules || []).map(m => m.sessions.map(s => Object.assign({ mod: m.name, mid: m.id }, s))))
    .sort((a, b) => a.d < b.d ? -1 : 1);
}
function continueMod(m) {
  $('#tMod').value = m.name; $('#memo').value = m.memo;
  $('#markCard').scrollIntoView({ behavior: 'smooth' });
  toast('Memo loaded. Add the new papers and mark away.');
}

function drawDash() {
  const u = S.user, mods = S.modules || [], ses = allSessions(), q = ($('#tSearch').value || '').toLowerCase();
  const A = ses.filter(s => !q || s.mod.toLowerCase().includes(q) || s.t.toLowerCase().includes(q));
  const papers = ses.reduce((n, s) => n + s.rows.length, 0), last = ses[ses.length - 1];

  $('#tBanner').textContent = ses.length
    ? 'You\u2019ve marked ' + papers + ' paper' + (papers > 1 ? 's' : '') + ' across ' + mods.length + ' module' + (mods.length > 1 ? 's' : '') + '. Your latest class average is ' + avgOf(last) + '%. Start a new session and keep the momentum going.'
    : 'No papers marked yet. Upload a memo and a few papers, and your progress will start showing up right here.';

  $('#pAv').textContent = initials(u.name || 'T');
  $('#pName').textContent = u.name || 'Teacher';
  $('#pRole').textContent = (u.occ || 'Teacher') + (u.field ? ' \u00b7 ' + u.field : '');

  $('#rList').innerHTML = A.length ? A.slice(-5).reverse().map((s, i) => {
    const p = avgOf(s), c = COLS[i % 5];
    return '<div class="rrow"><i style="background:' + c + '"></i><div><b>' + esc(s.mod) + '</b><small>' + esc(s.t) + ' &middot; ' + fdate(s.d) + '</small></div><div class="pbar"><i style="width:' + p + '%;background:' + c + '"></i></div><b>' + p + '%</b></div>';
  }).join('') : '<p class="note">Your results will appear here once you save a marking session to a module.</p>';

  $('#aTbl').innerHTML = A.length
    ? '<thead><tr><th>Assessment</th><th>Module</th><th>Papers</th><th>Class average</th><th>Pass rate</th><th>Date</th><th></th></tr></thead><tbody>' +
      A.slice(-8).reverse().map(s => '<tr><td>' + esc(s.t) + '</td><td>' + esc(s.mod) + '</td><td>' + s.rows.length + '</td><td>' + avgOf(s) + '%</td><td>' + Math.round(passN(s) / s.rows.length * 100) + '%</td><td>' + fdate(s.d) + '</td><td><button class="btn ghost sm" data-an2="' + s.mid + '">Graphs</button></td></tr>').join('') + '</tbody>'
    : '<tbody><tr><td style="text-align:left" class="note">Nothing to show yet.</td></tr></tbody>';

  const by = {};
  ses.forEach(s => s.rows.forEach(r => { (by[r.name] = by[r.name] || []).push(pct(r.s, s.q)); }));
  const top = Object.keys(by).map(n => ({ n, p: Math.round(by[n].reduce(add, 0) / by[n].length) })).sort((a, b) => b.p - a.p).slice(0, 5);
  $('#tops').innerHTML = top.length
    ? top.map((t, i) => '<div><span class="av" style="background:' + COLS[i % 5] + '">' + esc(initials(t.n)) + '</span>' + esc(t.n.split(' ')[0]) + '<br><b>' + t.p + '%</b></div>').join('')
    : '<p class="note" style="margin:0">Your strongest students will show up here.</p>';

  if (window.Chart) {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 6 + i); return d; });
    const on = d => ses.filter(s => new Date(s.d).toDateString() === d.toDateString());
    if (actChart) actChart.destroy();
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--mute').trim();
    actChart = new Chart($('#cAct'), {
      type: 'bar',
      data: { labels: days.map(d => d.toLocaleDateString('en-ZA', { weekday: 'short' })), datasets: [
        { label: 'Papers marked', data: days.map(d => on(d).reduce((n, s) => n + s.rows.length, 0)), backgroundColor: '#93DD0C', borderRadius: 6 },
        { label: 'Passed', data: days.map(d => on(d).reduce((n, s) => n + passN(s), 0)), backgroundColor: '#2DD4BF', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(128,128,128,.2)' } }, x: { grid: { display: false } } }, plugins: { legend: { position: 'bottom' } } }
    });
  }

  const items = [];
  if (S.tdraft && (S.tdraft.memo || S.tdraft.stu || S.tdraft.mod)) items.push({ t: 'Continue your draft', s: S.tdraft.mod || 'Untitled draft', k: 'draft' });
  mods.slice().sort((a, b) => a.sessions[a.sessions.length - 1].d < b.sessions[b.sessions.length - 1].d ? -1 : 1).slice(0, 3)
    .forEach(m => items.push({ t: 'Mark new papers: ' + m.name, s: 'Last marked ' + fdate(m.sessions[m.sessions.length - 1].d), k: 'm' + m.id }));
  $('#upNext').innerHTML = items.length
    ? items.map(i => '<button class="pi" data-up="' + i.k + '"><i>\u270E</i><span><b>' + esc(i.t) + '</b><br><small class="note">' + esc(i.s) + '</small></span></button>').join('')
    : '<p class="note">Nothing waiting. Enjoy the quiet.</p>';

  $('#bigAvg').textContent = last ? avgOf(last) + '%' : '\u2013';
  $('#bigSub').textContent = last ? last.mod + ' \u00b7 ' + last.t : 'Mark a paper to see it here';

  const badges = [['First paper marked', papers >= 1], ['10 papers marked', papers >= 10], ['3 modules', mods.length >= 3], ['70%+ class average', !!last && avgOf(last) >= 70], ['Subscriber', !!S.sub]];
  $('#ach').innerHTML = badges.map(b => '<span class="badge ' + (b[1] ? 'on' : 'off') + '">' + (b[1] ? '\u2713 ' : '') + b[0] + '</span>').join('');

  $('#upg').innerHTML = S.sub
    ? '<b>Pro plan active</b><br>Unlimited modules, papers and graphs.'
    : 'Upgrade to Pro for unlimited modules and graphs.<br><button class="btn sm" id="upgBtn" style="margin-top:10px">Upgrade now</button>';
}

document.addEventListener('click', e => {
  const g = e.target.closest('[data-an2]');
  if (g) { const m = (S.modules || []).find(x => x.id === +g.dataset.an2); if (m) openAnalysis(m); }
  const u = e.target.closest('[data-up]');
  if (u) {
    if (u.dataset.up === 'draft') $('#markCard').scrollIntoView({ behavior: 'smooth' });
    else { const m = (S.modules || []).find(x => 'm' + x.id === u.dataset.up); if (m) continueMod(m); }
  }
  if (e.target.closest('#upgBtn')) openPay();
});
$('#tSearch').addEventListener('input', drawDash);
$('#newSess').onclick = () => { $('#markCard').scrollIntoView({ behavior: 'smooth' }); $('#tMod').focus(); };
$('#dOut').onclick = () => { S.user = null; save(); show('home'); };
