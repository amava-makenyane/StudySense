/* ===== Teacher dashboard =====
   Upload a memo and student papers (typed, Word, PDF, Excel or scans), get a marking spreadsheet,
   save it into a module, and see graphs. Free plan keeps 3 modules, subscribers get unlimited. */
const FREE_SLOTS = 3;
let tPapers = [], tRows = [], tMemo = [], tCharts = [];

const add = (a, b) => a + b;
const tot = s => s.reduce(add, 0);
const pct = (s, q) => Math.round(tot(s) / q * 100);
const avgOf = ses => Math.round(ses.rows.reduce((a, r) => a + tot(r.s), 0) / (ses.rows.length * ses.q) * 100);
const escA = s => esc(String(s)).replace(/"/g, '&quot;');
const nice = n => n.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/* ---------- marking ---------- */
function kws(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
    .filter(w => w.length > 2 && STOP.indexOf(w) < 0)
    .map(w => w.length > 4 ? w.replace(/s$/, '') : w);
}
function overlap(m, a) {
  const k = kws(m);
  if (!k.length) return 0;
  const l = a.toLowerCase();
  return k.filter(w => l.indexOf(w) > -1).length / k.length;
}
/* Matches each memo line to the best unused line in the student's paper, so order doesn't matter. */
function markLocal(M, text) {
  const A = text.split('\n').map(x => x.trim()).filter(Boolean), used = {};
  return M.map((m, i) => {
    let best = -1, bv = -1;
    A.forEach((a, j) => { if (used[j]) return; const v = overlap(m, a) + (j === i ? 0.01 : 0); if (v > bv) { bv = v; best = j; } });
    const r = Math.min(1, Math.max(0, bv));
    if (best > -1 && r >= 0.3) used[best] = 1;
    return r >= 0.6 ? 1 : r >= 0.3 ? 0.5 : 0;
  });
}

/* ---------- page ---------- */
function renderTeacher() {
  const u = S.user, M = S.modules = S.modules || [];
  $('#tHi').textContent = greet() + ', ' + first(u.name) + '.';
  $('#tSub').textContent = 'Drop in the memo and the papers, and I\u2019ll do the marking while you make tea.';
  const ses = [].concat.apply([], M.map(m => m.sessions)).sort((a, b) => a.d < b.d ? -1 : 1);
  $('#t1').textContent = ses.reduce((n, s) => n + s.rows.length, 0);
  $('#t2').textContent = ses.length ? avgOf(ses[ses.length - 1]) + '%' : '\u2013';
  $('#t3').textContent = M.length;
  $('#t3n').textContent = S.sub ? 'Modules (unlimited)' : 'Modules (free plan: ' + FREE_SLOTS + ')';
  $('#modList').innerHTML = M.map(m => '<option value="' + escA(m.name) + '">').join('');
  const d = S.tdraft;
  if (d && !$('#memo').value && !$('#stu').value && !$('#tMod').value) {
    $('#memo').value = d.memo || ''; $('#stu').value = d.stu || ''; $('#tMod').value = d.mod || '';
    $('#tTitle').value = d.title || ''; $('#tName').value = d.name || '';
    $('#draftNote').textContent = 'Welcome back. Your draft is right where you left it.';
  }
  drawPapers(); drawMods();
}

function drawPapers() {
  $('#paperList').innerHTML = tPapers.length
    ? tPapers.map((p, i) => '<div class="pl"><span>' + esc(p.name) + '</span><button data-rp="' + i + '" aria-label="Remove ' + escA(p.name) + '">&times;</button></div>').join('')
    : '<p class="note" style="margin:6px 0 0">No papers yet. Add one file per student.</p>';
}

/* ---------- uploads and scans ---------- */
async function addPapers(fl) {
  const fs = [].slice.call(fl); let bad = 0;
  for (const f of fs) {
    const t = await readOne(f, m => { $('#paperNote').textContent = f.name + ': ' + m; });
    if (t.trim()) tPapers.push({ name: nice(f.name), text: t }); else bad++;
  }
  $('#paperNote').textContent = '';
  drawPapers();
  toast(bad ? bad + ' file(s) had no readable text. For handwriting, a clear photo of typed or printed answers works best.' : 'Papers added. Press Mark papers when you\u2019re ready.');
}
async function addMemo(fl) {
  const fs = [].slice.call(fl); let done = [];
  for (const f of fs) {
    const t = await readOne(f, m => { $('#memoFiles').innerHTML = '<span>' + esc(f.name) + ' (' + m + ')</span>'; });
    if (t.trim()) { $('#memo').value = ($('#memo').value ? $('#memo').value + '\n' : '') + t.trim(); done.push(f.name); }
  }
  $('#memoFiles').innerHTML = done.map(n => '<span>' + esc(n) + ' \u2713</span>').join('');
  toast(done.length ? 'Memo loaded. Have a quick look and tidy it up if needed.' : 'I couldn\u2019t read that memo. Try a clearer scan or a Word, PDF or Excel file.');
  $('#memo').dispatchEvent(new Event('input'));
}
const wire = (btn, inp, fn) => { $(btn).onclick = () => $(inp).click(); $(inp).onchange = e => { fn(e.target.files); e.target.value = ''; }; };
wire('#upMemo', '#fMemo', addMemo); wire('#scanMemo', '#fMemoScan', addMemo);
wire('#upPapers', '#fPapers', addPapers); wire('#scanPaper', '#fPaperScan', addPapers);
makeDrop($('#paperDz'), addPapers); makeDrop($('#memo'), addMemo);
$('#paperList').addEventListener('click', e => { const b = e.target.closest('[data-rp]'); if (b) { tPapers.splice(+b.dataset.rp, 1); drawPapers(); } });

/* ---------- drafts ---------- */
let dt;
['memo', 'stu', 'tMod', 'tTitle', 'tName'].forEach(id => $('#' + id).addEventListener('input', () => {
  clearTimeout(dt);
  dt = setTimeout(() => {
    S.tdraft = { memo: $('#memo').value, stu: $('#stu').value, mod: $('#tMod').value, title: $('#tTitle').value, name: $('#tName').value };
    save(); $('#draftNote').textContent = 'Draft saved';
  }, 500);
}));

$('#tSample').onclick = () => {
  $('#tMod').value = 'Life Sciences Grade 11'; $('#tTitle').value = 'Test 2';
  $('#memo').value = 'Chloroplasts\nATP and NADPH\nRuBisCO fixes carbon dioxide\nStroma\nLight intensity or temperature';
  tPapers = [
    { name: 'Thandi Mokoena', text: 'In the chloroplasts\nOxygen, ATP and NADPH\nRuBisCO fixes carbon dioxide in the Calvin cycle\nThe stroma\nTemperature' },
    { name: 'Sipho Dlamini', text: 'Chloroplast\nATP and NADPH\nIt splits water\nStroma\nLight intensity' },
    { name: 'Naledi Khumalo', text: 'Mitochondria\nOxygen\nIt makes glucose\nThylakoid\nSunlight' }
  ];
  drawPapers(); toast('Sample loaded. Press Mark papers.');
};

/* ---------- mark ---------- */
$('#mark').onclick = async () => {
  const M = $('#memo').value.split('\n').map(x => x.trim()).filter(Boolean);
  const P = tPapers.slice(), typed = $('#stu').value.trim();
  if (typed) P.push({ name: $('#tName').value.trim() || 'Typed paper', text: typed });
  if (!M.length) { toast('Add a memo first, so I know what the right answers are.'); return; }
  if (!P.length) { toast('Add at least one student paper.'); return; }
  if (!canUse()) return;
  used();
  const b = $('#mark'); b.disabled = true; b.textContent = loadMsg();
  try {
    const R = await API.mark(M, P);
    tMemo = M; tRows = R.map(r => ({ name: r.name, s: r.scores }));
    drawSheet();
    $('#sheetCard').scrollIntoView({ behavior: 'smooth' });
    toast('All done! ' + R.length + ' paper' + (R.length > 1 ? 's' : '') + ' marked.');
  } catch (e) { toast('Hmm, the marking didn\u2019t work. Please try again.'); }
  b.disabled = false; b.textContent = 'Mark papers';
};

/* ---------- the spreadsheet ---------- */
function classAvg() { const q = tMemo.length; return Math.round(tRows.reduce((a, r) => a + tot(r.s), 0) / (tRows.length * q) * 100); }
function drawSheet() {
  const q = tMemo.length;
  $('#sheetCard').style.display = 'block';
  let h = '<thead><tr><th>Student</th>' + tMemo.map((m, i) => '<th title="' + escA(m) + '">Q' + (i + 1) + '</th>').join('') + '<th>Total</th><th>%</th></tr></thead><tbody>';
  tRows.forEach((r, ri) => {
    h += '<tr><td>' + esc(r.name) + '</td>' + r.s.map((v, ci) => '<td class="c ' + (v === 1 ? 'f' : v ? 'h' : 'z') + '" data-r="' + ri + '" data-c="' + ci + '">' + (v === 1 ? '\u2713' : v ? '\u00bd' : '\u2717') + '</td>').join('') + '<td><b>' + tot(r.s) + '/' + q + '</b></td><td>' + pct(r.s, q) + '%</td></tr>';
  });
  h += '<tr class="sum"><td>Class % correct</td>' + tMemo.map((m, ci) => '<td>' + Math.round(tRows.reduce((a, r) => a + r.s[ci], 0) / tRows.length * 100) + '%</td>').join('') + '<td>' + (tRows.reduce((a, r) => a + tot(r.s), 0) / tRows.length).toFixed(1) + '/' + q + '</td><td>' + classAvg() + '%</td></tr></tbody>';
  $('#tbl').innerHTML = h;
  const P = tRows.map(r => pct(r.s, q)), hi = Math.max.apply(null, P), lo = Math.min.apply(null, P);
  $('#sumLine').innerHTML = '<b>' + tRows.length + '</b> paper' + (tRows.length > 1 ? 's' : '') + ' &middot; class average <b>' + classAvg() + '%</b> &middot; highest <b>' + hi + '%</b> (' + esc(tRows[P.indexOf(hi)].name) + ') &middot; lowest <b>' + lo + '%</b> &middot; pass rate <b>' + Math.round(P.filter(p => p >= 50).length / P.length * 100) + '%</b>';
}
$('#tbl').addEventListener('click', e => {
  const c = e.target.closest('td.c'); if (!c) return;
  const r = tRows[+c.dataset.r], i = +c.dataset.c;
  r.s[i] = r.s[i] === 0 ? 0.5 : r.s[i] === 0.5 ? 1 : 0;
  drawSheet();
});

/* ---------- export ---------- */
function fname() {
  const s = x => x.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (s($('#tMod').value) || 'marking') + '-' + (s($('#tTitle').value) || 'results');
}
function aoa() {
  const q = tMemo.length, A = [['Student'].concat(tMemo.map((m, i) => 'Q' + (i + 1)), ['Total', 'Percent'])];
  tRows.forEach(r => A.push([r.name].concat(r.s, [tot(r.s), pct(r.s, q) + '%'])));
  A.push([]); A.push(['Class % correct'].concat(tMemo.map((m, i) => Math.round(tRows.reduce((a, r) => a + r.s[i], 0) / tRows.length * 100) + '%')));
  A.push(['Class average', classAvg() + '%']);
  return A;
}
$('#dlXlsx').onclick = () => {
  if (!window.XLSX) { toast('Excel export needs the SheetJS library to load. Check your connection.'); return; }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa()), 'Marking');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Question', 'Memo answer']].concat(tMemo.map((m, i) => ['Q' + (i + 1), m]))), 'Memo');
  XLSX.writeFile(wb, fname() + '.xlsx');
};
$('#dlCsv').onclick = () => {
  if (!window.XLSX) { toast('CSV export needs the SheetJS library to load. Check your connection.'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(aoa()))], { type: 'text/csv' }));
  a.download = fname() + '.csv'; a.click();
};

