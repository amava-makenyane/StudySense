/* ===== Reference manager =====
   For essays and assignments. Add sources once, pick a style, copy a tidy reference list.
   Styles: Harvard, APA 7th, MLA 9th, IEEE, Chicago (author-date). Sources are stored as fields
   (S.refs), so switching style re-formats the whole list. Universities use slightly different
   versions of each style, so students should still check their institution's guide. */
const REF_STYLES = [['harvard', 'Harvard'], ['apa', 'APA 7th'], ['mla', 'MLA 9th'], ['ieee', 'IEEE'], ['chicago', 'Chicago (author-date)']];
const REF_TYPES = [['book', 'Book'], ['journal', 'Journal article'], ['web', 'Website'], ['chapter', 'Book chapter']];
const LIST_HEAD = { harvard: 'Reference list', apa: 'References', mla: 'Works Cited', ieee: 'References', chicago: 'References' };
/* [id, label, kind, types it applies to, placeholder] */
const REF_FIELDS = [
  ['authors', 'Authors (one per line: "Surname, Given" or "Given Surname")', 'ta', 'book journal web chapter', 'Mokoena, Thandi\nDlamini, Sipho'],
  ['org', 'The author is an organisation (for example a company or government body)', 'cb', 'book journal web chapter', ''],
  ['year', 'Year', 'in', 'book journal web chapter', '2024'],
  ['title', 'Title', 'in', 'book journal web chapter', ''],
  ['journal', 'Journal name', 'in', 'journal', ''],
  ['vol', 'Volume', 'in', 'journal', ''],
  ['iss', 'Issue', 'in', 'journal', ''],
  ['bt', 'Title of the book the chapter is in', 'in', 'chapter', ''],
  ['eds', 'Editors (as you want them shown)', 'in', 'chapter', ''],
  ['ed', 'Edition (number)', 'in', 'book', '2'],
  ['place', 'Place of publication', 'in', 'book chapter', 'Cape Town'],
  ['pub', 'Publisher', 'in', 'book chapter', ''],
  ['pages', 'Pages (for example 45-67)', 'in', 'journal chapter', ''],
  ['doi', 'DOI', 'in', 'journal book chapter', '10.1000/xyz123'],
  ['site', 'Website name', 'in', 'web', ''],
  ['url', 'Web address (URL)', 'in', 'web', 'https://'],
  ['accessed', 'Date you looked at it', 'dt', 'web', '']
];
let editId = null;

