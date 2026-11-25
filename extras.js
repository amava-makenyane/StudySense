/* ===== Study extras =====
   Flashcards (tap to flip), "Ask my notes" tutor, podcast mode, WhatsApp share, save as PDF,
   weak topics after a quiz, and an invite button for talk rooms. */

/* flashcards */
document.addEventListener('click', e => { const f = e.target.closest('.fc'); if (f) f.classList.toggle('flip'); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('fc')) { e.preventDefault(); e.target.classList.toggle('flip'); } });

/* ask my notes (Sage, the study buddy) */
function tutorAnswer(src, q) {
  const k = kws(q);
  if (!k.length) return 'Ask me something specific, like \u201CWhat does the stroma do?\u201D';
  const ss = (src.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g) || []).map(x => x.trim()).filter(x => x.length > 25);
  const hit = ss.map((s, i) => ({ i, s, v: k.filter(w => s.toLowerCase().indexOf(w) > -1).length })).filter(x => x.v > 0)
    .sort((a, b) => b.v - a.v).slice(0, 2).sort((a, b) => a.i - b.i);
  return hit.length ? 'Here\u2019s what your notes say: ' + hit.map(x => x.s).join(' ') : 'Hmm, I couldn\u2019t find that in your notes. Try different words, or paste more of the chapter.';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act="ask"]');
  if (b) {
    const m = b.closest('.m');
    if (m.querySelector('.ask')) { m.querySelector('.ask input').focus(); return; }
    m.insertAdjacentHTML('beforeend', '<div class="ask"><b>Sage, your study buddy</b><div class="cm"><input aria-label="Ask about your notes" placeholder="Ask anything about these notes\u2026"><button class="btn sm" data-askgo>Ask</button></div><div class="ansbox"></div></div>');
    m.querySelector('.ask input').focus(); return;
  }
  const g = e.target.closest('[data-askgo]'); if (!g) return;
  const m = g.closest('.m'), inp = m.querySelector('.ask input'), q = inp.value.trim(); if (!q) return;
  const n = m.querySelector('.acts').dataset.n, box = m.querySelector('.ansbox');
  inp.value = '';
  API.tutor((NOTE_SRC[n] || {}).src || '', q).then(a => { box.insertAdjacentHTML('beforeend', '<p><b>You:</b> ' + esc(q) + '</p><p><b>Sage:</b> ' + esc(a) + '</p>'); })
    .catch(() => { box.insertAdjacentHTML('beforeend', '<p>Hmm, Sage is having a moment. Please try again.</p>'); });
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest && e.target.closest('.ask') && e.target.tagName === 'INPUT') e.target.closest('.ask').querySelector('[data-askgo]').click(); });

/* podcast */
let podQ = [], podOn = false;
function podScript(r) {
  const kw = (r && r.kw) || [], pts = (r && r.pts) || [];
  const react = ['Got it.', 'That makes sense.', 'Good one to remember for the test.', 'Right, and that often comes up in exams.'];
  const L = [{ v: 0, t: 'Welcome to your Study Sense podcast. Today we are looking at ' + (kw.slice(0, 3).join(', ') || 'your notes') + '.' }, { v: 1, t: 'Great. Let\u2019s start with the key points.' }];
  pts.slice(0, 8).forEach((p, i) => { L.push({ v: 0, t: p }); L.push({ v: 1, t: react[i % react.length] }); });
  L.push({ v: 0, t: 'That\u2019s it for now. Go and ace it!' });
  return L;
}
function podStop() { podOn = false; podQ = []; if ('speechSynthesis' in window) speechSynthesis.cancel(); $('#pod').style.display = 'none'; $('#podPause').textContent = 'Pause'; }
function podNext() {
  if (!podOn || !podQ.length) { podStop(); return; }
  const l = podQ.shift(), u = new SpeechSynthesisUtterance(l.t), vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  if (vs.length > 1) u.voice = vs[l.v % vs.length]; else u.pitch = l.v ? 1.4 : 0.9;
  u.onend = podNext; u.onerror = () => { if (podOn) podNext(); };
  $('#podT').textContent = (l.v ? 'Guest: ' : 'Host: ') + l.t.slice(0, 70);
  speechSynthesis.speak(u);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act="pod"]'); if (!b) return;
  if (!('speechSynthesis' in window)) { toast('Your browser can\u2019t play podcasts. Try Chrome or Edge.'); return; }
  const n = b.closest('.acts').dataset.n, d = NOTE_SRC[n];
  if (!d || !d.r) { toast('Make some notes first, then press Podcast.'); return; }
  podStop(); podOn = true; podQ = podScript(d.r); $('#pod').style.display = 'flex'; podNext();
});
$('#podStop').onclick = podStop;
$('#podPause').onclick = () => { if (speechSynthesis.paused) { speechSynthesis.resume(); $('#podPause').textContent = 'Pause'; } else { speechSynthesis.pause(); $('#podPause').textContent = 'Resume'; } };

/* share on WhatsApp, save as PDF */
document.addEventListener('click', e => {
  const w = e.target.closest('[data-act="wa"]');
  if (w) {
    const m = w.closest('.m'), bar = m.querySelector('.acts'); bar.style.display = 'none'; const t = m.innerText; bar.style.display = '';
    const msg = 'My Study Sense notes:\n\n' + t.slice(0, 1500) + '\n\nMade with ' + location.origin + location.pathname;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); return;
  }
  const p = e.target.closest('[data-act="pdf"]');
  if (p) { p.closest('.m').classList.add('print-me'); document.body.classList.add('printing'); toast('Choose \u201CSave as PDF\u201D in the print window.'); setTimeout(() => window.print(), 300); }
});
window.addEventListener('afterprint', () => { document.body.classList.remove('printing'); document.querySelectorAll('.print-me').forEach(x => x.classList.remove('print-me')); });

/* quiz: topics to revisit */
document.addEventListener('click', e => {
  if (!e.target.closest('.opt')) return;
  const bx = e.target.closest('.quizbox'); if (!bx || bx.querySelector('.qdone')) return;
  const qs = bx.querySelectorAll('.qz');
  if (qs.length !== bx.querySelectorAll('.qz[data-done]').length) return;
  const missed = [].filter.call(qs, q => q.querySelector('.opt.bad')).map(q => q.dataset.a).filter((a, i, arr) => arr.indexOf(a) === i);
  bx.insertAdjacentHTML('beforeend', '<p class="qdone"><b>Quiz done! You got ' + (bx.dataset.s || 0) + ' out of ' + qs.length + '.</b> ' + (missed.length ? 'Topics to revisit: ' + missed.map(esc).join(', ') + '.' : 'Nothing to revisit. Brilliant!') + '</p>');
});

/* invite a study buddy */
$('#rooms .lead').insertAdjacentHTML('afterend', '<p><button class="btn ghost sm" id="inviteBtn">Invite a study buddy</button></p>');
$('#inviteBtn').onclick = () => {
  const link = location.origin + location.pathname, msg = 'Come study with me on Study Sense: ' + link;
  if (navigator.share) navigator.share({ title: 'Study Sense', text: msg, url: link }).catch(() => { });
  else window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
};
