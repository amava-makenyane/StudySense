/* ===== Checkout: pay by debit or credit card, or by PayPal =====
   Three modes, chosen by PAYPAL in config.js:
   1. PAYPAL.clientId set   -> PayPal buttons: a PayPal button and a debit or credit card button. Paying
                               unlocks the account straight away and sends the user to their profile.
   2. PAYPAL.meUser set     -> PayPal.Me link with the exact amount. PayPal can't tell the website when
                               it is paid, so the account is "pending" until someone confirms it.
   3. neither               -> demo button (no real money), so the whole flow can be tried.
   With a backend (API.base), the payment is confirmed on the server before anything is unlocked. */
let coMethod = 'card', ppLoaded = '';
const ppMode = () => PAYPAL.clientId ? 'sdk' : PAYPAL.meUser ? 'me' : 'demo';
const coRole = () => roleOf(S.user);
const fmtVal = q => PP_NO_DEC.indexOf(q.chargeCcy) > -1 ? String(Math.round(q.chargeAmount)) : q.chargeAmount.toFixed(2);
const INCLUDED = {
  student: ['Unlimited notes, quizzes and flashcards', 'Mock exams, podcasts and an AI study buddy', 'Learn school subjects with practice questions', 'Reference manager for essays', 'Talk rooms'],
  teacher: ['Unlimited marking, modules and graphs', 'Excel and CSV export', 'Worksheets with memos for school subjects', 'Reference manager for essays', 'Talk rooms']
};

