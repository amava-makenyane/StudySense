/* ===== Reading files in the browser =====
   Text, CSV, Word (.docx), PowerPoint (.pptx), Excel (.xlsx .xls .xlsm .ods), PDF,
   and photos or scans (OCR). Old binary .doc and .ppt files need saving as .docx/.pptx. */
const IMG = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'];
const TXT = ['txt', 'md', 'csv', 'json', 'html', 'htm', 'xml', 'rtf'];
const XLS = ['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'];
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const stripTags = s => decode(s.replace(/<[^>]+>/g, ''));

/* Returns text with one line per paragraph, row or slide item. Resolves '' when unreadable. */
function readOne(f, say) {
  return new Promise(res => {
    const ext = f.name.toLowerCase().split('.').pop();
    const fail = () => res('');
    const asText = () => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = fail; r.readAsText(f); };
    const asBuf = cb => { const r = new FileReader(); r.onload = () => cb(r.result); r.onerror = fail; r.readAsArrayBuffer(f); };

    if (TXT.includes(ext) || f.type.indexOf('text/') === 0) return asText();

    if (ext === 'docx' && window.JSZip) return asBuf(b =>
      JSZip.loadAsync(b).then(z => z.file('word/document.xml').async('string'))
        .then(x => res(x.split('</w:p>').map(stripTags).join('\n'))).catch(fail));

    if (ext === 'pptx' && window.JSZip) return asBuf(b =>
      JSZip.loadAsync(b).then(z => {
        const names = Object.keys(z.files).filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k))
          .sort((a, c) => parseInt(a.match(/\d+/)[0]) - parseInt(c.match(/\d+/)[0]));
        return Promise.all(names.map(k => z.file(k).async('string')));
      }).then(xs => res(xs.map(x => x.split('</a:p>').map(stripTags).join('\n')).join('\n'))).catch(fail));

    if (XLS.includes(ext) && window.XLSX) return asBuf(b => {
      try {
        const wb = XLSX.read(b, { type: 'array' }), out = [];
        wb.SheetNames.forEach(n => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, blankrows: false }).forEach(row => {
          const line = row.filter(c => c !== '' && c != null).join(' ');
          if (line) out.push(line);
        }));
        res(out.join('\n'));
      } catch (e) { fail(); }
    });

    if (ext === 'pdf' && window.pdfjsLib) return asBuf(b => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfjsLib.getDocument({ data: new Uint8Array(b) }).promise.then(d => {
        const out = []; let p = Promise.resolve();
        for (let i = 1; i <= d.numPages; i++) p = p.then(() => d.getPage(i).then(pg => pg.getTextContent()).then(c => {
          let line = ''; c.items.forEach(x => { line += x.str + (x.hasEOL ? '\n' : ' '); }); out.push(line);
        }));
        return p.then(() => res(out.join('\n')));
      }).catch(fail);
    });

    if (IMG.includes(ext) || f.type.indexOf('image/') === 0) {
      if (say) say('reading the photo');
      return API.ocr(f, say).then(res).catch(fail);
    }
    fail();
  });
}

/* Makes plain lines read like sentences, so the summariser can find them. */
const notesify = t => t.split('\n').map(l => l.trim()).filter(Boolean).map(l => /[.!?:]$/.test(l) ? l : l + '.').join(' ');

/* Notes upload: reads every file, adds the text to a textarea and shows friendly chips. No length limit. */
function handleFiles(fl, ta, el) {
  const fs = [].slice.call(fl);
  if (!fs.length) return;
  el.innerHTML = fs.map(f => '<span>' + esc(f.name) + ' \u2026</span>').join('');
  const sp = el.children;
  Promise.all(fs.map((f, i) => readOne(f, m => { if (sp[i]) sp[i].textContent = f.name + ' (' + m + ')'; }).then(t => ({ n: f.name, t })))).then(r => {
    const txt = r.map(x => notesify(x.t)).filter(Boolean).join('\n\n');
    if (txt) ta.value = (ta.value ? ta.value + '\n\n' : '') + txt;
    el.innerHTML = r.map(x => '<span>' + esc(x.n) + (x.t ? ' \u2713' : ' (couldn\u2019t read text)') + '</span>').join('');
    const bad = r.filter(x => !x.t).length;
    toast(bad ? 'I couldn\u2019t read ' + bad + ' file(s). Old .doc or .ppt files need saving as .docx or .pptx first.' : 'Got it! Your files are loaded.');
  });
}

/* Drag and drop for any element. */
function makeDrop(el, cb) {
  ['dragenter', 'dragover'].forEach(n => el.addEventListener(n, e => { e.preventDefault(); el.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(n => el.addEventListener(n, e => { e.preventDefault(); el.classList.remove('over'); }));
  el.addEventListener('drop', e => cb(e.dataTransfer.files));
}

$('#file').onchange = e => { handleFiles(e.target.files, $('#inp'), $('#gFiles')); e.target.value = ''; };
makeDrop($('#guest .chat'), fl => handleFiles(fl, $('#inp'), $('#gFiles')));
