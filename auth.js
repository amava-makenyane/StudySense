/* ===== Register, sign in, and forgot password (one-time code) =====
   While API.base is empty this runs as a local demo: accounts live in this browser only and the
   one-time code is shown on screen. When API.base is set it calls the backend instead (see README):
     POST /v1/auth/register  POST /v1/auth/login  POST /v1/auth/forgot  POST /v1/auth/reset */
const ACC_KEY = 'ss-accounts';
const accts = () => { try { return JSON.parse(localStorage.getItem(ACC_KEY) || '{}'); } catch (e) { return {}; } };
const putAccts = a => { try { localStorage.setItem(ACC_KEY, JSON.stringify(a)); } catch (e) { } };
const b64e = u => btoa(String.fromCharCode.apply(null, u));
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const val = id => ($('#' + id).value || '').trim();
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/* demo accounts: passwords are never stored, only a salted PBKDF2 hash */
async function pbkdf(pw, saltB64) {
  const salt = saltB64 ? b64d(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256);
  return { salt: b64e(salt), hash: b64e(new Uint8Array(bits)) };
}
async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- password rules ---------- */
const COMMON_PW = ['password', '12345678', '123456789', '1234567890', 'qwertyuiop', 'iloveyou', 'admin123', 'welcome123', 'letmein', 'studysense'];
function pwProblems(pw, email) {
  const p = [], local = (email || '').split('@')[0].toLowerCase();
  if (pw.length < 10) p.push('at least 10 characters');
  if (!(/[a-z]/i.test(pw) && /[0-9]/.test(pw))) p.push('letters and numbers');
  if (COMMON_PW.some(c => pw.toLowerCase().indexOf(c) > -1)) p.push('nothing too common');
  if (local.length > 3 && pw.toLowerCase().indexOf(local) > -1) p.push('not your email name');
  return p;
}
const pwScore = pw => Math.min(4, (pw.length >= 10) + (pw.length >= 14) + (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) + /[0-9]/.test(pw) + /[^A-Za-z0-9]/.test(pw));
function meter(inputId, barId, hintId) {
  const pw = $('#' + inputId).value, s = pwScore(pw), bar = $('#' + barId);
  bar.style.width = (pw ? 20 + s * 20 : 0) + '%'; bar.dataset.s = s;
  if (hintId) $('#' + hintId).textContent = !pw ? 'Use at least 10 characters with letters and numbers.' : ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][s];
}
$('#rgPw').addEventListener('input', () => meter('rgPw', 'rgMeter', 'rgHint'));
$('#fgPw').addEventListener('input', () => meter('fgPw', 'fgMeter'));
document.addEventListener('click', e => {                       // show / hide password buttons
  const b = e.target.closest('[data-eye]'); if (!b) return;
  const i = $('#' + b.dataset.eye); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Show' : 'Hide';
});

/* ---------- sessions ---------- */
function startSession(email, a) {
  S.user = { name: (a.first + ' ' + a.last).trim(), email, role: a.role, occ: a.occ, field: a.field, inst: a.inst, country: a.country };
  S.country = a.country || S.country;
  S.plan = a.plan || null; S.sub = !!(a.plan && a.plan.status === 'paid');
  checkExpiry(); save();
  $('#authBtn').textContent = 'Profile';
}
/* one-month payments end after 30 days unless PayPal subscriptions (automatic billing) are on */
function checkExpiry() {
  if (S.plan && S.plan.status === 'paid' && PAYPAL.mode !== 'subscription' && S.plan.renewsAt && Date.now() > Date.parse(S.plan.renewsAt)) { S.plan.status = 'expired'; S.sub = false; }
}
['#out', '#dOut'].forEach(id => { const b = $(id); if (b) b.addEventListener('click', () => { S.sub = false; S.plan = null; S.welcome = false; save(); }); });