function renderCheckout() {
  if (!S.user) { show('register'); return; }
  const role = coRole(), q = quote(role, userCountry());
  $('#coMain').style.display = 'grid'; $('#coDone').style.display = 'none';
  $('#coPlan').textContent = role === 'teacher' ? 'Lecturer or teacher plan' : 'Student plan';
  $('#coPrice').textContent = q.display;
  $('#coList').innerHTML = INCLUDED[role].map(x => '<li>' + esc(x) + '</li>').join('');
  let conv = '';
  if (q.converted) conv = 'We charge <b>' + esc(q.chargeDisplay) + '</b>, which is your price of ' + esc(q.display) + ' converted. ' + (q.ccy === 'ZAR' ? 'PayPal can\u2019t take rand. ' : '') + 'Your bank may add its own conversion fee.';
  else if (q.ccy !== 'USD' && q.ccy !== 'ZAR' && q.rate) conv = 'Converted from US$' + BASE_PRICES.WORLD[role] + ' at today\u2019s rate.';
  if (q.ccy !== 'ZAR' && q.rate && q.ccy !== 'USD') conv += ' ' + (RATES.live ? 'Rate: 1 USD = ' + q.rate + ' ' + q.ccy + ' (European Central Bank, ' + RATES.date + ').' : 'Rate is an estimate for now.');
  $('#coConv').innerHTML = conv;
  $('#coCountry').value = userCountry();
  $$('#coTabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.pm === coMethod));
  $('#ppCard').style.display = coMethod === 'card' ? 'block' : 'none';
  $('#ppPal').style.display = coMethod === 'paypal' ? 'block' : 'none';
  setupPayment(q);
}
$('#coTabs').addEventListener('click', e => { const b = e.target.closest('[data-pm]'); if (!b) return; coMethod = b.dataset.pm; renderCheckout(); });

function loadPayPal(ccy) {
  if (ppLoaded === ccy && window.paypal) return Promise.resolve(window.paypal);
  return new Promise((res, rej) => {
    document.querySelectorAll('script[data-pp]').forEach(s => s.remove()); try { delete window.paypal; } catch (e) { window.paypal = undefined; }
    const s = document.createElement('script');
    s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(PAYPAL.clientId) + '&currency=' + ccy + '&components=buttons&enable-funding=card&disable-funding=credit,paylater' + (PAYPAL.mode === 'subscription' ? '&vault=true&intent=subscription' : '&intent=capture');
    s.dataset.pp = '1'; s.onload = () => { ppLoaded = ccy; res(window.paypal); }; s.onerror = () => rej(new Error('sdk'));
    document.head.appendChild(s);
  });
}

function setupPayment(q) {
  ['ppCard', 'ppPal', 'ppAlt'].forEach(id => { $('#' + id).innerHTML = ''; });
  const mode = ppMode(), msg = $('#coMsg');
  if (mode === 'sdk') {
    msg.textContent = 'Loading the secure payment window\u2026';
    loadPayPal(q.chargeCcy).then(pp => { msg.textContent = ''; buildButtons(pp, q); })
      .catch(() => { msg.innerHTML = 'We couldn\u2019t load PayPal. Check your connection, then <button class="lnk2" id="coRetry">try again</button>.'; });
  } else if (mode === 'me') {
    const url = 'https://www.paypal.com/paypalme/' + encodeURIComponent(PAYPAL.meUser) + '/' + fmtVal(q) + q.chargeCcy;
    msg.textContent = '';
    $('#ppAlt').innerHTML = '<p>Pay <b>' + esc(q.chargeDisplay) + '</b> with PayPal. On the PayPal page you can also choose <b>Pay with debit or credit card</b>.</p>' +
      '<p><a class="btn" href="' + url + '" target="_blank" rel="noopener">Pay with PayPal</a></p>' +
      '<p class="note">After you have paid, press the button below. We will confirm your payment and unlock your account.</p><p><button class="btn ghost" id="coPaid">I have paid</button></p>';
  } else {
    msg.textContent = '';
    $('#ppAlt').innerHTML = '<div class="card devnote"><b>Demo mode.</b> PayPal isn\u2019t connected yet, so no real money moves. Press the button to try the whole flow.</div>' +
      '<p><button class="btn" id="coDemo">Pay ' + esc(q.display) + ' (demo)</button></p>' +
      '<details class="setup"><summary>Developer: how to switch on real payments</summary><ol><li>Open an account at paypal.com/business and create your PayPal.Me link at paypal.com/paypalme/my/profile.</li><li>At developer.paypal.com, go to Apps &amp; Credentials, create an app, and copy its <b>Client ID</b>.</li><li>Paste it into <code>PAYPAL.clientId</code> in <code>config.js</code>. Card and PayPal buttons appear here.</li><li>No Client ID yet? Put your PayPal.Me name in <code>PAYPAL.meUser</code> for a simple pay link.</li><li>See PAYMENTS-SETUP.md for every step, testing, and confirming payments on the server.</li></ol></details>';
  }
}
document.addEventListener('click', e => {
  if (e.target.closest('#coRetry')) renderCheckout();
  if (e.target.closest('#coDemo')) { if (!$('#coAgree').checked) { toast('Please tick the box to agree before paying.'); return; } finishPayment({ method: 'demo', orderId: 'DEMO-' + Date.now(), q: quote(coRole(), userCountry()) }); }
  if (e.target.closest('#coPaid')) {
    if (!$('#coAgree').checked) { toast('Please tick the box to agree before paying.'); return; }
    const q = quote(coRole(), userCountry());
    S.plan = { status: 'pending', role: coRole(), display: q.display, charged: q.chargeDisplay, method: 'paypal.me', paidAt: new Date().toISOString() }; S.sub = false; S.welcome = 'pending'; savePlan(); show('profile');
  }
});

function buildButtons(pp, q) {
  const role = coRole(), sub = PAYPAL.mode === 'subscription', plan = (PAYPAL.subscriptionPlans[q.chargeCcy] || {})[role];
  const make = (fs, label) => {
    const method = (d) => (d && d.paymentSource) || label;
    const cfg = {
      fundingSource: fs,
      style: { layout: 'vertical', shape: 'rect', height: 46, label: sub ? 'subscribe' : 'pay' },
      onClick: (d, a) => { if ($('#coAgree').checked) return a.resolve(); toast('Please tick the box to agree before paying.'); return a.reject(); },
      onCancel: () => toast('Payment cancelled. You have not been charged.'),
      onError: () => toast('The payment window had a problem. You have not been charged. Please try again.')
    };
    if (sub) {
      cfg.createSubscription = (d, a) => plan ? a.subscription.create({ plan_id: plan }) : Promise.reject(new Error('plan'));
      cfg.onApprove = d => finishPayment({ method: method(d), orderId: d.subscriptionID, q });
    } else {
      cfg.createOrder = (d, a) => a.order.create({ intent: 'CAPTURE', purchase_units: [{ description: 'StudySense ' + (role === 'teacher' ? 'lecturer' : 'student') + ' plan, 1 month', custom_id: 'ss-' + Date.now(), amount: { currency_code: q.chargeCcy, value: fmtVal(q) } }], application_context: { shipping_preference: 'NO_SHIPPING' } });
      cfg.onApprove = (d, a) => a.order.capture().then(() => finishPayment({ method: method(d), orderId: d.orderID, q }));
    }
    return pp.Buttons(cfg);
  };
  const card = make(pp.FUNDING.CARD, 'card'), pal = make(pp.FUNDING.PAYPAL, 'paypal');
  if (card.isEligible()) card.render('#ppCard'); else $('#ppCard').innerHTML = '<p class="note">Card payments aren\u2019t available for this currency yet. Please choose PayPal.</p>';
  if (pal.isEligible()) pal.render('#ppPal'); else $('#ppPal').innerHTML = '<p class="note">PayPal isn\u2019t available right now. Please try again later.</p>';
}

function savePlan() {
  const A = accts(), a = S.user && A[(S.user.email || '').toLowerCase()]; if (a) { a.plan = S.plan; putAccts(A); }
  save();
}
/* money has arrived: confirm it, unlock the account, and go to the profile */
async function finishPayment(info) {
  const q = info.q;
  $('#coMain').style.display = 'none'; $('#coDone').style.display = 'block'; $('#coDoneMsg').textContent = 'Confirming your payment\u2026';
  try {
    if (API.base) await API.call('/v1/billing/paypal/confirm', { orderId: info.orderId, role: coRole(), currency: q.chargeCcy, amount: q.chargeAmount, country: userCountry() });
  } catch (e) { $('#coDoneMsg').textContent = 'We received your payment but couldn\u2019t confirm it yet. Please keep your PayPal receipt and contact support.'; return; }
  const now = Date.now();
  S.plan = { status: 'paid', role: coRole(), display: q.display, ccy: q.ccy, charged: q.chargeDisplay, method: info.method, orderId: info.orderId || '', paidAt: new Date(now).toISOString(), renewsAt: new Date(now + 30 * 864e5).toISOString() };
  S.sub = true; S.welcome = true; savePlan();
  $('#coDoneMsg').textContent = 'Payment received. Taking you to your profile\u2026';
  setTimeout(() => show('profile'), 2200);
}
function subscribe() {
  $('#pay').classList.remove('on');
  if (!S.user) { toast('Create your account first. Then you can pay.'); show('register'); return; }
  show('checkout');
}

/* ---------- what the profile shows about payment ---------- */
const longDate = iso => { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
const methodName = m => ({ card: 'debit or credit card', paypal: 'PayPal', 'paypal.me': 'PayPal.Me', demo: 'demo payment' }[m] || m || 'PayPal');
function planTitle() {
  const p = S.plan;
  if (S.sub && p) return 'Active (' + p.display + ' per month)';
  if (p && p.status === 'pending') return 'Payment pending';
  if (p && p.status === 'expired') return 'Expired';
  return 'Not paid yet';
}
function planNote() {
  const p = S.plan;
  if (S.sub && p) return 'Paid by ' + methodName(p.method) + (p.charged ? ' (' + p.charged + ')' : '') + '. ' + (PAYPAL.mode === 'subscription' ? 'Renews automatically on ' : 'Your month runs until ') + longDate(p.renewsAt) + '.';
  if (p && p.status === 'pending') return 'Thank you! We will confirm your PayPal payment and unlock your account soon.';
  if (p && p.status === 'expired') return 'Your month has ended. Pay again to keep unlimited access.';
  return Math.max(0, 5 - S.n) + ' free summaries left. Pay to unlock everything.';
}
function profileExtras() {
  const u = S.user, teacher = roleOf(u) === 'teacher';
  $('#profT').textContent = teacher ? 'Your lecturer profile' : 'Your student profile';
  $('#payNow').style.display = S.sub ? 'none' : 'inline-block';
  $('#pCountry').value = userCountry();
  const w = $('#welcome');
  if (S.welcome === true) {
    w.innerHTML = '<h3 style="margin-top:0">&#127881; Payment received. Welcome, ' + esc((u.name || '').split(' ')[0] || 'friend') + '!</h3><p>Your ' + (teacher ? 'lecturer' : 'student') + ' profile is ready and everything is unlocked.</p><button class="btn" data-go="dash">Go to my dashboard</button>';
    w.style.display = 'block'; S.welcome = false; save();
  } else if (S.welcome === 'pending') {
    w.innerHTML = '<h3 style="margin-top:0">Thank you!</h3><p>We will confirm your PayPal payment and unlock your account soon. You can look around in the meantime.</p>';
    w.style.display = 'block'; S.welcome = false; save();
  } else w.style.display = 'none';
}
