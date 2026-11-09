/* ===== Connects the front end to the PHP API =====
   Load this LAST in index.html, after js/main.js:  <script src="js/sync.js"></script>
   It replaces the localStorage-based bits (sign-in, profile, usage, modules, articles, comments,
   consent, subscribe) with server calls. With API.base = '' it does nothing (demo mode). */
(function () {
  if (!API.base) return;
  const r = API.req;
  const fail = e => toast(e && e.status ? e.message : 'Can\u2019t reach the server. Check your connection and try again.');

  /* Only a few harmless things stay in the browser now. Accounts and data live on the server. */
  save = function () {
    try { localStorage.setItem('ss', JSON.stringify({ mode: S.mode, tdraft: S.tdraft, consent: S.consent, n: S.user ? undefined : S.n })); } catch (e) { }
  };

  const ago = iso => {
    const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' hours ago';
    const d = Math.floor(s / 86400);
    return d === 1 ? 'Yesterday' : d + ' days ago';
  };
  const shape = x => ({ id: x.id, t: x.title, a: x.author, d: ago(x.created_at), b: x.body, c: x.comments.map(c => ({ a: c.author, t: c.body })) });

  function applyMe(d) { S.user = d.user; S.sub = d.sub; S.n = d.n; }
  async function loadData() {
    const [m, a] = await Promise.all([r('GET', '/v1/modules'), r('GET', '/v1/articles')]);
    S.modules = m.modules;
    S.arts = {};
    a.articles.forEach(x => { (S.arts[x.room_id - 1] = S.arts[x.room_id - 1] || []).push(shape(x)); });   // room id = RM index + 1
  }
  function clearLocal() { S.user = null; S.modules = []; S.arts = {}; S.sub = false; }
  ensureArts = function (i) { S.arts = S.arts || {}; if (!S.arts[i]) S.arts[i] = []; };

  /* ---------- sign in / sign up ---------- */
  async function authDone(d) {
    applyMe(d); await loadData(); save();
    $('#pw').value = '';
    $('#authBtn').textContent = 'Profile';
    if (!S.user.role) show('role'); else if (!S.sub && S.n >= 5) show('pricing'); else show('dash');
  }
  $('#go').onclick = async () => {
    const e = $('#em').value.trim(), p = $('#pw').value;
    if (!e || !p) { toast('Enter your email and password'); return; }
    if (up && !consentGate()) return;
    try {
      await authDone(up
        ? await r('POST', '/v1/auth/register', { name: $('#nm').value.trim() || e.split('@')[0], email: e, password: p, consent: S.consent })
        : await r('POST', '/v1/auth/login', { email: e, password: p }));
    } catch (err) { fail(err); }
  };
  $('#google').onclick = () => {
    if (!API.googleClientId) { toast('Google sign-in isn\u2019t set up yet. Please use your email.'); return; }
    if (!S.consent && !consentGate()) return;
    const go = () => {
      google.accounts.id.initialize({
        client_id: API.googleClientId,
        callback: async resp => { try { await authDone(await r('POST', '/v1/auth/google', { credential: resp.credential, consent: S.consent || null })); } catch (e) { fail(e); } }
      });
      google.accounts.id.prompt();
    };
    if (window.google && google.accounts) go();
    else { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.onload = go; document.head.appendChild(s); }
  };
  async function signOut() {
    try { await r('POST', '/v1/auth/logout'); } catch (e) { }
    clearLocal(); save(); $('#authBtn').textContent = 'Sign in'; show('home');
  }
  $('#out').onclick = signOut;
  $('#dOut').onclick = signOut;

  /* ---------- role + profile ---------- */
  $$('#role [data-r]').forEach(b => {
    b.onclick = async () => {
      try { applyMe(await r('PATCH', '/v1/me', { role: b.dataset.r, occ: b.dataset.r === 'teacher' ? 'Teacher' : 'Student' })); show('profile'); } catch (e) { fail(e); }
    };
  });
  $('#saveP').onclick = async () => {
    try {
      applyMe(await r('PATCH', '/v1/me', { name: $('#pn').value, role: $('#pr').value, occ: $('#po').value, field: $('#pf').value, inst: $('#pi').value }));
      toast('Profile saved');
    } catch (e) { fail(e); }
  };

  /* ---------- free usage + subscribe ---------- */
  const localUsed = used;
  used = function () {
    if (!S.user) return localUsed();           // guests are still counted in the browser
    if (S.sub) return;
    r('POST', '/v1/usage/consume').then(d => { S.n = d.used; renderLeft(); })
      .catch(e => { if (e.status === 402) { S.n = 5; renderLeft(); openPay(); } });
  };
  subscribe = async function () {
    if (!S.user) { toast('Sign in first, then subscribe'); show('signin'); return; }
    try {
      const d = await r('POST', '/v1/billing/subscribe');
      if (d.redirect) { location.href = d.redirect; return; }
      applyMe(d); $('#pay').classList.remove('on'); toast('Subscribed (demo). Unlimited access on.'); show('profile');
    } catch (e) { fail(e); }
  };

  /* ---------- modules ---------- */
  $('#saveMod').onclick = async () => {
    if (!tRows.length) return;
    const name = $('#tMod').value.trim() || 'My module', M = S.modules = S.modules || [];
    let m = M.find(x => x.name.toLowerCase() === name.toLowerCase());
    const sess = { t: $('#tTitle').value.trim() || 'Assessment ' + ((m ? m.sessions.length : 0) + 1), q: tMemo.length, rows: tRows.map(x => ({ name: x.name, s: x.s.slice() })) };
    try {
      if (!m) {
        if (!S.sub && M.length >= FREE_SLOTS) { openPaySlots(); return; }
        M.push((await r('POST', '/v1/modules', { name, memo: tMemo.join('\n'), session: sess })).module);
      } else {
        m.sessions.push((await r('POST', '/v1/modules/' + m.id + '/sessions', Object.assign({ memo: tMemo.join('\n') }, sess))).session);
        m.memo = tMemo.join('\n');
      }
      renderTeacher(); toast('Saved to ' + name + '. Your graphs are ready below.');
    } catch (e) { if (e.status === 402) openPaySlots(); else fail(e); }
  };
  $('#mods').addEventListener('click', async e => {   // capture phase: runs before the old local-only delete
    const b = e.target.closest('[data-del]'); if (!b) return;
    e.stopPropagation();
    const m = (S.modules || []).find(x => x.id === +b.dataset.del); if (!m) return;
    if (!confirm('Delete ' + m.name + ' and all its marking history?')) return;
    try { await r('DELETE', '/v1/modules/' + m.id); S.modules = S.modules.filter(x => x !== m); $('#analysis').style.display = 'none'; renderTeacher(); } catch (err) { fail(err); }
  }, true);

  /* ---------- articles + comments ---------- */
  $('#apost').onclick = async () => {
    const t = $('#at').value.trim(), b = $('#ab').value.trim();
    if (cur === null) { toast('Pick a room first'); return; }
    if (!t || b.length < 20) { toast('Add a title and at least 20 characters'); return; }
    try {
      const d = await r('POST', '/v1/rooms/' + (cur + 1) + '/articles', { t, b });
      ensureArts(cur); S.arts[cur].unshift(shape(d.article));
      $('#at').value = ''; $('#ab').value = ''; drawFeed(); toast('Article posted');
    } catch (e) { fail(e); }
  };
  document.addEventListener('click', async e => {   // capture phase on document: replaces the local-only comment handlers
    const b = e.target.closest('[data-cb],[data-sc]'); if (!b) return;
    e.stopImmediatePropagation();
    const inRoom = b.hasAttribute('data-cb');
    let art, inp;
    if (inRoom) { const i = +b.dataset.cb; art = S.arts[cur][i]; inp = $('#ci' + i); }
    else { const p = b.dataset.sc.split(':'); art = S.arts[p[0]][p[1]]; inp = $('#sc' + p[0] + '_' + p[1]); }
    const t = inp.value.trim(); if (!t) return;
    try {
      await r('POST', '/v1/articles/' + art.id + '/comments', { t });
      art.c.push({ a: S.user.name, t });
      inRoom ? drawFeed() : renderStudent();
    } catch (err) { fail(err); }
  }, true);

  /* ---------- POPIA: marketing consent ---------- */
  $('#mkt').onchange = async () => {
    S.consent = S.consent || { v: POLICY_VERSION, at: new Date().toISOString(), minor: false, guardian: '' };
    S.consent.marketing = $('#mkt').checked; save();
    try { await r('PATCH', '/v1/me/consent', { marketing: $('#mkt').checked }); toast($('#mkt').checked ? 'Thanks! We\u2019ll send the occasional study tip.' : 'Done. No more marketing from us.'); } catch (e) { fail(e); }
  };

  /* ---------- start-up: restore the session ---------- */
  clearLocal();
  (async function boot() {
    try { applyMe(await r('GET', '/v1/me')); await loadData(); } catch (e) { clearLocal(); }
    $('#authBtn').textContent = S.user ? 'Profile' : 'Sign in';
    const h = location.hash.slice(1);
    show(h && document.getElementById(h) ? h : 'home');
  })();
})();