/* ---------- register ---------- */
function renderRoleCards() {
  const c = userCountry();
  $$('[data-price]').forEach(el => { const q = quote(el.dataset.price, c); el.textContent = q.display + ' per month'; });
  const r = (document.querySelector('input[name=rgRole]:checked') || {}).value || 'student', q = quote(r, c);
  $('#rgConv').textContent = q.converted ? 'You will be charged ' + q.chargeDisplay + ' (your price converted at today\u2019s rate).' : 'You will be charged ' + q.display + ' per month.';
}
function initRegister() {
  $('#rgOcc').innerHTML = opts(OCC, 'Student'); $('#rgField').innerHTML = opts(FIELD, 'History');
  $('#rgCountry').value = userCountry(); renderRoleCards();
  $('#rgErr').style.display = 'none';
}
document.addEventListener('change', e => {
  if (e.target.name === 'rgRole') { $('#rgOcc').value = e.target.value === 'teacher' ? 'Teacher' : 'Student'; renderRoleCards(); }
  if (e.target.id === 'rgMinor') $('#rgMinorBox').style.display = e.target.checked ? 'block' : 'none';
});
function showErrors(list) {
  const box = $('#rgErr');
  box.innerHTML = '<b>Please fix these:</b><ul>' + list.map(x => '<li>' + esc(x[1]) + '</li>').join('') + '</ul>'; box.style.display = 'block';
  $$('#register [aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  list.forEach(x => { const el = $('#' + x[0]); if (el) el.setAttribute('aria-invalid', 'true'); });
  const f = $('#' + list[0][0]); if (f) f.focus();
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
async function submitRegister() {
  if ($('#rgWeb').value) return;                                   // hidden bot trap
  const d = { first: val('rgFirst'), last: val('rgLast'), email: val('rgEmail').toLowerCase(), pw: $('#rgPw').value, pw2: $('#rgPw2').value, role: (document.querySelector('input[name=rgRole]:checked') || {}).value || 'student', country: $('#rgCountry').value, occ: $('#rgOcc').value, field: $('#rgField').value, inst: val('rgInst'), minor: $('#rgMinor').checked, gEmail: val('rgGEm').toLowerCase(), mkt: $('#rgMkt').checked };
  const err = [];
  if (!d.first) err.push(['rgFirst', 'Enter your first name.']);
  if (!d.last) err.push(['rgLast', 'Enter your surname.']);
  if (!emailOk(d.email)) err.push(['rgEmail', 'Enter a valid email address.']);
  const probs = pwProblems(d.pw, d.email); if (probs.length) err.push(['rgPw', 'Your password needs: ' + probs.join(', ') + '.']);
  else if (d.pw !== d.pw2) err.push(['rgPw2', 'The two passwords don\u2019t match.']);
  if (d.minor && (!emailOk(d.gEmail) || !$('#rgGOk').checked)) err.push(['rgGEm', 'Under 18? Add your parent or guardian\u2019s email and tick their consent.']);
  if (!$('#rgOk').checked) err.push(['rgOk', 'Please tick the consent box. POPIA asks us to get it first.']);
  if (err.length) { showErrors(err); return; }
  $('#rgErr').style.display = 'none';
  const btn = $('#rgGo'); btn.disabled = true; btn.textContent = 'Creating your account\u2026';
  const consent = { v: POLICY_VERSION, at: new Date().toISOString(), marketing: d.mkt, minor: d.minor, guardian: d.minor ? d.gEmail : '' };
  try {
    if (API.base) {
      await API.call('/v1/auth/register', { firstName: d.first, lastName: d.last, email: d.email, password: d.pw, role: d.role, country: d.country, occupation: d.occ, field: d.field, institution: d.inst, consent });
      startSession(d.email, { first: d.first, last: d.last, role: d.role, occ: d.occ, field: d.field, inst: d.inst, country: d.country, plan: null });
    } else {
      const A = accts();
      if (A[d.email]) { showErrors([['rgEmail', 'That email is already registered. Sign in instead, or use \u201CForgot password\u201D.']]); return; }
      const h = await pbkdf(d.pw);
      A[d.email] = { first: d.first, last: d.last, role: d.role, country: d.country, occ: d.occ, field: d.field, inst: d.inst, salt: h.salt, hash: h.hash, created: new Date().toISOString(), plan: null };
      putAccts(A); startSession(d.email, A[d.email]);
    }
    S.consent = consent; S.country = d.country; save();
    ['rgPw', 'rgPw2'].forEach(id => { $('#' + id).value = ''; }); meter('rgPw', 'rgMeter', 'rgHint');
    toast('Welcome, ' + d.first + '! One more step: payment.');
    show('checkout');
  } catch (e) { showErrors([['rgEmail', 'We couldn\u2019t create your account. Please try again in a moment.']]); }
  finally { btn.disabled = false; btn.textContent = 'Continue to payment'; }
}
$('#rgGo').onclick = submitRegister;
$('#register').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') { e.preventDefault(); submitRegister(); } });

/* ---------- sign in ---------- */
let fails = 0, lockUntil = 0;
async function doSignIn() {
  if (Date.now() < lockUntil) { toast('Too many tries. Please wait a minute, then try again.'); return; }
  const email = val('em').toLowerCase(), pw = $('#pw').value;
  if (!emailOk(email) || !pw) { toast('Enter your email and password.'); return; }
  const btn = $('#go'); btn.disabled = true;
  try {
    let acct = null;
    if (API.base) {
      const r = await API.call('/v1/auth/login', { email, password: pw }); const u = r.user;
      acct = { first: u.firstName || '', last: u.lastName || '', role: u.role, occ: u.occupation, field: u.field, inst: u.institution, country: u.country, plan: r.subscription ? { status: r.subscription.status === 'active' ? 'paid' : r.subscription.status, display: r.subscription.display, method: r.subscription.method, renewsAt: r.subscription.nextBilling } : null };
    } else {
      const a = accts()[email], h = await pbkdf(pw, a ? a.salt : null);       // same work whether or not the account exists
      if (a && h.hash === a.hash) acct = a;
    }
    if (!acct) throw new Error('bad');
    fails = 0; startSession(email, acct); $('#pw').value = '';
    toast('Welcome back, ' + (acct.first || 'friend') + '!');
    show(S.sub ? 'dash' : 'checkout');                                          // unpaid accounts go to payment
  } catch (e) {
    if (++fails >= 5) { lockUntil = Date.now() + 60000; fails = 0; }
    toast(e.message === 'bad' || e.status === 401 ? 'That email and password don\u2019t match. Check them, or use \u201CForgot password\u201D.' : 'We couldn\u2019t sign you in. Please try again.');
  } finally { btn.disabled = false; }
}
$('#go').onclick = doSignIn;
$('#signin').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); doSignIn(); } });
$('#swap').onclick = () => show('register');
$('#google').onclick = () => toast('Google sign-in switches on when your backend is connected. See the README.');
$('#fgLink').onclick = () => show('forgot');
{ const n = $('#demoNote'); if (n && API.base) n.style.display = 'none'; }

