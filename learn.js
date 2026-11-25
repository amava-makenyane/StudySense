/* ===== Learn: lessons and practice for school subjects =====
   Level -> subject -> topic. Each topic has key ideas, a worked example and practice questions that are
   made by code and checked (see learn-data.js). Students see step-by-step answers. Teachers can make a
   printable worksheet with a memo and send the memo straight into the marking tool.
   College and university modules vary between institutions, so for those the site builds study
   material from the student's own notes instead of guessing what a course teaches. */
const LVL_UNI = 3;                                  // the "College or university" chip
const LV = { level: 1, subj: null, topic: null, qs: [], seed: 0, exSeed: 0, exQ: null, checked: false, work: null };
const progress = () => (S.learn = S.learn || {});
const topicById = id => TOPICS.find(t => t.id === id);
const subjById = id => SUBJECTS.find(s => s.id === id);
const newSeed = () => Math.floor(Math.random() * 1e9) + 1;
const lvList = (subj, level) => TOPICS.filter(t => t.subj === subj && t.level === level);
const reviewBadge = t => { const r = LEARN.reviewed[t.id]; return r ? '<span class="rv ok">Checked by ' + esc(r.by) + (r.on ? ' on ' + esc(r.on) : '') + '</span>' : '<span class="rv">Awaiting teacher check</span>'; };
const levelName = i => i === LVL_UNI ? 'College or university' : LEVELS[i];

function crumbs(parts) {
  $('#lvCrumb').innerHTML = parts.map(p => p.go ? '<button class="lnk2" data-lv="' + p.go + '">' + esc(p.t) + '</button>' : '<span>' + esc(p.t) + '</span>').join(' &rsaquo; ');
}
function renderLearn() { if (LV.topic) renderTopic(); else if (LV.subj) renderSubject(); else renderLearnHome(); }

/* ---------- home: level and subject ---------- */
function renderLearnHome() {
  LV.subj = null; LV.topic = null; crumbs([{ t: 'Learn' }]);
  const chips = LEVELS.concat(['College or university']).map((l, i) => '<button aria-pressed="' + (LV.level === i) + '" data-lvl="' + i + '">' + esc(l) + '</button>').join('');
  let h = '<h2>Learn a subject</h2><p class="lead" style="font-size:16px">Pick your level and a subject. Every topic has a short lesson, a worked example and practice questions with step-by-step answers.</p><div class="fl" aria-label="Level">' + chips + '</div>';
  if (LV.level === LVL_UNI) {
    h += '<div class="card"><h3 style="margin-top:0">At college or university? Learn from your own course</h3><p>Courses differ a lot between institutions, so StudySense builds your study material from <b>your own notes and slides</b> instead of guessing what your lecturer teaches. That keeps it accurate for your course.</p>' +
      '<div class="row"><button class="btn" data-go="guest">Make notes from my material</button><button class="btn ghost" data-go="references">Referencing</button><button class="btn ghost" data-go="rooms">Talk rooms</button></div>' +
      '<p class="note">Tip: choose Quiz, Flashcards or Mock exam above the notes box, then press the Ask my notes button on your results to ask Sage questions about your module.</p></div>';
  } else {
    h += '<div class="subjgrid">' + SUBJECTS.map(s => { const n = lvList(s.id, LV.level).length; return n ? '<button class="sj" data-sj="' + s.id + '"><span class="sji">' + esc(s.icon) + '</span><b>' + esc(s.name) + '</b><small>' + esc(s.blurb) + '</small><em>' + n + ' topic' + (n > 1 ? 's' : '') + '</em></button>' : ''; }).join('') + '</div>';
  }
  const done = Object.keys(progress()).map(topicById).filter(Boolean);
  if (done.length) {
    const weak = done.filter(t => progress()[t.id].best < 60).slice(0, 4);
    h += '<div class="card" style="margin-top:16px"><h3 style="margin-top:0">Your progress</h3><p>' + done.length + ' topic' + (done.length > 1 ? 's' : '') + ' practised. Average best score: <b>' + Math.round(done.reduce((a, t) => a + progress()[t.id].best, 0) / done.length) + '%</b>.</p>' +
      (weak.length ? '<p class="note">Worth another go:</p><div class="fl">' + weak.map(t => '<button data-tp="' + t.id + '">' + esc(t.title) + ' (' + progress()[t.id].best + '%)</button>').join('') + '</div>' : '<p class="note">Nice work, no weak spots right now.</p>') + '</div>';
  }
  h += '<p class="note" style="margin-top:14px">Every practice question is made by the computer and checked in two ways, so the answers are exactly right. Lessons are written from well-established school content and each topic shows whether a teacher has checked it. Spotted something wrong? Press <b>Report a mistake</b> on any question.</p>';
  $('#lvBody').innerHTML = h;
}