const e2 = s => esc(String(s == null ? '' : s));
const plain = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const ordn = n => { n = +n; const v = n % 100; return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDate(s, us) {
  if (!s) return ''; const p = s.split('-'); if (p.length < 3) return s;
  return us ? MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0] : (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0];
}
const doiUrl = d => d ? 'https://doi.org/' + d.replace(/^https?:\/\/(dx\.)?doi\.org\//, '').trim() : '';

/* ---------- names ---------- */
function parseAuthors(txt, org) {
  return (txt || '').split('\n').map(x => x.trim()).filter(Boolean).map(l => {
    if (org) return { org: l };
    if (l.indexOf(',') > -1) { const p = l.split(','); return { last: p[0].trim(), given: p.slice(1).join(' ').trim() }; }
    const w = l.split(/\s+/);
    return w.length > 1 ? { last: w[w.length - 1], given: w.slice(0, -1).join(' ') } : { org: l };
  });
}
const initialsOf = g => (g || '').split(/[\s.\-]+/).filter(Boolean).map(w => w[0].toUpperCase() + '.');
const ini = (a, sp) => initialsOf(a.given).join(sp ? ' ' : '');
const fullName = a => a.org || (a.given ? a.given + ' ' + a.last : a.last);
const invName = a => a.org || (a.given ? a.last + ', ' + a.given : a.last);

function authorsFor(as, st) {
  const n = as.length; if (!n) return '';
  const last = a => a.org || a.last;
  if (st === 'harvard') {
    const f = a => a.org || (a.last + (a.given ? ', ' + ini(a, false) : ''));
    if (n >= 4) return f(as[0]) + ' et al.';
    return n === 1 ? f(as[0]) : as.slice(0, -1).map(f).join(', ') + ' and ' + f(as[n - 1]);
  }
  if (st === 'apa') {
    const f = a => a.org || (a.last + (a.given ? ', ' + ini(a, true) : ''));
    if (n === 1) return f(as[0]);
    if (n > 20) return as.slice(0, 19).map(f).join(', ') + ', . . . ' + f(as[n - 1]);
    return as.slice(0, -1).map(f).join(', ') + ', & ' + f(as[n - 1]);
  }
  if (st === 'mla') {
    if (n === 1) return invName(as[0]);
    return n === 2 ? invName(as[0]) + ', and ' + fullName(as[1]) : invName(as[0]) + ', et al.';
  }
  if (st === 'ieee') {
    const f = a => a.org || ((ini(a, true) ? ini(a, true) + ' ' : '') + a.last);
    if (n > 6) return f(as[0]) + ' et al.';
    if (n === 1) return f(as[0]);
    return n === 2 ? f(as[0]) + ' and ' + f(as[1]) : as.slice(0, -1).map(f).join(', ') + ', and ' + f(as[n - 1]);
  }
  const rest = as.slice(1).map(fullName);   // chicago
  if (n === 1) return invName(as[0]);
  if (n === 2) return invName(as[0]) + ', and ' + rest[0];
  if (n > 10) return invName(as[0]) + ', ' + rest.slice(0, 6).join(', ') + ', et al.';
  return invName(as[0]) + ', ' + rest.slice(0, -1).join(', ') + ', and ' + rest[rest.length - 1];
}

/* ---------- the reference itself ---------- */
function fmt(r, st) {
  const as = parseAuthors(r.authors, r.org), A = authorsFor(as, st), noA = !A;
  const yr = e2(r.year || 'n.d.'), T = e2(r.title), it = s => '<i>' + e2(s) + '</i>';
  const pg = e2((r.pages || '').replace(/\s*-+\s*/g, '\u2013')), doi = e2(doiUrl(r.doi)), doiB = e2((r.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//, '').trim()), url = e2(r.url);
  const edn = r.ed && +r.ed > 1 ? ordn(r.ed) : '', pub = e2(r.pub), pl = e2(r.place), jr = e2(r.journal), vol = e2(r.vol), iss = e2(r.iss);
  const bt = e2(r.bt), eds = e2(r.eds), site = e2(r.site), acc = r.accessed ? 1 : 0;
  const b = r.type === 'book', c = r.type === 'chapter', j = r.type === 'journal', w = r.type === 'web';
  const dot = s => /[.?!]$/.test(plain(s)) ? s : s + '.';
  const pp = /[\u2013,]/.test(pg) ? 'pp. ' : 'p. ';
  let s = '';
  if (st === 'harvard') {
    const L = A || (b || w ? it(r.title) : '\u2018' + T + '\u2019');
    s = L + ' (' + yr + ') ';
    if (b) s += (A ? it(r.title) + '. ' : '') + (edn ? edn + ' edn. ' : '') + (pl ? pl + ': ' : '') + pub + '.';
    if (j) s += (A ? '\u2018' + T + '\u2019, ' : '') + it(r.journal) + (vol ? ', ' + vol : '') + (iss ? '(' + iss + ')' : '') + (pg ? ', ' + pp + pg : '') + '.' + (doiB ? ' doi:' + doiB + '.' : '');
    if (w) s += (A ? it(r.title) + '. ' : '') + 'Available at: ' + url + (acc ? ' (Accessed: ' + fmtDate(r.accessed) + ').' : '.');
    if (c) s += (A ? '\u2018' + T + '\u2019, ' : '') + 'in ' + (eds ? eds + ' (ed.) ' : '') + it(r.bt) + '. ' + (pl ? pl + ': ' : '') + pub + (pg ? ', ' + pp + pg : '') + '.';
  } else if (st === 'apa') {
    const edTxt = b && edn ? ' (' + edn + ' ed.)' : '';
    const L = A || (b || w ? it(r.title) + edTxt : T);
    s = dot(L) + ' (' + yr + '). ';
    if (b) s += (A ? it(r.title) + edTxt + '. ' : '') + pub + '.';
    if (j) s += (A ? dot(T) + ' ' : '') + it(r.journal) + (vol ? ', <i>' + vol + '</i>' : '') + (iss ? '(' + iss + ')' : '') + (pg ? ', ' + pg : '') + '.' + (doi ? ' ' + doi : '');
    if (w) s += (A ? it(r.title) + '. ' : '') + (site && site !== A ? site + '. ' : '') + url;
    if (c) s += (A ? dot(T) + ' ' : '') + 'In ' + (eds ? eds + ' (Ed.), ' : '') + it(r.bt) + (pg ? ' (pp. ' + pg + ')' : '') + '. ' + pub + '.';
  } else if (st === 'mla') {
    s = A ? dot(A) + ' ' : '';
    if (b) s += it(r.title) + '. ' + (edn ? edn + ' ed., ' : '') + (pub ? pub + ', ' : '') + yr + '.';
    if (j) s += '\u201C' + T + '.\u201D ' + it(r.journal) + ', ' + (vol ? 'vol. ' + vol + ', ' : '') + (iss ? 'no. ' + iss + ', ' : '') + yr + (pg ? ', pp. ' + pg : '') + '.' + (doi ? ' ' + doi + '.' : '');
    if (w) s += '\u201C' + T + '.\u201D ' + (site ? it(r.site) + ', ' : '') + yr + ', ' + url + '.' + (acc ? ' Accessed ' + fmtDate(r.accessed) + '.' : '');
    if (c) s += '\u201C' + T + '.\u201D ' + it(r.bt) + ', ' + (eds ? 'edited by ' + eds + ', ' : '') + (pub ? pub + ', ' : '') + yr + (pg ? ', pp. ' + pg : '') + '.';
  } else if (st === 'ieee') {
    s = A ? A + ', ' : '';
    if (b) s += it(r.title) + (edn ? ', ' + edn + ' ed. ' : '. ') + (pl ? pl + ': ' : '') + (pub ? pub + ', ' : '') + yr + '.';
    if (j) s += '\u201C' + T + ',\u201D ' + it(r.journal) + ', ' + (vol ? 'vol. ' + vol + ', ' : '') + (iss ? 'no. ' + iss + ', ' : '') + (pg ? 'pp. ' + pg + ', ' : '') + yr + '.' + (doiB ? ' doi: ' + doiB + '.' : '');
    if (w) s += '\u201C' + T + '.\u201D ' + (site ? site + '. ' : '') + '[Online]. Available: ' + url + (acc ? ' (accessed ' + fmtDate(r.accessed) + ').' : '');
    if (c) s += '\u201C' + T + ',\u201D in ' + it(r.bt) + (eds ? ', ' + eds + ', Ed. ' : '. ') + (pl ? pl + ': ' : '') + (pub ? pub + ', ' : '') + yr + (pg ? ', pp. ' + pg : '') + '.';
  } else {
    s = A ? dot(A) + ' ' : '';
    s += yr + '. ';
    if (b) s += it(r.title) + '. ' + (edn ? edn + ' ed. ' : '') + (pl ? pl + ': ' : '') + pub + '.';
    if (j) s += '\u201C' + T + '.\u201D ' + it(r.journal) + ' ' + vol + (iss ? ' (' + iss + ')' : '') + (pg ? ': ' + pg : '') + '.' + (doi ? ' ' + doi + '.' : '');
    if (w) s += '\u201C' + T + '.\u201D ' + (site ? site + '. ' : '') + (acc ? 'Accessed ' + fmtDate(r.accessed, 1) + '. ' : '') + url + '.';
    if (c) s += '\u201C' + T + '.\u201D In ' + it(r.bt) + (eds ? ', edited by ' + eds : '') + (pg ? ', ' + pg : '') + '. ' + (pl ? pl + ': ' : '') + pub + '.';
  }
  return s.replace(/\s+/g, ' ').replace(/ ,/g, ',').replace(/\.\s*\./g, '.').replace(/,\s*\./g, '.').replace(/:\s*\./g, '.').trim();
}

/* ---------- the in-text citation ---------- */
function inText(r, st, n, page) {
  if (st === 'ieee') return '[' + n + ']';
  const as = parseAuthors(r.authors, r.org), k = as.length, yr = r.year || 'n.d.';
  const L = a => a.org || a.last;
  let nm;
  if (!k) { const t = (r.title || 'Untitled').split(/\s+/).slice(0, 4).join(' '); nm = (r.type === 'book' || r.type === 'web') ? '<i>' + e2(t) + '</i>' : '\u2018' + e2(t) + '\u2019'; }
  else if (st === 'harvard' || st === 'apa' || st === 'chicago') {
    const amp = st === 'apa' ? ' & ' : ' and ';
    if (k === 1) nm = e2(L(as[0]));
    else if (k === 2) nm = e2(L(as[0])) + amp + e2(L(as[1]));
    else if (k === 3 && st !== 'apa') nm = e2(L(as[0])) + ', ' + e2(L(as[1])) + (st === 'chicago' ? ', and ' : ' and ') + e2(L(as[2]));
    else nm = e2(L(as[0])) + ' et al.';
  } else {
    nm = k === 1 ? e2(L(as[0])) : k === 2 ? e2(L(as[0])) + ' and ' + e2(L(as[1])) : e2(L(as[0])) + ' et al.';
  }
  const pg = (page || '').trim(), lab = /[-\u2013,]/.test(pg) ? 'pp. ' : 'p. ';
  if (st === 'mla') return '(' + nm + (pg ? ' ' + e2(pg) : '') + ')';
  if (st === 'chicago') return '(' + nm + ' ' + e2(yr) + (pg ? ', ' + e2(pg) : '') + ')';
  return '(' + nm + ', ' + e2(yr) + (pg ? ', ' + lab + e2(pg) : '') + ')';
}

/* ---------- sorting and list ---------- */
const sortKey = r => { const a = parseAuthors(r.authors, r.org)[0]; return ((a && (a.org || a.last)) || r.title || '').toLowerCase(); };
function orderedRefs() {
  const R = (S.refs || []).slice();
  return (S.refStyle || 'harvard') === 'ieee' ? R : R.sort((a, b) => sortKey(a) < sortKey(b) ? -1 : 1);
}
function listHTML() {
  const st = S.refStyle || 'harvard';
  return orderedRefs().map((r, i) => (st === 'ieee' ? '[' + (i + 1) + '] ' : '') + fmt(r, st));
}

/* ---------- page ---------- */
function drawStyles() {
  const cur = S.refStyle || 'harvard';
  $('#refStyles').innerHTML = REF_STYLES.map(s => '<button aria-pressed="' + (s[0] === cur) + '" data-rs="' + s[0] + '">' + s[1] + '</button>').join('');
}
function drawFields() {
  const t = $('#rf_type').value;
  $('#refFields').innerHTML = REF_FIELDS.filter(f => f[3].split(' ').indexOf(t) > -1).map(f => {
    const id = 'rf_' + f[0];
    if (f[2] === 'cb') return '<label class="chk"><input type="checkbox" id="' + id + '"><span>' + f[1] + '</span></label>';
    if (f[2] === 'ta') return '<label for="' + id + '">' + f[1] + '</label><textarea id="' + id + '" rows="3" placeholder="' + e2(f[4]) + '"></textarea>';
    return '<label for="' + id + '">' + f[1] + '</label><input id="' + id + '" type="' + (f[2] === 'dt' ? 'date' : 'text') + '" placeholder="' + e2(f[4]) + '">';
  }).join('');
}
function readForm() {
  const r = { type: $('#rf_type').value };
  REF_FIELDS.forEach(f => { const el = $('#rf_' + f[0]); if (el) r[f[0]] = f[2] === 'cb' ? el.checked : el.value.trim(); });
  return r;
}
function fillForm(r) {
  $('#rf_type').value = r.type; drawFields();
  REF_FIELDS.forEach(f => { const el = $('#rf_' + f[0]); if (el && r[f[0]] != null) { if (f[2] === 'cb') el.checked = !!r[f[0]]; else el.value = r[f[0]]; } });
}
function clearForm() { editId = null; $('#rf_type').value = 'book'; drawFields(); $('#rfLook').value = ''; $('#rfAdd').textContent = 'Add to my list'; $('#rfH').textContent = 'Add a source'; }

function renderRefs() {
  const st = S.refStyle || 'harvard', R = orderedRefs();
  drawStyles();
  $('#rlH').textContent = LIST_HEAD[st] + (R.length ? ' (' + R.length + ')' : '');
  $('#refList').innerHTML = R.length ? R.map((r, i) => '<div class="ref" data-id="' + r.id + '"><div class="refT">' + (st === 'ieee' ? '[' + (i + 1) + '] ' : '') + fmt(r, st) + '</div>' +
    '<div class="note refI">In your essay: <b class="itx">' + inText(r, st, i + 1, '') + '</b> <input class="pgin" aria-label="Page number for a quote" placeholder="page (optional)"></div>' +
    '<div class="row" style="margin:8px 0 0"><button class="btn ghost sm" data-rc="ref">Copy reference</button><button class="btn ghost sm" data-rc="txt">Copy in-text</button><button class="btn ghost sm" data-rc="edit">Edit</button><button class="btn ghost sm" data-rc="del">Delete</button></div></div>').join('')
    : '<p class="note">Nothing here yet. Add your first source on the left, or paste a DOI or ISBN to fill it in for you.</p>';
}
function copyRich(html, text) {
  try {
    if (navigator.clipboard && window.ClipboardItem) return navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
    return navigator.clipboard.writeText(text);
  } catch (e) { return Promise.reject(e); }
}
const okCopy = () => toast('Copied. Paste it straight into your essay.');
const badCopy = () => toast('Couldn\u2019t copy. Select the text and copy it by hand.');

$('#refStyles').addEventListener('click', e => { const b = e.target.closest('[data-rs]'); if (b) { S.refStyle = b.dataset.rs; save(); renderRefs(); } });
$('#rf_type').innerHTML = REF_TYPES.map(t => '<option value="' + t[0] + '">' + t[1] + '</option>').join('');
$('#rf_type').onchange = () => { const keep = readForm(); drawFields(); fillForm(Object.assign(keep, { type: $('#rf_type').value })); };
drawFields();

$('#rfAdd').onclick = () => {
  const r = readForm();
  if (!r.title) { toast('Add a title first.'); return; }
  S.refs = S.refs || [];
  if (editId) { const i = S.refs.findIndex(x => x.id === editId); r.id = editId; if (i > -1) S.refs[i] = r; toast('Source updated.'); }
  else { r.id = Date.now(); S.refs.push(r); toast('Added. Your list is sorted for you.'); }
  save(); clearForm(); renderRefs();
};
$('#rfClear').onclick = clearForm;

$('#refList').addEventListener('click', e => {
  const b = e.target.closest('[data-rc]'); if (!b) return;
  const box = b.closest('.ref'), id = +box.dataset.id, r = (S.refs || []).find(x => x.id === id); if (!r) return;
  if (b.dataset.rc === 'del') { S.refs = S.refs.filter(x => x.id !== id); save(); renderRefs(); return; }
  if (b.dataset.rc === 'edit') { editId = id; fillForm(r); $('#rfAdd').textContent = 'Save changes'; $('#rfH').textContent = 'Edit source'; $('#rf_title').scrollIntoView({ behavior: 'smooth' }); return; }
  const h = b.dataset.rc === 'ref' ? box.querySelector('.refT').innerHTML : box.querySelector('.itx').innerHTML;
  copyRich(h, plain(h)).then(okCopy).catch(badCopy);
});
$('#refList').addEventListener('input', e => {
  const inp = e.target.closest('.pgin'); if (!inp) return;
  const box = inp.closest('.ref'), r = (S.refs || []).find(x => x.id === +box.dataset.id), st = S.refStyle || 'harvard';
  const n = [].indexOf.call(box.parentNode.children, box) + 1;
  box.querySelector('.itx').innerHTML = inText(r, st, n, inp.value);
});

/* copy and download the whole list */
const hangs = L => L.map(x => '<p style="margin:0 0 8pt 36pt;text-indent:-36pt">' + x + '</p>').join('');
$('#rlCopy').onclick = () => { const L = listHTML(); if (!L.length) { toast('Add a source first.'); return; } copyRich(hangs(L), L.map(plain).join('\n\n')).then(okCopy).catch(badCopy); };
$('#rlTxt').onclick = () => { const L = listHTML(); if (!L.length) return; dl(LIST_HEAD[S.refStyle || 'harvard'] + '\n\n' + L.map(plain).join('\n\n'), 'my-references.txt', 'text/plain'); };
$('#rlDoc').onclick = () => { const L = listHTML(); if (!L.length) return; dl('<html><head><meta charset="utf-8"></head><body><h2>' + LIST_HEAD[S.refStyle || 'harvard'] + '</h2>' + hangs(L) + '</body></html>', 'my-references.doc', 'application/msword'); };
function dl(text, name, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); }

/* ---------- look up a DOI or ISBN ---------- */
$('#rfGo').onclick = async () => {
  const v = $('#rfLook').value.trim(); if (!v) { toast('Paste a DOI or an ISBN first.'); return; }
  const btn = $('#rfGo'); btn.disabled = true; btn.textContent = 'Looking\u2026';
  try {
    const doi = v.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    if (/^10\.\d{4,}\//.test(doi)) {
      const m = (await (await fetch('https://api.crossref.org/works/' + encodeURIComponent(doi))).json()).message;
      const ty = m.type === 'journal-article' ? 'journal' : m.type === 'book-chapter' ? 'chapter' : 'book';
      fillForm({ type: ty, authors: (m.author || []).map(a => (a.family || a.name || '') + (a.given ? ', ' + a.given : '')).join('\n'), year: String((((m.issued || {})['date-parts'] || [[]])[0] || [])[0] || ''), title: (m.title || [''])[0], journal: ty === 'journal' ? (m['container-title'] || [''])[0] : '', bt: ty === 'chapter' ? (m['container-title'] || [''])[0] : '', vol: m.volume || '', iss: m.issue || '', pages: m.page || '', pub: m.publisher || '', doi: m.DOI || doi });
    } else {
      const isbn = v.replace(/[^0-9Xx]/g, '');
      if (isbn.length !== 10 && isbn.length !== 13) throw new Error('format');
      const d = (await (await fetch('https://openlibrary.org/api/books?bibkeys=ISBN:' + isbn + '&format=json&jscmd=data')).json())['ISBN:' + isbn];
      if (!d) throw new Error('none');
      fillForm({ type: 'book', authors: (d.authors || []).map(a => a.name).join('\n'), year: ((d.publish_date || '').match(/\d{4}/) || [''])[0], title: d.title + (d.subtitle ? ': ' + d.subtitle : ''), pub: (d.publishers || [{}])[0].name || '', place: (d.publish_places || [{}])[0].name || '' });
    }
    toast('Found it! Check the details, then press Add.');
  } catch (err) { toast('I couldn\u2019t find that. Check the DOI or ISBN, or type the details in.'); }
  btn.disabled = false; btn.textContent = 'Look up';
};