/* ---------- forgot password: email -> 6-digit code -> new password ---------- */
let otpEmail = '', resendAt = 0, resendTimer = null;
const fgPanel = id => ['fgA', 'fgB', 'fgC'].forEach(p => { $('#' + p).style.display = p === id ? 'block' : 'none'; });
function initForgot() { fgPanel('fgA'); $('#fgEm').value = $('#em').value || ''; $('#fgDemo').style.display = 'none'; ['fgCode', 'fgPw', 'fgPw2'].forEach(id => { $('#' + id).value = ''; }); meter('fgPw', 'fgMeter'); }
function tickResend() {
  const left = Math.ceil((resendAt - Date.now()) / 1000), b = $('#fgResend');
  if (left > 0) { b.disabled = true; b.textContent = 'Resend code (' + left + 's)'; } else { b.disabled = false; b.textContent = 'Resend code'; clearInterval(resendTimer); }
}
async function sendOtp() {
  const email = val('fgEm').toLowerCase();
  if (!emailOk(email)) { toast('Enter a valid email address.'); return; }
  if (Date.now() < resendAt) { toast('Please wait a moment before asking for another code.'); return; }
  const b = $('#fgSend'); b.disabled = true;
  try {
    otpEmail = email;
    if (API.base) { await API.call('/v1/auth/forgot', { email }); $('#fgDemo').style.display = 'none'; }
    else {
      const a = accts()[email]; let note = 'Demo mode: there is no account with that email, so no code was made.';
      if (a) {
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
        sessionStorage.setItem('ss-otp', JSON.stringify({ email, h: await sha256Hex(code + ':' + email), exp: Date.now() + 10 * 60000, tries: 0 }));
        note = 'Demo mode: your code is ' + code + '. On the real site it arrives by email and is never shown on screen.';
      }
      $('#fgDemo').textContent = note; $('#fgDemo').style.display = 'block';
    }
    $('#fgSent').textContent = 'If ' + email + ' is registered, we\u2019ve sent a 6-digit code. It works for 10 minutes.';
    resendAt = Date.now() + 60000; tickResend(); clearInterval(resendTimer); resendTimer = setInterval(tickResend, 1000);
    fgPanel('fgB'); $('#fgCode').focus();
  } catch (e) { toast('We couldn\u2019t send the code. Please try again.'); }
  finally { b.disabled = false; }
}
async function resetPassword() {
  const code = val('fgCode'), p1 = $('#fgPw').value, p2 = $('#fgPw2').value;
  if (!/^\d{6}$/.test(code)) { toast('Enter the 6-digit code from your email.'); return; }
  const probs = pwProblems(p1, otpEmail); if (probs.length) { toast('Your new password needs: ' + probs.join(', ') + '.'); return; }
  if (p1 !== p2) { toast('The two passwords don\u2019t match.'); return; }
  const b = $('#fgReset'); b.disabled = true;
  try {
    if (API.base) await API.call('/v1/auth/reset', { email: otpEmail, otp: code, password: p1 });
    else {
      const rec = JSON.parse(sessionStorage.getItem('ss-otp') || 'null');
      if (!rec || rec.email !== otpEmail || Date.now() > rec.exp) throw new Error('expired');
      if (rec.tries >= 5) throw new Error('locked');
      if (await sha256Hex(code + ':' + otpEmail) !== rec.h) { rec.tries++; sessionStorage.setItem('ss-otp', JSON.stringify(rec)); throw new Error('wrong:' + (5 - rec.tries)); }
      const A = accts(), h = await pbkdf(p1); A[otpEmail].salt = h.salt; A[otpEmail].hash = h.hash; putAccts(A); sessionStorage.removeItem('ss-otp');
    }
    fgPanel('fgC');
  } catch (e) {
    const m = e.message || '';
    toast(m === 'expired' ? 'That code has expired. Please ask for a new one.' : m === 'locked' ? 'Too many wrong codes. Please ask for a new one.' : m.indexOf('wrong:') === 0 ? 'That code isn\u2019t right. ' + m.split(':')[1] + ' tries left.' : 'That code isn\u2019t right, or it has expired. Please check it or ask for a new one.');
  } finally { b.disabled = false; }
}
$('#fgSend').onclick = sendOtp;
$('#fgResend').onclick = sendOtp;
$('#fgReset').onclick = resetPassword;
$('#fgToSignin').onclick = () => { $('#em').value = otpEmail; show('signin'); $('#pw').focus(); };
$('#forgot').addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return; e.preventDefault();
  if ($('#fgA').style.display !== 'none') sendOtp(); else if ($('#fgB').style.display !== 'none') resetPassword();
});
