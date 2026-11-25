/* ===== Prices by country, and currency conversion =====
   South Africa pays in rand: R50 students, R80 lecturers.
   Everyone else pays in US dollars: $10 students, $15 lecturers, converted into their own currency.
   Rates come live from the free Frankfurter service (European Central Bank). If it can't be reached,
   or the currency isn't covered, the estimates below are used and the price is charged in US dollars. */
const BASE_PRICES = { ZA: { currency: 'ZAR', student: 50, teacher: 80 }, WORLD: { currency: 'USD', student: 10, teacher: 15 } };

/* country code -> its currency */
const COUNTRY_CCY = {
  AE: 'AED', AR: 'ARS', AT: 'EUR', AU: 'AUD', BD: 'BDT', BE: 'EUR', BG: 'BGN', BH: 'BHD', BR: 'BRL', BW: 'BWP', CA: 'CAD', CH: 'CHF', CL: 'CLP', CN: 'CNY', CO: 'COP', CY: 'EUR', CZ: 'CZK',
  DE: 'EUR', DK: 'DKK', DZ: 'DZD', EC: 'USD', EE: 'EUR', EG: 'EGP', ES: 'EUR', ET: 'ETB', FI: 'EUR', FR: 'EUR', GB: 'GBP', GH: 'GHS', GR: 'EUR', HK: 'HKD', HR: 'EUR', HU: 'HUF', ID: 'IDR',
  IE: 'EUR', IL: 'ILS', IN: 'INR', IS: 'ISK', IT: 'EUR', JM: 'JMD', JO: 'JOD', JP: 'JPY', KE: 'KES', KR: 'KRW', KW: 'KWD', LK: 'LKR', LS: 'LSL', LT: 'EUR', LU: 'EUR', LV: 'EUR', MA: 'MAD',
  MG: 'MGA', MT: 'EUR', MU: 'MUR', MW: 'MWK', MX: 'MXN', MY: 'MYR', MZ: 'MZN', NA: 'NAD', NG: 'NGN', NL: 'EUR', NO: 'NOK', NP: 'NPR', NZ: 'NZD', OM: 'OMR', PA: 'USD', PE: 'PEN', PH: 'PHP',
  PK: 'PKR', PL: 'PLN', PR: 'USD', PT: 'EUR', QA: 'QAR', RO: 'RON', RS: 'RSD', RW: 'RWF', SA: 'SAR', SE: 'SEK', SG: 'SGD', SI: 'EUR', SK: 'EUR', SV: 'USD', SZ: 'SZL', TH: 'THB', TN: 'TND',
  TR: 'TRY', TW: 'TWD', TZ: 'TZS', UA: 'UAH', UG: 'UGX', US: 'USD', VN: 'VND', ZA: 'ZAR', ZM: 'ZMW', ZW: 'USD'
};
/* currencies PayPal can take payments in (check developer.paypal.com for the current list) */
const PP_CCY = ['AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'ILS', 'JPY', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'SEK', 'SGD', 'THB', 'TWD', 'USD'];
const PP_NO_DEC = ['HUF', 'JPY', 'TWD'];                                  // PayPal wants whole numbers for these
const ZERO_DEC = ['CLP', 'HUF', 'IDR', 'ISK', 'JPY', 'KRW', 'RWF', 'TWD', 'UGX', 'VND', 'MGA', 'TZS'];
/* rough rates, units of currency per 1 US dollar. Estimates only, used when the live rate isn't available. */
const FALLBACK_RATES = {
  ZAR: 18, EUR: 0.92, GBP: 0.78, AUD: 1.5, CAD: 1.37, NZD: 1.65, CHF: 0.88, JPY: 150, CNY: 7.2, INR: 84, BRL: 5.5, MXN: 18.5, NGN: 1550, KES: 129, GHS: 15, EGP: 49, MAD: 10, TZS: 2600,
  UGX: 3700, ZMW: 27, BWP: 13.5, NAD: 18, LSL: 18, SZL: 18, MZN: 64, MWK: 1750, RWF: 1350, ETB: 120, MUR: 46, MGA: 4500, AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.385,
  JOD: 0.71, ILS: 3.7, TRY: 34, PLN: 4, CZK: 23, HUF: 365, RON: 4.6, BGN: 1.8, DKK: 6.9, NOK: 11, SEK: 10.7, ISK: 138, RSD: 108, UAH: 41, HKD: 7.8, SGD: 1.34, MYR: 4.4, THB: 35, PHP: 58,
  IDR: 15800, VND: 25000, KRW: 1380, TWD: 32, PKR: 278, BDT: 120, LKR: 295, NPR: 134, ARS: 1000, CLP: 950, COP: 4200, PEN: 3.75, DZD: 134, TND: 3.1, JMD: 157
};
const RATES = { r: {}, live: false, date: '' };

function guessCountry() {
  try {
    const l = (navigator.languages && navigator.languages[0]) || navigator.language || '', m = l.match(/[-_]([A-Za-z]{2})$/);
    if (m && COUNTRY_CCY[m[1].toUpperCase()]) return m[1].toUpperCase();
    if (/Johannesburg/.test(Intl.DateTimeFormat().resolvedOptions().timeZone || '')) return 'ZA';
  } catch (e) { }
  return 'US';
}
const userCountry = () => S.country || (S.user && S.user.country) || guessCountry();
const rateOf = c => c === 'USD' ? 1 : (RATES.r[c] || FALLBACK_RATES[c] || null);

/* round UP to a tidy price so nobody is under-charged */
function niceUp(a, c) {
  if (ZERO_DEC.indexOf(c) > -1) { const s = a >= 10000 ? 100 : a >= 1000 ? 50 : 10; return Math.ceil(a / s) * s; }
  const s = a < 100 ? 0.5 : a < 1000 ? 1 : a < 10000 ? 5 : 50;
  return Math.round(Math.ceil(a / s) * s * 100) / 100;
}
function money(a, c) {
  if (c === 'ZAR') return 'R' + (Number.isInteger(a) ? a : a.toFixed(2));
  try { return new Intl.NumberFormat('en', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol', minimumFractionDigits: Number.isInteger(a) ? 0 : 2, maximumFractionDigits: ZERO_DEC.indexOf(c) > -1 ? 0 : 2 }).format(a); }
  catch (e) { return a + ' ' + c; }
}

/* What a plan costs in a country, and what PayPal will actually charge. */
function quote(role, country) {
  const za = country === 'ZA', base = za ? BASE_PRICES.ZA : BASE_PRICES.WORLD, local = COUNTRY_CCY[country] || 'USD';
  let amount = base[role], ccy = base.currency;
  if (!za && local !== 'USD') { const r = rateOf(local); if (r) { amount = niceUp(amount * r, local); ccy = local; } }
  let chargeCcy = ccy, chargeAmount = amount;
  if (PP_CCY.indexOf(ccy) < 0) {                       // PayPal can't take this currency, so charge in US dollars
    const r = rateOf(ccy); chargeCcy = 'USD';
    chargeAmount = ccy === 'USD' ? amount : r ? Math.max(1, Math.round(amount / r * 100) / 100) : BASE_PRICES.WORLD[role];
  }
  return { role, country, ccy, amount, display: money(amount, ccy), chargeCcy, chargeAmount, chargeDisplay: money(chargeAmount, chargeCcy) + (chargeCcy === 'USD' ? ' USD' : ''), converted: chargeCcy !== ccy, live: RATES.live, rate: rateOf(ccy === 'USD' ? chargeCcy : ccy) };
}
const roleOf = u => (u === 'teacher' || (u && u.role === 'teacher')) ? 'teacher' : 'student';
const priceLabel = u => quote(roleOf(u), userCountry()).display;
function priceNote() {
  const c = userCountry();
  return quote('student', c).display + ' a month for students or ' + quote('teacher', c).display + ' for lecturers';
}

/* live rates from the European Central Bank (through Frankfurter) */
async function loadRates() {
  try { const c = JSON.parse(localStorage.getItem('ss-rates') || 'null'); if (c && Date.now() - c.t < 12 * 3600e3) { RATES.r = c.r; RATES.live = true; RATES.date = c.date; return; } } catch (e) { }
  try {
    const j = await (await fetch('https://api.frankfurter.dev/v1/latest?base=USD')).json();
    if (j && j.rates) { RATES.r = j.rates; RATES.live = true; RATES.date = j.date; try { localStorage.setItem('ss-rates', JSON.stringify({ t: Date.now(), r: j.rates, date: j.date })); } catch (e) { } }
  } catch (e) { /* keep the estimates */ }
}

/* ---------- country pickers and plan cards ---------- */
function fillCountries() {
  const dn = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
  const list = Object.keys(COUNTRY_CCY).map(c => { let n = c; try { n = dn ? dn.of(c) : c; } catch (e) { } return { c, n }; }).sort((a, b) => a.n.localeCompare(b.n));
  const html = list.map(x => '<option value="' + x.c + '">' + esc(x.n) + ' (' + COUNTRY_CCY[x.c] + ')</option>').join('');
  document.querySelectorAll('select[data-country]').forEach(s => { s.innerHTML = html; s.value = userCountry(); });
}
function syncCountry() {
  document.querySelectorAll('select[data-country]').forEach(s => { s.value = userCountry(); });
  drawPlans();
  if (typeof renderRoleCards === 'function') renderRoleCards();
  const co = document.getElementById('checkout');
  if (co && co.classList.contains('on') && typeof renderCheckout === 'function') renderCheckout();
}
document.addEventListener('change', e => {
  const s = e.target.closest && e.target.closest('select[data-country]'); if (!s) return;
  S.country = s.value; if (S.user) S.user.country = s.value; save(); syncCountry();
});
function drawPlans() {
  const c = userCountry(), s = quote('student', c), t = quote('teacher', c);
  const price = q => '<div class="amt">' + esc(q.display) + '<small style="font-size:15px;font-weight:500"> /month</small></div>' + (q.converted ? '<p class="note" style="margin:0">Charged as ' + esc(q.chargeDisplay) + '</p>' : '');
  const html = '<div class="card price"><h3>Guest</h3><div class="amt">Free</div><ul><li>5 summaries</li><li>No sign-up needed</li></ul><button class="btn ghost" data-go="guest">Try now</button></div>' +
    '<div class="card price pop"><span class="tag">Most popular</span><h3>Student</h3>' + price(s) + '<ul><li>Unlimited notes, quizzes and flashcards</li><li>Mock exams, podcasts and an AI study buddy</li><li>Learn school subjects with practice</li><li>Reference manager</li><li>Talk rooms</li></ul><button class="btn" data-sub="1">Subscribe</button></div>' +
    '<div class="card price"><h3>Lecturer / teacher</h3>' + price(t) + '<ul><li>Unlimited marking, modules and graphs</li><li>Excel and CSV export</li><li>Worksheets with memos for school subjects</li><li>Reference manager</li><li>Talk rooms</li></ul><button class="btn" data-sub="1">Subscribe</button></div>';
  ['plans', 'plans2'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = html; });
  const p = document.getElementById('promoPrice'); if (p) p.textContent = priceNote();
}

fillCountries(); drawPlans();
loadRates().then(syncCountry);
