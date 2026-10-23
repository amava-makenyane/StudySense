/* ===== StudySense API layer =====
   Backend team: set API.base (for example 'https://api.studysense.co.za') and build the
   endpoints listed in README.md. While API.base is empty, everything runs locally in the
   browser so the whole UI works as a demo. */
const API = {
  base: '',

  async call(path, body, isForm) {
    const res = await fetch(API.base + path, {
      method: 'POST',
      credentials: 'include',
      headers: isForm ? {} : { 'Content-Type': 'application/json' },
      body: isForm ? body : JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    return res.json();
  },

  /* Notes. Returns {mode, pts, kw, qs, quiz, groups} or null when the text is too short. */
  summarise(text, mode) {
    return API.base ? API.call('/v1/notes', { text, mode }) : Promise.resolve(analyse(text));
  },

  /* Scans and photos. Returns plain text. */
  ocr(file, say) {
    if (API.base) {
      const f = new FormData();
      f.append('file', file);
      return API.call('/v1/ocr', f, true).then(r => r.text);
    }
    if (!window.Tesseract) return Promise.resolve('');
    return Tesseract.recognize(file, 'eng', {
      logger: m => { if (say && m.status === 'recognizing text') say('reading ' + Math.round(m.progress * 100) + '%'); }
    }).then(r => r.data.text);
  },

  /* Marking. papers = [{name, text}]. Returns [{name, scores:[0 | 0.5 | 1, ...]}] */
  mark(memoLines, papers) {
    return API.base
      ? API.call('/v1/marking', { memo: memoLines, papers }).then(r => r.results)
      : Promise.resolve(papers.map(p => ({ name: p.name, scores: markLocal(memoLines, p.text) })));
  }
};