/* ---------- modules (drafts) ---------- */
$('#saveMod').onclick = () => {
  if (!tRows.length) return;
  const name = $('#tMod').value.trim() || 'My module', M = S.modules = S.modules || [];
  let m = M.find(x => x.name.toLowerCase() === name.toLowerCase());
  if (!m) {
    if (!S.sub && M.length >= FREE_SLOTS) { openPaySlots(); return; }
    m = { id: Date.now(), name, memo: '', sessions: [] }; M.push(m);
  }
  m.memo = tMemo.join('\n');
  m.sessions.push({ d: new Date().toISOString(), t: $('#tTitle').value.trim() || 'Assessment ' + (m.sessions.length + 1), q: tMemo.length, rows: tRows.map(r => ({ name: r.name, s: r.s.slice() })) });
  save(); renderTeacher(); toast('Saved to ' + name + '. Your graphs are ready below.');
};
function drawMods() {
  const M = S.modules || [];
  $('#slots').innerHTML = S.sub ? 'You\u2019re subscribed, so there\u2019s no limit on modules.' : M.length + ' of ' + FREE_SLOTS + ' free module slots used<div class="slot"><i style="width:' + Math.min(100, M.length / FREE_SLOTS * 100) + '%"></i></div>';
  $('#mods').innerHTML = M.length ? M.map(m => {
    const L = m.sessions[m.sessions.length - 1];
    return '<div class="card"><h3>' + esc(m.name) + '</h3><p>' + m.sessions.length + ' marking session' + (m.sessions.length > 1 ? 's' : '') + ' &middot; latest average ' + avgOf(L) + '%</p><div class="row" style="margin:12px 0 0"><button class="btn sm" data-an="' + m.id + '">Analysis</button><button class="btn ghost sm" data-co="' + m.id + '">Continue</button><button class="btn ghost sm" data-del="' + m.id + '">Delete</button></div></div>';
  }).join('') : '<p class="note">Nothing here yet. Mark a paper, press &ldquo;Save to module&rdquo; and it will show up here with graphs.</p>';
}
$('#mods').addEventListener('click', e => {
  const M = S.modules || [], b = e.target.closest('button'); if (!b) return;
  const id = +(b.dataset.an || b.dataset.co || b.dataset.del), m = M.find(x => x.id === id); if (!m) return;
  if (b.dataset.an) openAnalysis(m);
  if (b.dataset.co) { $('#tMod').value = m.name; $('#memo').value = m.memo; $('#markCard').scrollIntoView({ behavior: 'smooth' }); toast('Memo loaded. Add the new papers and mark away.'); }
  if (b.dataset.del && confirm('Delete ' + m.name + ' and all its marking history?')) { S.modules = M.filter(x => x.id !== id); save(); $('#analysis').style.display = 'none'; renderTeacher(); }
});
$('#anX').onclick = () => { $('#analysis').style.display = 'none'; };