/* ---------- a subject: its topics at this level ---------- */
function renderSubject() {
  const s = subjById(LV.subj); LV.topic = null;
  crumbs([{ t: 'Learn', go: 'home' }, { t: levelName(LV.level), go: 'home' }, { t: s.name }]);
  const list = lvList(s.id, LV.level), p = progress();
  $('#lvBody').innerHTML = '<h2>' + esc(s.name) + '</h2><p class="lead" style="font-size:16px">' + esc(levelName(LV.level)) + '. Choose a topic.</p><div class="subjgrid">' +
    list.map(t => '<button class="sj" data-tp="' + t.id + '"><b>' + esc(t.title) + '</b><small>' + esc(t.blurb) + '</small>' + (p[t.id] ? '<em>Best: ' + p[t.id].best + '%</em>' : '<em>Not tried yet</em>') + '</button>').join('') + '</div>';
}

/* ---------- a topic: lesson, example, practice ---------- */
function questionHTML(q, i) {
  let input;
  if (q.type === 'choice') input = '<div class="lopts">' + q.opts.map((o, k) => '<label class="lopt"><input type="radio" name="lq' + i + '" value="' + k + '"> <span>' + esc(o) + '</span></label>').join('') + '</div>';
  else input = '<input class="lin" data-i="' + i + '" inputmode="' + (q.type === 'num' ? 'decimal' : 'text') + '" autocomplete="off" aria-label="Your answer to question ' + (i + 1) + '" placeholder="Your answer">' + (q.hint ? '<small class="note">' + esc(q.hint) + '</small>' : '');
  return '<div class="lq" id="lq' + i + '"><div class="lqh"><b>Question ' + (i + 1) + '</b><button class="lnk2" data-rep="' + i + '">Report a mistake</button></div><p class="lqq">' + q.q + '</p>' + input + '<div class="lfbox"></div></div>';
}
function renderTopic() {
  const t = LV.topic, s = subjById(t.subj);
  crumbs([{ t: 'Learn', go: 'home' }, { t: levelName(t.level), go: 'home' }, { t: s.name, go: 'subj' }, { t: t.title }]);
  LV.qs = makeQuestions(t, 5, LV.seed); LV.exQ = makeQuestions(t, 1, LV.exSeed)[0]; LV.checked = false;
  const ex = LV.exQ, teacher = S.user && S.user.role === 'teacher';
  $('#lvBody').innerHTML = '<div class="sheet-head"><h2 style="margin:0">' + esc(t.title) + '</h2>' + reviewBadge(t) + '</div><p class="note">' + esc(s.name) + ' &middot; ' + esc(levelName(t.level)) + '</p>' +
    '<div class="card"><h3 style="margin-top:0">Key ideas</h3><ul class="ideas">' + t.ideas.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' +
    '<div class="card" style="margin-top:14px"><div class="sheet-head"><h3 style="margin:0">Worked example</h3><button class="btn ghost sm" data-la="example">Another example</button></div><p class="lqq">' + ex.q + '</p><ol class="steps">' + ex.steps.map(x => '<li>' + x + '</li>').join('') + '</ol><p><b>Answer: ' + ex.disp + '</b></p></div>' +
    '<div class="card" style="margin-top:14px"><div class="sheet-head"><h3 style="margin:0">Practice</h3><span class="note">5 questions</span></div><div id="lvQs">' + LV.qs.map(questionHTML).join('') + '</div><div id="lvScore" role="status"></div><div class="row"><button class="btn" data-la="check">Check my answers</button><button class="btn ghost" data-la="new">New questions</button></div></div>' +
    (teacher ? '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">For teachers: make a worksheet</h3><p class="note">Makes a printable worksheet with a memo. Use the same code later to get the same worksheet back.</p><div class="two"><div><label for="wsN">Number of questions</label><select id="wsN"><option>5</option><option selected>10</option><option>15</option><option>20</option></select></div><div><label for="wsCode">Worksheet code (optional)</label><input id="wsCode" placeholder="e.g. 482913-10"></div></div><div class="row"><button class="btn" data-la="work">Make worksheet</button></div><div id="lvWork"></div></div>' : '');
}

