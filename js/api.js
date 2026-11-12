/* ===== StudySense API layer =====
   Set API.base to the folder that holds the PHP api (index.php), with no trailing slash.
   Examples:  'http://127.0.0.1:8000'   (local php -S)      'https://api.example.co.za'
   Leave it '' to run as a browser-only demo (js/sync.js then does nothing). */
const API = {
  base: 'http://127.0.0.1:8000',
  googleClientId: '',     // same value as google_client_id in api/config.php ('' hides Google sign-in)
  serverAi: false,        // flip to true once /v1/notes, /v1/ocr and /v1/marking exist on the server

  /* JSON request with cookies. Throws Error with .status and .message from the server. */
  async req(method, path, body) {
    const opt = { method, credentials: 'include', headers: {} };
    if (method !== 'GET') { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body === undefined ? {} : body); }
    const res = await fetch(API.base + path, opt);
    let data = null; try { data = await res.json(); } catch (e) { }
    if (!res.ok) { const err = new Error((data && data.error) || 'Request failed (' + res.status + ')'); err.status = res.status; err.data = data; throw err; }
    return data;
  },

  async call(path, body, isForm) {
    if (!isForm) return API.req('POST', path, body);
    const res = await fetch(API.base + path, { method: 'POST', credentials: 'include', body });
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    return res.json();
  },

  /* Notes. Returns {mode, pts, kw, qs, quiz, groups} or null when the text is too short. */
  summarise(text, mode) {
    return API.serverAi ? API.call('/v1/notes', { text, mode }) : Promise.resolve(analyse(text));
  },

  /* Scans and photos. Returns plain text. */
  ocr(file, say) {
    if (API.serverAi) {
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
    return API.serverAi
      ? API.call('/v1/marking', { memo: memoLines, papers }).then(r => r.results)
      : Promise.resolve(papers.map(p => ({ name: p.name, scores: markLocal(memoLines, p.text) })));
  },

  /* POPIA rights: export and delete everything held about the signed-in person. */
  exportMe() {
    return API.base ? API.req('GET', '/v1/me/export') : Promise.resolve(JSON.parse(JSON.stringify(S)));
  },
  deleteMe() {
    return API.base ? API.req('DELETE', '/v1/me') : Promise.resolve();
  }
};