/* ---------- graphs ---------- */
function openAnalysis(m) {
  $('#analysis').style.display = 'block'; $('#anT').textContent = m.name + ': how the class is doing';
  $('#analysis').scrollIntoView({ behavior: 'smooth' });
  if (!window.Chart) { toast('The graphs need Chart.js to load. Check your connection.'); return; }
  tCharts.forEach(c => c.destroy()); tCharts = [];
  const L = m.sessions[m.sessions.length - 1], q = L.q;
  const v = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  Chart.defaults.color = v('--mute'); Chart.defaults.font.family = 'DM Sans, system-ui, sans-serif';
  const grid = 'rgba(128,128,128,.2)', sc = { y: { beginAtZero: true, max: 100, grid: { color: grid } }, x: { grid: { color: grid } } };
  const mk = (id, type, labels, data, title, color, axes) => tCharts.push(new Chart($(id), {
    type, data: { labels, datasets: [{ label: title, data, backgroundColor: color, borderColor: color, tension: 0.35, borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: axes ? sc : {}, plugins: { legend: { display: type === 'doughnut' }, title: { display: true, text: title } } }
  }));
  mk('#c1', 'bar', L.rows.map(r => r.name), L.rows.map(r => pct(r.s, q)), 'Latest results: % per student', v('--ac'), 1);
  mk('#c2', 'line', m.sessions.map(s => s.t), m.sessions.map(avgOf), 'Class average over time (%)', v('--ac2'), 1);
  const pass = L.rows.filter(r => pct(r.s, q) >= 50).length;
  mk('#c3', 'doughnut', ['Passed', 'Below 50%'], [pass, L.rows.length - pass], 'Pass rate (latest)', [v('--ok'), v('--bad')], 0);
  const qs = Array.from({ length: q }, (_, i) => i);
  mk('#c4', 'bar', qs.map(i => 'Q' + (i + 1)), qs.map(i => Math.round(L.rows.reduce((a, r) => a + r.s[i], 0) / L.rows.length * 100)), '% correct per question (latest)', v('--ac'), 1);
}