function readAnswer(q, i) {
  const box = $('#lq' + i);
  if (q.type === 'choice') { const r = box.querySelector('input:checked'); return r ? r.value : ''; }
  return box.querySelector('input.lin').value;
}
function checkAll() {
  const t = LV.topic; let right = 0;
  LV.qs.forEach((q, i) => {
    const val = readAnswer(q, i), box = $('#lq' + i + ' .lfbox'), blank = q.type === 'choice' ? val === '' : !String(val).trim(), res = blank ? { ok: false, note: q.type === 'choice' ? 'Choose an answer.' : 'You left this one blank.' } : checkAnswer(q, val);
    if (res.ok) right++;
    box.innerHTML = '<div class="lfb ' + (res.ok ? 'ok' : 'no') + '">' + (res.ok ? '&#10003; Correct!' : '&#10007; Not quite. <b>Correct answer: ' + (q.type === 'choice' ? esc(q.opts[q.a]) : q.disp) + '</b>' + (res.note ? ' <span class="note">' + esc(res.note) + '</span>' : '')) + '</div>' +
      '<details class="stp"' + (res.ok ? '' : ' open') + '><summary>Show the steps</summary><ol class="steps">' + q.steps.map(x => '<li>' + x + '</li>').join('') + '</ol></details>';
    $('#lq' + i).classList.toggle('right', res.ok); $('#lq' + i).classList.toggle('wrong', !res.ok);
  });
  const pc = Math.round(right / LV.qs.length * 100), p = progress(), old = p[t.id] || { best: 0, tries: 0 };
  p[t.id] = { best: Math.max(old.best, pc), tries: old.tries + 1, last: pc, at: new Date().toISOString() }; save();
  $('#lvScore').innerHTML = '<div class="qdone"><b>You got ' + right + ' out of ' + LV.qs.length + ' (' + pc + '%).</b> ' + (pc === 100 ? 'Perfect score!' : pc >= 80 ? 'Great work!' : pc >= 50 ? 'Good effort. Read the steps, then try new questions.' : 'Keep going. Re-read the key ideas and try again.') + '</div>';
  LV.checked = true; $('#lvScore').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------- report a mistake ---------- */
function reportQ(i) {
  const t = LV.topic, q = i === 'ex' ? LV.exQ : LV.qs[+i];
  const info = { topic: t.id, seed: i === 'ex' ? LV.exSeed : LV.seed, index: i, question: plainText(q.q), answerShown: plainText(q.disp) };
  const body = 'Topic: ' + t.title + ' (' + t.id + ')\nSeed: ' + info.seed + ', question ' + (i === 'ex' ? 'example' : (+i + 1)) + '\nQuestion: ' + info.question + '\nAnswer shown: ' + info.answerShown + '\n\nWhat is wrong:\n';
  if (API.base) { API.call('/v1/learn/reports', info).then(() => toast('Thank you! We will check it.')).catch(() => toast('We couldn\u2019t send that. Please try again.')); return; }
  const to = LEARN.reportEmail;
  if (to && to.charAt(0) !== '[') { location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Learn: possible mistake in ' + t.id) + '&body=' + encodeURIComponent(body); return; }
  (navigator.clipboard ? navigator.clipboard.writeText(body) : Promise.reject()).then(() => toast('Details copied. Please send them to your teacher or developer.')).catch(() => toast('Reporting isn\u2019t switched on yet.'));
}

/* ---------- teacher worksheet and memo ---------- */
function makeWorksheet() {
  const t = LV.topic, code = ($('#wsCode').value || '').trim().match(/^(\d{1,10})-(\d{1,2})$/);
  const seed = code ? +code[1] : newSeed(), n = code ? Math.min(30, Math.max(1, +code[2])) : +$('#wsN').value, qs = makeQuestions(t, n, seed), id = seed + '-' + n;
  LV.work = { t, seed, qs, id };
  const ws = '<div id="wsPaper"><h3>' + esc(t.title) + ' worksheet</h3><p>Name: ______________________ &nbsp; Date: ____________ &nbsp; Code: <b>' + id + '</b></p><ol class="wsq">' + qs.map(q => '<li>' + q.q + (q.type === 'choice' ? '<br>' + q.opts.map((o, k) => '&#9744; ' + 'ABCD'[k] + ') ' + esc(o)).join(' &nbsp; ') : '<br>Answer: ______________________') + '</li>').join('') + '</ol></div>';
  const memo = '<div id="wsMemo"><h3>Memo: ' + esc(t.title) + '</h3><p>Code: <b>' + id + '</b></p><ol class="wsq">' + qs.map(q => '<li><b>' + (q.type === 'choice' ? 'ABCD'[q.a] + ') ' + esc(q.opts[q.a]) : q.disp) + '</b><br><small>' + q.steps.join(' &middot; ') + '</small></li>').join('') + '</ol></div>';
  $('#lvWork').innerHTML = '<div class="row"><button class="btn ghost sm" data-la="print-ws">Print worksheet</button><button class="btn ghost sm" data-la="print-memo">Print memo</button><button class="btn sm" data-la="to-marking">Use memo in marking</button></div>' + ws + memo;
}
function printArea(id) {
  const el = $(id); if (!el) return;
  el.classList.add('print-area'); document.body.classList.add('printing'); setTimeout(() => window.print(), 150);
}
window.addEventListener('afterprint', () => { document.querySelectorAll('.print-area').forEach(x => x.classList.remove('print-area')); document.body.classList.remove('printing'); });
function memoToMarking() {
  if (!LV.work) return;
  $('#memo').value = LV.work.qs.map(q => q.type === 'choice' ? q.opts[q.a] : memoLine(q)).join('\n');
  if (!$('#tMod').value) $('#tMod').value = subjById(LV.work.t.subj).name;
  $('#tTitle').value = LV.work.t.title + ' (' + LV.work.id + ')';
  ['memo', 'tMod', 'tTitle'].forEach(id => $('#' + id).dispatchEvent(new Event('input')));
  show('teacher'); setTimeout(() => $('#markCard').scrollIntoView({ behavior: 'smooth' }), 80);
  toast('Memo copied into the marking tool. Add the student papers and mark away.');
}

/* ---------- clicks ---------- */
$('#learn').addEventListener('click', e => {
  const b = e.target.closest('[data-lvl],[data-sj],[data-tp],[data-lv],[data-la],[data-rep]'); if (!b) return;
  if (b.dataset.lvl !== undefined) { LV.level = +b.dataset.lvl; renderLearnHome(); }
  else if (b.dataset.sj) { LV.subj = b.dataset.sj; renderSubject(); }
  else if (b.dataset.tp) { const t = topicById(b.dataset.tp); LV.level = t.level; LV.subj = t.subj; LV.topic = t; LV.seed = newSeed(); LV.exSeed = newSeed(); renderTopic(); window.scrollTo(0, 0); }
  else if (b.dataset.lv) { if (b.dataset.lv === 'home') { LV.topic = null; LV.subj = null; renderLearnHome(); } else { LV.topic = null; renderSubject(); } }
  else if (b.dataset.rep !== undefined) reportQ(b.dataset.rep);
  else switch (b.dataset.la) {
    case 'check': checkAll(); break;
    case 'new': LV.seed = newSeed(); renderTopic(); $('#lvQs').scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
    case 'example': LV.exSeed = newSeed(); renderTopic(); break;
    case 'work': makeWorksheet(); break;
    case 'print-ws': printArea('#wsPaper'); break;
    case 'print-memo': printArea('#wsMemo'); break;
    case 'to-marking': memoToMarking(); break;
  }
});
$('#learn').addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.classList || !e.target.classList.contains('lin')) return; e.preventDefault();
  const all = [].slice.call(document.querySelectorAll('#lvQs input.lin')), i = all.indexOf(e.target);
  if (i < all.length - 1) all[i + 1].focus(); else checkAll();
});
const learnNote = () => { const n = Object.keys(progress()).length; return n ? n + ' topic' + (n > 1 ? 's' : '') + ' practised. Keep it up!' : 'Study a school subject with lessons and practice questions.'; };
