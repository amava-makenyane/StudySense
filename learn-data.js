/* ===== Learn: subjects, lessons and practice questions =====
   Every practice question is made by code from a seed, and its answer is worked out with exact
   arithmetic (whole numbers, fractions or BigInt, never guesses). Each question also carries a
   check (q.chk) that re-tests the answer a different way, for example by putting it back into the
   equation. test/learn-selftest.js runs thousands of questions through those checks.
   Lessons contain only well-established school facts. A subject teacher should still check each
   topic before launch (see LEARN.reviewed in config.js). This file has no browser code so it can be tested. */
const LEVELS = ['Grade 4\u20136', 'Grade 7\u20139', 'Grade 10\u201312'];
const SUBJECTS = [
  { id: 'maths', name: 'Mathematics', icon: '\u2211', blurb: 'Numbers, fractions, algebra, geometry and data.' },
  { id: 'mlit', name: 'Mathematical Literacy', icon: 'R', blurb: 'Maths for real life: money, measuring, time and travel.' },
  { id: 'sci', name: 'Natural & Physical Sciences', icon: '\u269B', blurb: 'Speed, density, electricity, forces, atoms and moles.' },
  { id: 'life', name: 'Life Sciences', icon: '\u2022', blurb: 'Cells, photosynthesis, DNA and heredity.' },
  { id: 'eng', name: 'English (grammar)', icon: 'Aa', blurb: 'Plurals, tenses, agreement and parts of speech.' },
  { id: 'geo', name: 'Geography (map skills)', icon: '\u25CE', blurb: 'Map scale, compass directions, latitude and longitude.' }
];

/* ---------- tiny helpers ---------- */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const lcm = (a, b) => a / gcd(a, b) * b;
const trim = n => String(Math.round(n * 1e6) / 1e6);
const N = n => { const s = trim(Math.abs(n)).split('.'); return (n < 0 ? '\u2212' : '') + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (s[1] ? '.' + s[1] : ''); };
const Rm = n => 'R' + N(n);
const F = (n, d) => n + '/' + d;
const sgn = (n, first) => first ? (n < 0 ? '\u2212' : '') + Math.abs(n) : (n < 0 ? ' \u2212 ' : ' + ') + Math.abs(n);
function expr(ts) { return ts.map((t, i) => { const c = t[0], v = t[1] || '', m = Math.abs(c), body = v ? (m === 1 ? '' : m) + v : String(m); return i === 0 ? (c < 0 ? '\u2212' : '') + body : (c < 0 ? ' \u2212 ' : ' + ') + body; }).join(''); }
const linStr = (a, b) => b === 0 ? expr([[a, 'x']]) : expr([[a, 'x'], [b, '']]);
const par = n => n < 0 ? '(\u2212' + Math.abs(n) + ')' : String(n);
const sup = (b, e) => b + '<sup>' + e + '</sup>';

function makeHelper(seed) {
  let a = seed >>> 0;
  const R = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ri = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
  const pick = arr => arr[ri(0, arr.length - 1)];
  const shuf = arr => { const x = arr.slice(); for (let i = x.length - 1; i > 0; i--) { const j = ri(0, i); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  return { R, ri, pick, shuf };
}

/* ---------- question builders ---------- */
const dispNum = (a, dp) => dp != null ? (dp ? N(+a.toFixed(dp)).replace(/\.0+$/, '') && a.toFixed(dp) : String(a)) : N(a);
const qNum = (q, a, steps, o = {}) => ({ type: 'num', q, a, steps, tol: o.tol || 0, disp: (o.pre || '') + dispNum(a, o.dp) + (o.unit ? ' ' + o.unit : ''), chk: o.chk, hint: o.hint || '' });
function qFrac(q, n, d, steps, o = {}) { const g = gcd(n, d); n /= g; d /= g; return { type: 'frac', q, a: [n, d], simplest: o.simplest !== false, steps, disp: d === 1 ? String(n) : F(n, d), chk: o.chk, hint: o.hint || 'Write your answer as a fraction like 3/4.' }; }
const qPair = (q, vals, ordered, steps, o = {}) => ({ type: 'pair', q, ordered, a: vals, steps, disp: o.disp || vals.map(v => N(v)).join(ordered ? ' ; ' : ' or '), chk: o.chk, hint: o.hint || (ordered ? 'Give the two numbers in the order asked.' : 'Give both answers, in any order.') });
const qLin = (q, a, b, steps, o = {}) => ({ type: 'lin', q, a: [a, b], steps, disp: linStr(a, b), chk: o.chk, hint: 'Write it like 5x + 4.' });
const qText = (q, acc, steps, o = {}) => ({ type: 'text', q, acc, steps, disp: acc[0], chk: o.chk, hint: o.hint || '' });
function qChoice(h, q, correct, wrong, steps, o = {}) { const opts = h.shuf([correct, ...wrong]); return { type: 'choice', q, opts, a: opts.indexOf(correct), steps, disp: correct, chk: () => new Set(opts).size === opts.length && opts.indexOf(correct) >= 0 && !wrong.includes(correct), hint: o.hint || '' }; }
const parts10 = n => [Math.floor(n / 1000) * 1000, Math.floor(n % 1000 / 100) * 100, Math.floor(n % 100 / 10) * 10, n % 10].filter(x => x > 0);

/* ======================= MATHEMATICS ======================= */
const gAddSub = h => {
  if (h.R() < 0.5) { const a = h.ri(1200, 8999), b = h.ri(1200, 8999); let run = a; const st = parts10(b).map(p => { run += p; return N(run - p) + ' + ' + N(p) + ' = ' + N(run); });
    return qNum('Calculate: ' + N(a) + ' + ' + N(b), a + b, ['Add the parts of ' + N(b) + ' one at a time:', ...st], { chk: () => (a + b) - b === a }); }
  const a = h.ri(3000, 9999), b = h.ri(1000, a - 500); let run = a; const st = parts10(b).map(p => { run -= p; return N(run + p) + ' \u2212 ' + N(p) + ' = ' + N(run); });
  return qNum('Calculate: ' + N(a) + ' \u2212 ' + N(b), a - b, ['Subtract the parts of ' + N(b) + ' one at a time:', ...st], { chk: () => (a - b) + b === a });
};
const gMulDiv = h => {
  if (h.R() < 0.6) { const a = h.ri(12, 480), b = h.ri(2, 29), t = Math.floor(b / 10) * 10, o = b % 10, st = t && o ? [a + ' \u00D7 ' + t + ' = ' + N(a * t), a + ' \u00D7 ' + o + ' = ' + N(a * o), N(a * t) + ' + ' + N(a * o) + ' = ' + N(a * b)] : [a + ' \u00D7 ' + b + ' = ' + N(a * b)];
    return qNum('Calculate: ' + a + ' \u00D7 ' + b, a * b, ['Break ' + b + ' into parts:', ...st], { chk: () => { let s = 0; for (let i = 0; i < b; i++) s += a; return s === a * b; } }); }
  const d = h.ri(3, 12), q = h.ri(12, 95), n = d * q;
  return qNum('Calculate: ' + N(n) + ' \u00F7 ' + d, q, [d + ' \u00D7 ' + q + ' = ' + N(n) + ', so ' + N(n) + ' \u00F7 ' + d + ' = ' + q], { chk: () => d * q === n });
};
const gFracBasic = h => {
  const k = h.R();
  if (k < 0.34) { const q = h.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]), cand = []; for (let p = 1; p < q; p++) if (gcd(p, q) === 1) cand.push(p); const p = h.pick(cand), m = h.ri(2, 6), g = m;
    return qFrac('Simplify the fraction ' + F(p * m, q * m) + ' as far as possible.', p, q, ['Find the highest common factor of ' + p * m + ' and ' + q * m + ': it is ' + g + '.', 'Divide top and bottom by ' + g + ': ' + F(p * m / g, q * m / g) + '.'], { chk: () => gcd(p, q) === 1 && p * m * q === p * (q * m) }); }
  const d = h.ri(5, 12), n1 = h.ri(1, d - 2), add = h.R() < 0.6;
  if (add) { const n2 = h.ri(1, d - n1); return qFrac('Calculate ' + F(n1, d) + ' + ' + F(n2, d) + '. Give your answer in simplest form.', n1 + n2, d, ['The denominators are the same, so add the numerators: ' + n1 + ' + ' + n2 + ' = ' + (n1 + n2) + '.', 'That gives ' + F(n1 + n2, d) + '. Simplify if you can.'], { chk: () => Math.abs((n1 + n2) / d - (n1 / d + n2 / d)) < 1e-12 }); }
  const n2 = h.ri(1, n1 - 0 > 1 ? n1 - 1 : 1), nn1 = Math.max(n1, n2 + 1);
  return qFrac('Calculate ' + F(nn1, d) + ' \u2212 ' + F(n2, d) + '. Give your answer in simplest form.', nn1 - n2, d, ['The denominators are the same, so subtract the numerators: ' + nn1 + ' \u2212 ' + n2 + ' = ' + (nn1 - n2) + '.', 'That gives ' + F(nn1 - n2, d) + '. Simplify if you can.'], { chk: () => Math.abs((nn1 - n2) / d - (nn1 / d - n2 / d)) < 1e-12 });
};
const gDecimals = h => {
  const k = h.R();
  if (k < 0.34) { const c = h.ri(1000, 99999), whole = Math.floor((c + 50) / 100); return qNum('Round ' + (c / 100).toFixed(2) + ' to the nearest whole number.', whole, ['Look at the first decimal digit: ' + (Math.floor(c / 10) % 10) + '. ' + ((Math.floor(c / 10) % 10) >= 5 ? '5 or more, so round up.' : 'Less than 5, so round down.'), 'Answer: ' + whole], { chk: () => Math.abs(whole - c / 100) <= 0.5 }); }
  if (k < 0.67) { const c = h.ri(1000, 99999), t = Math.floor((c + 5) / 10) / 10; return qNum('Round ' + (c / 100).toFixed(2) + ' to 1 decimal place.', t, ['Look at the second decimal digit: ' + (c % 10) + '. ' + ((c % 10) >= 5 ? '5 or more, so round up.' : 'Less than 5, so round down.'), 'Answer: ' + t.toFixed(1)], { dp: 1, tol: 0.0001, chk: () => Math.abs(t - c / 100) <= 0.05 + 1e-9 }); }
  const c1 = h.ri(100, 9999), c2 = h.ri(100, 9999), s = (c1 + c2) / 100;
  return qNum('Calculate: ' + (c1 / 100).toFixed(2) + ' + ' + (c2 / 100).toFixed(2), s, ['Line up the decimal points and add.', (c1 / 100).toFixed(2) + ' + ' + (c2 / 100).toFixed(2) + ' = ' + s.toFixed(2)], { dp: 2, tol: 0.0001, chk: () => (c1 + c2) / 100 === s });
};
const gPerimArea = h => {
  const unit = h.pick(['cm', 'm']), sq = h.R() < 0.3, l = h.ri(3, 25), w = sq ? l : h.ri(2, 20), per = h.R() < 0.5;
  const shape = sq ? 'a square with sides of ' + l + ' ' + unit : 'a rectangle ' + l + ' ' + unit + ' long and ' + w + ' ' + unit + ' wide';
  return per ? qNum('Calculate the perimeter of ' + shape + '.', 2 * (l + w), [sq ? 'Perimeter of a square = 4 \u00D7 side = 4 \u00D7 ' + l + ' = ' + 4 * l : 'Perimeter = 2 \u00D7 (length + width) = 2 \u00D7 (' + l + ' + ' + w + ') = ' + 2 * (l + w)], { unit, chk: () => l + w + l + w === 2 * (l + w) })
    : qNum('Calculate the area of ' + shape + '.', l * w, ['Area = length \u00D7 width = ' + l + ' \u00D7 ' + w + ' = ' + l * w], { unit: unit + '\u00B2', chk: () => { let s = 0; for (let i = 0; i < w; i++) s += l; return s === l * w; } });
};
const gIntegers = h => {
  const op = h.pick(['+', '\u2212', '\u00D7', '\u00F7']); let a = h.ri(-20, 20) || 7, b = h.ri(-12, 12) || -4;
  if (op === '\u00F7') { const q = h.ri(-12, 12) || 3; a = q * b; }
  const r = op === '+' ? a + b : op === '\u2212' ? a - b : op === '\u00D7' ? a * b : a / b;
  const hint = op === '\u2212' ? 'Subtracting a negative is the same as adding.' : op === '+' ? 'Adding a negative is the same as subtracting.' : 'Same signs give a positive, different signs give a negative.';
  return qNum('Calculate: ' + par(a) + ' ' + op + ' ' + par(b), r, [hint, par(a) + ' ' + op + ' ' + par(b) + ' = ' + N(r)], { chk: () => op === '+' ? r - b === a : op === '\u2212' ? r + b === a : op === '\u00D7' ? (b === 0 || r / b === a) : r * b === a });
};
const gFracDiff = h => {
  let d1, d2; do { d1 = h.ri(2, 9); d2 = h.ri(2, 9); } while (d1 === d2);
  let n1 = h.ri(1, d1 - 1), n2 = h.ri(1, d2 - 1), add = h.R() < 0.5; const L = lcm(d1, d2);
  if (!add && n1 * d2 <= n2 * d1) { [n1, n2] = [n2, n1]; [d1, d2] = [d2, d1]; }
  const a = n1 * (L / d1), b = n2 * (L / d2), r = add ? a + b : a - b;
  return qFrac('Calculate ' + F(n1, d1) + (add ? ' + ' : ' \u2212 ') + F(n2, d2) + '. Give your answer in simplest form (improper fractions are fine).', r, L, ['The lowest common denominator of ' + d1 + ' and ' + d2 + ' is ' + L + '.', F(n1, d1) + ' = ' + F(a, L) + ' and ' + F(n2, d2) + ' = ' + F(b, L), F(a, L) + (add ? ' + ' : ' \u2212 ') + F(b, L) + ' = ' + F(r, L), 'Simplify if possible.'], { chk: () => Math.abs((add ? n1 / d1 + n2 / d2 : n1 / d1 - n2 / d2) - r / L) < 1e-12 });
};
const gFracMul = h => {
  const d1 = h.ri(2, 9), d2 = h.ri(2, 9), n1 = h.ri(1, 8), n2 = h.ri(1, 8), mul = h.R() < 0.55;
  if (mul) return qFrac('Calculate ' + F(n1, d1) + ' \u00D7 ' + F(n2, d2) + '. Give your answer in simplest form.', n1 * n2, d1 * d2, ['Multiply the numerators: ' + n1 + ' \u00D7 ' + n2 + ' = ' + n1 * n2 + '. Multiply the denominators: ' + d1 + ' \u00D7 ' + d2 + ' = ' + d1 * d2 + '.', 'Simplify ' + F(n1 * n2, d1 * d2) + '.'], { chk: () => Math.abs(n1 / d1 * (n2 / d2) - n1 * n2 / (d1 * d2)) < 1e-12 });
  return qFrac('Calculate ' + F(n1, d1) + ' \u00F7 ' + F(n2, d2) + '. Give your answer in simplest form.', n1 * d2, d1 * n2, ['Dividing by ' + F(n2, d2) + ' is the same as multiplying by its reciprocal ' + F(d2, n2) + '.', F(n1, d1) + ' \u00D7 ' + F(d2, n2) + ' = ' + F(n1 * d2, d1 * n2), 'Simplify.'], { chk: () => Math.abs(n1 / d1 / (n2 / d2) - n1 * d2 / (d1 * n2)) < 1e-12 });
};
const gPercent = h => {
  const base = 20 * h.ri(2, 60), p = 5 * h.ri(1, 19), k = h.R();
  if (k < 0.45) return qNum('Calculate ' + p + '% of ' + N(base) + '.', base * p / 100, [p + '% = ' + p + '/100', N(base) + ' \u00D7 ' + p + ' \u00F7 100 = ' + N(base * p / 100)], { chk: () => base * p % 100 === 0 && base * p / 100 * 100 === base * p });
  const up = k < 0.75, r = up ? base * (100 + p) / 100 : base * (100 - p) / 100;
  return qNum((up ? 'Increase ' : 'Decrease ') + N(base) + ' by ' + p + '%.', r, [p + '% of ' + N(base) + ' = ' + N(base * p / 100), N(base) + (up ? ' + ' : ' \u2212 ') + N(base * p / 100) + ' = ' + N(r)], { chk: () => up ? r - base * p / 100 === base : r + base * p / 100 === base });
};
const gRatio = h => {
  if (h.R() < 0.4) { const a = h.ri(1, 9), b = h.ri(1, 9), m = h.ri(2, 7), g = gcd(a, b), sa = a / g, sb = b / g;
    return qPair('Simplify the ratio ' + a * m + ' : ' + b * m + '.', [sa * (g > 0 ? 1 : 1), sb], true, ['Divide both parts by their highest common factor.', 'Answer: ' + sa + ' : ' + sb], { disp: sa + ' : ' + sb, hint: 'Write it like 2 : 3.', chk: () => gcd(sa, sb) === 1 && sa * (b * m) === sb * (a * m) }); }
  let a = h.ri(1, 7), b = h.ri(1, 7); if (a === b) b++; const k = h.ri(2, 40), tot = (a + b) * k, first = h.R() < 0.5;
  return qNum('Share ' + N(tot) + ' sweets in the ratio ' + a + ' : ' + b + '. How many sweets is the ' + (first ? 'first' : 'second') + ' share?', first ? a * k : b * k, ['Add the parts: ' + a + ' + ' + b + ' = ' + (a + b), 'One part = ' + N(tot) + ' \u00F7 ' + (a + b) + ' = ' + k, (first ? a : b) + ' \u00D7 ' + k + ' = ' + (first ? a * k : b * k)], { chk: () => a * k + b * k === tot });
};
const gAlgSimplify = h => {
  let a1, a2, b1, b2; do { a1 = h.ri(-6, 9) || 3; a2 = h.ri(-6, 9) || 2; b1 = h.ri(-9, 9); b2 = h.ri(-9, 9); } while (a1 + a2 === 0 || b1 === 0 || b2 === 0);
  const a = a1 + a2, b = b1 + b2;
  return qLin('Simplify: ' + expr([[a1, 'x'], [b1, ''], [a2, 'x'], [b2, '']]), a, b, ['Group the x terms: ' + sgn(a1, true) + 'x' + sgn(a2) + 'x = ' + a + 'x', 'Group the numbers: ' + sgn(b1, true) + sgn(b2) + ' = ' + b, 'Answer: ' + linStr(a, b)], { chk: () => [0, 1, 5].every(x => a1 * x + b1 + a2 * x + b2 === a * x + b) });
};
const gAlgSolve = h => {
  const s = h.ri(-9, 12) || 5, k = h.R();
  if (k < 0.3) { const b = h.ri(2, 15), add = h.R() < 0.5, c = add ? s + b : s - b; return qNum('Solve for x: x ' + (add ? '+' : '\u2212') + ' ' + b + ' = ' + c, s, ['Do the opposite operation on both sides.', 'x = ' + c + (add ? ' \u2212 ' : ' + ') + b + ' = ' + s], { chk: () => add ? s + b === c : s - b === c }); }
  const a = h.ri(2, 9), b = h.ri(-12, 12) || 3, c = a * s + b;
  return qNum('Solve for x: ' + a + 'x ' + (b < 0 ? '\u2212' : '+') + ' ' + Math.abs(b) + ' = ' + c, s, ['Undo the ' + (b < 0 ? 'subtraction' : 'addition') + ' first: ' + a + 'x = ' + c + (b < 0 ? ' + ' : ' \u2212 ') + Math.abs(b) + ' = ' + (c - b), 'Then divide by ' + a + ': x = ' + (c - b) + ' \u00F7 ' + a + ' = ' + s, 'Check: ' + a + ' \u00D7 ' + par(s) + ' ' + (b < 0 ? '\u2212' : '+') + ' ' + Math.abs(b) + ' = ' + c], { chk: () => a * s + b === c });
};
const gExponents = h => {
  const k = h.R(), b = h.ri(2, 9);
  if (k < 0.34) { const n = b <= 3 ? h.ri(2, 6) : h.ri(2, 3); return qNum('Calculate: ' + sup(b, n), Math.pow(b, n), [sup(b, n) + ' = ' + Array(n).fill(b).join(' \u00D7 ') + ' = ' + N(Math.pow(b, n))], { chk: () => { let p = 1; for (let i = 0; i < n; i++) p *= b; return p === Math.pow(b, n); } }); }
  const m = h.ri(2, 9), n = h.ri(2, 9);
  if (k < 0.62) return qNum('Write as a single power ' + sup(b, 'x') + '. Find x: ' + sup(b, m) + ' \u00D7 ' + sup(b, n) + ' = ' + sup(b, 'x'), m + n, ['Product law: add the exponents.', m + ' + ' + n + ' = ' + (m + n)], { chk: () => Math.pow(b, m) * Math.pow(b, n) === Math.pow(b, m + n) });
  if (k < 0.85) { const hi = Math.max(m, n) + 1, lo = Math.min(m, n); return qNum('Find x: ' + sup(b, hi) + ' \u00F7 ' + sup(b, lo) + ' = ' + sup(b, 'x'), hi - lo, ['Quotient law: subtract the exponents.', hi + ' \u2212 ' + lo + ' = ' + (hi - lo)], { chk: () => Math.pow(b, hi) / Math.pow(b, lo) === Math.pow(b, hi - lo) }); }
  const mm = h.ri(2, 4), nn = h.ri(2, 4); return qNum('Find x: (' + sup(b, mm) + ')<sup>' + nn + '</sup> = ' + sup(b, 'x'), mm * nn, ['Power of a power: multiply the exponents.', mm + ' \u00D7 ' + nn + ' = ' + mm * nn], { chk: () => Math.pow(Math.pow(b, mm), nn) === Math.pow(b, mm * nn) });
};
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
const gPythag = h => {
  const [a0, b0, c0] = h.pick(TRIPLES), k = h.ri(1, 3), a = a0 * k, b = b0 * k, c = c0 * k, hyp = h.R() < 0.55;
  if (hyp) return qNum('A right-angled triangle has shorter sides of ' + a + ' cm and ' + b + ' cm. Calculate the length of the hypotenuse (in cm).', c, ['hypotenuse\u00B2 = ' + a + '\u00B2 + ' + b + '\u00B2 = ' + a * a + ' + ' + b * b + ' = ' + (a * a + b * b), 'hypotenuse = \u221A' + (a * a + b * b) + ' = ' + c], { unit: 'cm', chk: () => a * a + b * b === c * c });
  return qNum('A right-angled triangle has a hypotenuse of ' + c + ' cm and one side of ' + a + ' cm. Calculate the length of the other side (in cm).', b, ['side\u00B2 = ' + c + '\u00B2 \u2212 ' + a + '\u00B2 = ' + c * c + ' \u2212 ' + a * a + ' = ' + (c * c - a * a), 'side = \u221A' + (c * c - a * a) + ' = ' + b], { unit: 'cm', chk: () => a * a + b * b === c * c });
};
const gCircle = h => {
  const r = h.ri(2, 15), area = h.R() < 0.5;
  return area ? qNum('Use \u03C0 = 3.14. Calculate the area of a circle with radius ' + r + ' cm. Give your answer to 2 decimal places.', 314 * r * r / 100, ['Area = \u03C0r\u00B2 = 3.14 \u00D7 ' + r + '\u00B2 = 3.14 \u00D7 ' + r * r + ' = ' + (314 * r * r / 100).toFixed(2)], { dp: 2, tol: 0.006, unit: 'cm\u00B2', chk: () => Math.abs(314 * r * r / 100 - 3.14 * r * r) < 1e-9 })
    : qNum('Use \u03C0 = 3.14. Calculate the circumference of a circle with radius ' + r + ' cm. Give your answer to 2 decimal places.', 628 * r / 100, ['Circumference = 2\u03C0r = 2 \u00D7 3.14 \u00D7 ' + r + ' = ' + (628 * r / 100).toFixed(2)], { dp: 2, tol: 0.006, unit: 'cm', chk: () => Math.abs(628 * r / 100 - 2 * 3.14 * r) < 1e-9 });
};
function makeData(h, n, mean) {
  for (let t = 0; t < 200; t++) { const m = mean || h.ri(5, 15), xs = []; let s = 0; for (let i = 0; i < n - 1; i++) { const v = Math.max(1, m + h.ri(-6, 6)); xs.push(v); s += v; } const last = n * m - s; if (last >= 1 && last <= 30) { xs.push(last); return h.shuf(xs); } }
  return [4, 6, 8, 10, 12].slice(0, n);
}
const gData = h => {
  const k = h.R();
  if (k < 0.35) { const n = h.pick([5, 6]), xs = makeData(h, n), mean = xs.reduce((a, b) => a + b, 0) / n; return qNum('Calculate the mean of: ' + xs.join(', '), mean, ['Add the numbers: ' + xs.join(' + ') + ' = ' + xs.reduce((a, b) => a + b, 0), 'Divide by how many numbers there are: ' + xs.reduce((a, b) => a + b, 0) + ' \u00F7 ' + n + ' = ' + mean], { chk: () => xs.reduce((a, b) => a + b, 0) === mean * n }); }
  if (k < 0.6) { const n = h.pick([5, 7]), xs = Array.from({ length: n }, () => h.ri(1, 30)), s = xs.slice().sort((a, b) => a - b), med = s[(n - 1) / 2]; return qNum('Find the median of: ' + xs.join(', '), med, ['Put the numbers in order: ' + s.join(', '), 'The middle number is ' + med], { chk: () => s.filter(v => v < med).length <= (n - 1) / 2 && s.filter(v => v > med).length <= (n - 1) / 2 }); }
  if (k < 0.8) { const n = h.pick([6, 7, 8]), pool = h.shuf(Array.from({ length: 20 }, (_, i) => i + 1)), mode = pool[0], xs = h.shuf([mode, mode, mode, ...pool.slice(1, n - 2)]); return qNum('Find the mode of: ' + xs.join(', '), mode, ['The mode is the number that appears most often.', mode + ' appears 3 times.'], { chk: () => xs.filter(v => v === mode).length > Math.max(...xs.filter(v => v !== mode).map(v => xs.filter(w => w === v).length)) }); }
  const xs = Array.from({ length: h.pick([5, 6, 7]) }, () => h.ri(1, 40)), mx = Math.max(...xs), mn = Math.min(...xs); return qNum('Find the range of: ' + xs.join(', '), mx - mn, ['Range = largest \u2212 smallest = ' + mx + ' \u2212 ' + mn + ' = ' + (mx - mn)], { chk: () => xs.every(v => v >= mn && v <= mx) });
};
const gQuadratic = h => {
  let r1, r2; do { r1 = h.ri(-9, 9); r2 = h.ri(-9, 9); } while (!r1 || !r2 || r1 === r2);
  const b = -(r1 + r2), c = r1 * r2, eq = 'x\u00B2' + (b ? sgn(b) + 'x' : '') + sgn(c) + ' = 0';
  const f = r => '(x ' + (r < 0 ? '+ ' + Math.abs(r) : '\u2212 ' + r) + ')';
  return qPair('Solve for x: ' + eq, [r1, r2], false, ['Find two numbers that multiply to ' + c + ' and add to ' + b + ': ' + par(-r1) + ' and ' + par(-r2) + '.', 'Factorise: ' + f(r1) + f(r2) + ' = 0', 'So x = ' + r1 + ' or x = ' + r2], { chk: () => [r1, r2].every(x => x * x + b * x + c === 0) });
};
const gSimul = h => {
  let x, y, a1, b1, a2, b2; do { x = h.ri(-5, 8); y = h.ri(-5, 8); a1 = h.ri(1, 4); b1 = h.ri(-4, 4) || 1; a2 = h.ri(-4, 4) || 2; b2 = h.ri(-4, 4) || -1; } while (a1 * b2 - a2 * b1 === 0);
  const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y, eq = (a, b, c) => expr([[a, 'x'], [b, 'y']]) + ' = ' + c;
  return qPair('Solve for x and y:  ' + eq(a1, b1, c1) + '  and  ' + eq(a2, b2, c2) + '. Give x first, then y.', [x, y], true, ['Use elimination or substitution to find both values.', 'x = ' + x + ' and y = ' + y, 'Check in equation 1: ' + a1 + '(' + x + ') + ' + par(b1) + '(' + y + ') = ' + c1, 'Check in equation 2: ' + a2 + '(' + x + ') + ' + par(b2) + '(' + y + ') = ' + c2], { disp: 'x = ' + x + ' ; y = ' + y, chk: () => a1 * x + b1 * y === c1 && a2 * x + b2 * y === c2 });
};
const gGradient = h => {
  const m = h.ri(-5, 5) || 2, c = h.ri(-6, 6), k = h.R();
  if (k < 0.5) { const x1 = h.ri(-3, 3), dx = h.ri(1, 4), x2 = x1 + dx, y1 = m * x1 + c, y2 = m * x2 + c; return qNum('Calculate the gradient of the line through the points (' + x1 + ' ; ' + y1 + ') and (' + x2 + ' ; ' + y2 + ').', m, ['m = (y\u2082 \u2212 y\u2081) \u00F7 (x\u2082 \u2212 x\u2081)', 'm = (' + y2 + ' \u2212 ' + par(y1) + ') \u00F7 (' + x2 + ' \u2212 ' + par(x1) + ') = ' + (y2 - y1) + ' \u00F7 ' + dx + ' = ' + m], { chk: () => (y2 - y1) === m * dx }); }
  if (k < 0.75) return qNum('Write down the y-intercept of the line y = ' + linStr(m, c) + '.', c, ['In y = mx + c the y-intercept is c.', 'c = ' + c], { chk: () => m * 0 + c === c });
  return qNum('Write down the gradient of the line y = ' + linStr(m, c) + '.', m, ['In y = mx + c the gradient is m, the number in front of x.', 'm = ' + m], { chk: () => true });
};
const gSeq = h => {
  if (h.R() < 0.6) { const a = h.ri(2, 20), d = h.ri(-6, 9) || 4, n = h.ri(8, 20), t = [a, a + d, a + 2 * d]; return qNum('Find the ' + n + 'th term of the sequence ' + t.join('; ') + '; \u2026', a + (n - 1) * d, ['This is arithmetic: a = ' + a + ', d = ' + d, 'T\u2099 = a + (n \u2212 1)d = ' + a + ' + ' + (n - 1) + ' \u00D7 ' + par(d) + ' = ' + (a + (n - 1) * d)], { chk: () => { let v = a; for (let i = 1; i < n; i++) v += d; return v === a + (n - 1) * d; } }); }
  const a = h.ri(1, 5), r = h.ri(2, 3), n = h.ri(4, 7), t = [a, a * r, a * r * r]; return qNum('Find the ' + n + 'th term of the sequence ' + t.join('; ') + '; \u2026', a * Math.pow(r, n - 1), ['This is geometric: a = ' + a + ', r = ' + r, 'T\u2099 = a \u00D7 r\u207F\u207B\u00B9 = ' + a + ' \u00D7 ' + r + '^' + (n - 1) + ' = ' + a * Math.pow(r, n - 1)], { chk: () => { let v = a; for (let i = 1; i < n; i++) v *= r; return v === a * Math.pow(r, n - 1); } });
};
/* money maths in exact cents: compound interest uses BigInt so there is no rounding drift */
function compoundCents(P, i, n) { const num = BigInt(P) * BigInt(100 + i) ** BigInt(n) * 100n, den = 100n ** BigInt(n); return Number((num * 2n + den) / (den * 2n)); }
const gFinance = h => {
  const P = 100 * h.ri(10, 200), i = h.ri(5, 12), n = h.ri(2, 6), simple = h.R() < 0.5;
  if (simple) { const A = P * (100 + i * n) / 100; return qNum('R' + N(P) + ' is invested at ' + i + '% simple interest per year for ' + n + ' years. Calculate the final amount (in rand).', A, ['A = P(1 + i \u00D7 n) = ' + N(P) + ' \u00D7 (1 + ' + (i / 100) + ' \u00D7 ' + n + ')', 'A = R' + N(A)], { pre: 'R', dp: 2, tol: 0.01, chk: () => { let v = P; for (let y = 0; y < n; y++) v += P * i / 100; return Math.abs(v - A) < 1e-6; } }); }
  const cents = compoundCents(P, i, n), A = cents / 100;
  return qNum('R' + N(P) + ' is invested at ' + i + '% compound interest per year for ' + n + ' years. Calculate the final amount, to the nearest cent (in rand).', A, ['A = P(1 + i)^n = ' + N(P) + ' \u00D7 (1 + ' + (i / 100) + ')^' + n, 'A = R' + A.toFixed(2)], { pre: 'R', dp: 2, tol: 0.01, chk: () => Math.abs(P * Math.pow(1 + i / 100, n) - A) < 0.011 && A > P });
};
const gTrig = h => {
  const [a0, b0, c0] = h.pick(TRIPLES), k = h.ri(1, 3), [opp, adj, hyp] = [a0 * k, b0 * k, c0 * k], fn = h.pick(['sin', 'cos', 'tan']);
  const [n, d] = fn === 'sin' ? [opp, hyp] : fn === 'cos' ? [adj, hyp] : [opp, adj];
  return qFrac('In triangle ABC, \u2220B = 90\u00B0, AB = ' + adj + ', BC = ' + opp + ' and AC = ' + hyp + '. Calculate ' + fn + ' A as a fraction.', n, d, ['Looking from angle A: opposite = BC = ' + opp + ', adjacent = AB = ' + adj + ', hypotenuse = AC = ' + hyp, fn + ' A = ' + (fn === 'sin' ? 'opposite \u00F7 hypotenuse' : fn === 'cos' ? 'adjacent \u00F7 hypotenuse' : 'opposite \u00F7 adjacent') + ' = ' + F(n, d), 'Simplified: ' + (gcd(n, d) === 1 ? F(n, d) : F(n / gcd(n, d), d / gcd(n, d)))], { simplest: false, chk: () => adj * adj + opp * opp === hyp * hyp });
};
const gProb = h => {
  const r = h.ri(1, 9), b = h.ri(1, 9), g = h.ri(1, 9), tot = r + b + g, k = h.R();
  const col = h.pick([['red', r], ['blue', b], ['green', g]]);
  if (k < 0.7) return qFrac('A bag has ' + r + ' red, ' + b + ' blue and ' + g + ' green balls. One ball is taken without looking. What is the probability that it is ' + col[0] + '? Give your answer in simplest form.', col[1], tot, ['Total balls = ' + r + ' + ' + b + ' + ' + g + ' = ' + tot, 'P(' + col[0] + ') = ' + F(col[1], tot), 'Simplify if you can.'], { chk: () => r + b + g === tot });
  return qFrac('A bag has ' + r + ' red, ' + b + ' blue and ' + g + ' green balls. One ball is taken without looking. What is the probability that it is NOT ' + col[0] + '? Give your answer in simplest form.', tot - col[1], tot, ['Total balls = ' + tot, 'Balls that are not ' + col[0] + ' = ' + (tot - col[1]), 'P(not ' + col[0] + ') = ' + F(tot - col[1], tot) + ', then simplify.'], { chk: () => (tot - col[1]) / tot + col[1] / tot === 1 });
};

/* ================= MATHEMATICAL LITERACY ================= */
const gVat = h => {
  const excl = 20 * h.ri(5, 100), incl = excl * 115 / 100, k = h.R();
  if (k < 0.4) return qNum('An item costs ' + Rm(excl) + ' excluding VAT. VAT is 15%. What is the price including VAT?', incl, ['VAT = 15% of ' + N(excl) + ' = ' + N(excl * 15 / 100), N(excl) + ' + ' + N(excl * 15 / 100) + ' = ' + N(incl)], { pre: 'R', chk: () => incl * 100 === excl * 115 });
  if (k < 0.75) return qNum('An item costs ' + Rm(incl) + ' including VAT. VAT is 15%. What is the price excluding VAT?', excl, ['Price including VAT = price excluding VAT \u00D7 1.15', N(incl) + ' \u00F7 1.15 = ' + N(excl)], { pre: 'R', chk: () => excl * 115 === incl * 100 });
  return qNum('An item costs ' + Rm(excl) + ' excluding VAT. VAT is 15%. How much VAT is added?', excl * 15 / 100, ['VAT = 15% of ' + N(excl) + ' = ' + N(excl) + ' \u00D7 15 \u00F7 100 = ' + N(excl * 15 / 100)], { pre: 'R', chk: () => excl * 15 % 100 === 0 });
};
const gDiscount = h => {
  const price = 20 * h.ri(5, 75), d = 5 * h.ri(1, 10), save = price * d / 100, k = h.R();
  if (k < 0.4) return qNum('A jacket is marked at ' + Rm(price) + '. There is a ' + d + '% discount. What is the sale price?', price - save, [d + '% of ' + N(price) + ' = ' + N(save), N(price) + ' \u2212 ' + N(save) + ' = ' + N(price - save)], { pre: 'R', chk: () => price - save + save === price });
  if (k < 0.7) return qNum('A jacket is marked at ' + Rm(price) + '. There is a ' + d + '% discount. How much do you save?', save, [d + '% of ' + N(price) + ' = ' + N(price) + ' \u00D7 ' + d + ' \u00F7 100 = ' + N(save)], { pre: 'R', chk: () => price * d % 100 === 0 });
  return qNum('A jacket marked at ' + Rm(price) + ' is sold for ' + Rm(price - save) + '. What percentage discount is that?', d, ['Amount saved = ' + N(price) + ' \u2212 ' + N(price - save) + ' = ' + N(save), '(' + N(save) + ' \u00F7 ' + N(price) + ') \u00D7 100 = ' + d + '%'], { unit: '%', chk: () => save * 100 === d * price });
};
const CONV = [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['kg', 'g', 1000], ['\u2113', 'm\u2113', 1000], ['hours', 'minutes', 60]];
const gConvert = h => {
  const k = h.R();
  if (k < 0.2) { const c = 5 * h.ri(0, 24), f = c * 9 / 5 + 32; return qNum('Convert ' + c + '\u00B0C to degrees Fahrenheit. Use \u00B0F = \u00B0C \u00D7 9/5 + 32.', f, [c + ' \u00D7 9/5 = ' + c * 9 / 5, c * 9 / 5 + ' + 32 = ' + f], { unit: '\u00B0F', chk: () => (f - 32) * 5 / 9 === c }); }
  if (k < 0.35) { const c = 5 * h.ri(0, 24), f = c * 9 / 5 + 32; return qNum('Convert ' + f + '\u00B0F to degrees Celsius. Use \u00B0C = (\u00B0F \u2212 32) \u00D7 5/9.', c, [f + ' \u2212 32 = ' + (f - 32), (f - 32) + ' \u00D7 5/9 = ' + c], { unit: '\u00B0C', chk: () => c * 9 / 5 + 32 === f }); }
  const [big, small, f] = h.pick(CONV), toSmall = h.R() < 0.5;
  if (toSmall) { const v = h.pick([2, 3, 5, 7, 12, 25, 40]) + h.pick([0, 0.5]); return qNum('Convert ' + v + ' ' + big + ' to ' + small + '.', v * f, ['1 ' + big + ' = ' + N(f) + ' ' + small + '. To a smaller unit, multiply.', v + ' \u00D7 ' + N(f) + ' = ' + N(v * f)], { unit: small, chk: () => Math.abs(v * f / f - v) < 1e-9 }); }
  const v = f * h.ri(1, 12) / 2; return qNum('Convert ' + N(v) + ' ' + small + ' to ' + big + '.', v / f, ['1 ' + big + ' = ' + N(f) + ' ' + small + '. To a larger unit, divide.', N(v) + ' \u00F7 ' + N(f) + ' = ' + trim(v / f)], { unit: big, tol: 1e-6, chk: () => Math.abs(v / f * f - v) < 1e-9 });
};
const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const gTime = h => {
  const start = 5 * h.ri(72, 180), dur = 5 * h.ri(4, 60), end = start + dur;
  if (h.R() < 0.5) return qNum('A bus leaves at ' + hhmm(start) + ' and arrives at ' + hhmm(end) + '. How many minutes does the trip take?', dur, ['From ' + hhmm(start) + ' to the next full hour, then to ' + hhmm(end) + '. Or: ' + end + ' \u2212 ' + start + ' (in minutes after midnight) = ' + dur, 'Total: ' + dur + ' minutes (' + Math.floor(dur / 60) + ' h ' + dur % 60 + ' min)'], { unit: 'minutes', chk: () => end - start === dur });
  return qText('What time (24-hour clock) is it ' + Math.floor(dur / 60) + ' hours and ' + dur % 60 + ' minutes after ' + hhmm(start) + '? Write it like 14:35.', [hhmm(end)], ['Add the hours, then the minutes. If the minutes reach 60, add 1 to the hours.', hhmm(start) + ' + ' + Math.floor(dur / 60) + ' h ' + dur % 60 + ' min = ' + hhmm(end)], { chk: () => end < 1440 && end - start === dur });
};
const gSpeedFuel = h => {
  const k = h.R(), sp = 10 * h.ri(3, 12), t = h.ri(2, 6), d = sp * t;
  if (k < 0.3) return qNum('A car travels ' + N(d) + ' km in ' + t + ' hours at a steady speed. What is its average speed in km/h?', sp, ['Speed = distance \u00F7 time = ' + N(d) + ' \u00F7 ' + t + ' = ' + sp], { unit: 'km/h', chk: () => sp * t === d });
  if (k < 0.5) return qNum('A bus travels at ' + sp + ' km/h for ' + t + ' hours. How far does it travel (in km)?', d, ['Distance = speed \u00D7 time = ' + sp + ' \u00D7 ' + t + ' = ' + d], { unit: 'km', chk: () => d / t === sp });
  if (k < 0.65) return qNum('A taxi travels ' + N(d) + ' km at ' + sp + ' km/h. How many hours does the trip take?', t, ['Time = distance \u00F7 speed = ' + N(d) + ' \u00F7 ' + sp + ' = ' + t], { unit: 'hours', chk: () => sp * t === d });
  const dist = 100 * h.ri(1, 9), cons = h.ri(5, 14), pc = h.ri(2200, 2800), litres = cons * dist / 100, cost = litres * pc / 100;
  return qNum('A car uses ' + cons + ' litres of petrol per 100 km. Petrol costs R' + (pc / 100).toFixed(2) + ' per litre. How much does petrol for a ' + dist + ' km trip cost, in rand?', cost, ['Litres needed = ' + dist + ' \u00F7 100 \u00D7 ' + cons + ' = ' + litres, 'Cost = ' + litres + ' \u00D7 R' + (pc / 100).toFixed(2) + ' = R' + cost.toFixed(2)], { pre: 'R', dp: 2, tol: 0.01, chk: () => litres * pc === Math.round(cost * 100) });
};
const gBudget = h => {
  const inc = 500 * h.ri(8, 60), items = [['rent', 100 * h.ri(10, 40)], ['food', 50 * h.ri(10, 40)], ['transport', 50 * h.ri(4, 20)], ['airtime', 10 * h.ri(5, 20)]], tot = items.reduce((s, x) => s + x[1], 0);
  if (inc <= tot || h.R() < 0.5) { const p = 5 * h.ri(2, 12), I = 100 * h.ri(40, 200), rent = I * p / 100; return qNum('Sipho earns ' + Rm(I) + ' a month and pays ' + Rm(rent) + ' rent. What percentage of his income goes on rent?', p, ['(' + N(rent) + ' \u00F7 ' + N(I) + ') \u00D7 100 = ' + p + '%'], { unit: '%', chk: () => rent * 100 === p * I }); }
  return qNum('Thandi earns ' + Rm(inc) + ' a month. Her expenses are ' + items.map(x => x[0] + ' ' + Rm(x[1])).join(', ') + '. How much does she have left to save?', inc - tot, ['Total expenses = ' + items.map(x => N(x[1])).join(' + ') + ' = ' + N(tot), 'Savings = ' + N(inc) + ' \u2212 ' + N(tot) + ' = ' + N(inc - tot)], { pre: 'R', chk: () => inc - tot + tot === inc });
};
const gExchange = h => {
  const [name, sym] = h.pick([['US dollar', 'US$'], ['euro', '\u20AC'], ['British pound', '\u00A3']]), rate = h.ri(12, 25), k = h.ri(2, 40);
  if (h.R() < 0.5) return qNum('In this question ' + sym + '1 = R' + rate + '. How many rand do you get for ' + sym + N(k) + '?', rate * k, [N(k) + ' \u00D7 ' + rate + ' = ' + N(rate * k)], { pre: 'R', chk: () => rate * k / rate === k });
  return qNum('In this question ' + sym + '1 = R' + rate + '. How many ' + name + 's do you get for ' + Rm(rate * k) + '?', k, [N(rate * k) + ' \u00F7 ' + rate + ' = ' + N(k)], { pre: sym, chk: () => k * rate === rate * k });
};
const gMeasure = h => {
  if (h.R() < 0.5) { const l = 10 * h.ri(2, 10), w = 10 * h.ri(2, 8), hh = 5 * h.ri(2, 10), vol = l * w * hh, lit = vol / 1000;
    if (h.R() < 0.5) return qNum('A box is ' + l + ' cm long, ' + w + ' cm wide and ' + hh + ' cm high. Calculate its volume in cm\u00B3.', vol, ['Volume = length \u00D7 width \u00D7 height = ' + l + ' \u00D7 ' + w + ' \u00D7 ' + hh + ' = ' + N(vol)], { unit: 'cm\u00B3', chk: () => l * w * hh === vol });
    return qNum('A water tank is ' + l + ' cm long, ' + w + ' cm wide and ' + hh + ' cm high. How many litres can it hold? (1 000 cm\u00B3 = 1 \u2113)', lit, ['Volume = ' + l + ' \u00D7 ' + w + ' \u00D7 ' + hh + ' = ' + N(vol) + ' cm\u00B3', N(vol) + ' \u00F7 1 000 = ' + trim(lit) + ' \u2113'], { unit: '\u2113', tol: 1e-6, chk: () => lit * 1000 === vol }); }
  const L = h.ri(2, 8), W = h.ri(2, 8), s = h.pick([20, 25, 50]), n = (L * 100 / s) * (W * 100 / s);
  return qNum('A floor is ' + L + ' m by ' + W + ' m. It is covered with square tiles with sides of ' + s + ' cm. How many tiles are needed?', n, ['Tiles along the length = ' + L * 100 + ' \u00F7 ' + s + ' = ' + L * 100 / s, 'Tiles along the width = ' + W * 100 + ' \u00F7 ' + s + ' = ' + W * 100 / s, 'Total = ' + L * 100 / s + ' \u00D7 ' + W * 100 / s + ' = ' + n], { chk: () => n * s * s === L * W * 10000 });
};

/* ================= SCIENCES ================= */
const gSpeedSci = h => {
  const v = h.ri(2, 30), t = h.ri(2, 20), d = v * t, k = h.R();
  if (k < 0.34) return qNum('A cyclist travels ' + N(d) + ' m in ' + t + ' s at a constant speed. Calculate the speed.', v, ['v = d \u00F7 t = ' + N(d) + ' \u00F7 ' + t + ' = ' + v], { unit: 'm/s', chk: () => v * t === d });
  if (k < 0.67) return qNum('A runner moves at ' + v + ' m/s for ' + t + ' s. How far does the runner go?', d, ['d = v \u00D7 t = ' + v + ' \u00D7 ' + t + ' = ' + N(d)], { unit: 'm', chk: () => d / v === t });
  return qNum('A car moves ' + N(d) + ' m at ' + v + ' m/s. How long does it take?', t, ['t = d \u00F7 v = ' + N(d) + ' \u00F7 ' + v + ' = ' + t], { unit: 's', chk: () => v * t === d });
};
const gDensity = h => {
  const rho = h.ri(1, 20), V = h.ri(2, 50), m = rho * V, k = h.R();
  if (k < 0.34) return qNum('A block has a mass of ' + N(m) + ' g and a volume of ' + V + ' cm\u00B3. Calculate its density.', rho, ['\u03C1 = m \u00F7 V = ' + N(m) + ' \u00F7 ' + V + ' = ' + rho], { unit: 'g/cm\u00B3', chk: () => rho * V === m });
  if (k < 0.67) return qNum('A metal has a density of ' + rho + ' g/cm\u00B3. What is the mass of ' + V + ' cm\u00B3 of it?', m, ['m = \u03C1 \u00D7 V = ' + rho + ' \u00D7 ' + V + ' = ' + N(m)], { unit: 'g', chk: () => m / V === rho });
  return qNum('A liquid has a density of ' + rho + ' g/cm\u00B3. What volume has a mass of ' + N(m) + ' g?', V, ['V = m \u00F7 \u03C1 = ' + N(m) + ' \u00F7 ' + rho + ' = ' + V], { unit: 'cm\u00B3', chk: () => rho * V === m });
};
const gOhm = h => {
  const I = h.ri(1, 8), R = h.ri(2, 30), V = I * R, k = h.R();
  if (k < 0.34) return qNum('A resistor of ' + R + ' \u03A9 carries a current of ' + I + ' A. Calculate the voltage across it.', V, ['V = I \u00D7 R = ' + I + ' \u00D7 ' + R + ' = ' + V], { unit: 'V', chk: () => V / R === I });
  if (k < 0.67) return qNum('A voltage of ' + V + ' V is across a ' + R + ' \u03A9 resistor. Calculate the current.', I, ['I = V \u00F7 R = ' + V + ' \u00F7 ' + R + ' = ' + I], { unit: 'A', chk: () => I * R === V });
  return qNum('A current of ' + I + ' A flows when the voltage is ' + V + ' V. Calculate the resistance.', R, ['R = V \u00F7 I = ' + V + ' \u00F7 ' + I + ' = ' + R], { unit: '\u03A9', chk: () => I * R === V });
};
const gPower = h => {
  if (h.R() < 0.5) { const V = h.pick([6, 9, 12, 24, 220, 230]), I = h.ri(1, 10), P = V * I; return qNum('A device runs on ' + V + ' V and draws ' + I + ' A. Calculate its power.', P, ['P = V \u00D7 I = ' + V + ' \u00D7 ' + I + ' = ' + N(P)], { unit: 'W', chk: () => P / V === I }); }
  const P = 10 * h.ri(1, 100), t = h.ri(2, 120), E = P * t;
  return qNum('A ' + P + ' W heater runs for ' + t + ' s. How much energy does it use?', E, ['E = P \u00D7 t = ' + P + ' \u00D7 ' + t + ' = ' + N(E)], { unit: 'J', chk: () => E / t === P });
};
const gForce = h => {
  const k = h.R(), m = h.ri(1, 20), a = h.ri(1, 10), F0 = m * a;
  if (k < 0.3) return qNum('A ' + m + ' kg object accelerates at ' + a + ' m/s\u00B2. Calculate the resultant force.', F0, ['F = m \u00D7 a = ' + m + ' \u00D7 ' + a + ' = ' + F0], { unit: 'N', chk: () => F0 / m === a });
  if (k < 0.5) return qNum('A force of ' + F0 + ' N acts on a ' + m + ' kg object. Calculate its acceleration.', a, ['a = F \u00F7 m = ' + F0 + ' \u00F7 ' + m + ' = ' + a], { unit: 'm/s\u00B2', chk: () => m * a === F0 });
  if (k < 0.65) return qNum('A force of ' + F0 + ' N gives an object an acceleration of ' + a + ' m/s\u00B2. Calculate its mass.', m, ['m = F \u00F7 a = ' + F0 + ' \u00F7 ' + a + ' = ' + m], { unit: 'kg', chk: () => m * a === F0 });
  const W = m * 98 / 10; return qNum('Use g = 9.8 m/s\u00B2. Calculate the weight of a ' + m + ' kg object.', W, ['W = m \u00D7 g = ' + m + ' \u00D7 9.8 = ' + W.toFixed(1)], { unit: 'N', dp: 1, tol: 0.06, chk: () => Math.abs(W - m * 9.8) < 1e-9 });
};
const MOLAR = [['water (H\u2082O)', 18], ['carbon dioxide (CO\u2082)', 44], ['oxygen gas (O\u2082)', 32], ['nitrogen gas (N\u2082)', 28], ['sodium hydroxide (NaOH)', 40], ['calcium carbonate (CaCO\u2083)', 100], ['methane (CH\u2084)', 16], ['sulfuric acid (H\u2082SO\u2084)', 98]];
const gMoles = h => {
  const [name, M] = h.pick(MOLAR), n = h.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), m = M * n;
  if (h.R() < 0.5) return qNum('Calculate the number of moles in ' + trim(m) + ' g of ' + name + '. (M = ' + M + ' g/mol)', n, ['n = m \u00F7 M = ' + trim(m) + ' \u00F7 ' + M + ' = ' + n], { unit: 'mol', tol: 1e-6, chk: () => Math.abs(n * M - m) < 1e-9 });
  return qNum('Calculate the mass of ' + n + ' mol of ' + name + '. (M = ' + M + ' g/mol)', m, ['m = n \u00D7 M = ' + n + ' \u00D7 ' + M + ' = ' + trim(m)], { unit: 'g', tol: 1e-6, chk: () => Math.abs(m / M - n) < 1e-9 });
};
const ATOMS = [['carbon-12', 6, 12], ['nitrogen-14', 7, 14], ['oxygen-16', 8, 16], ['sodium-23', 11, 23], ['magnesium-24', 12, 24], ['aluminium-27', 13, 27], ['chlorine-35', 17, 35], ['potassium-39', 19, 39], ['calcium-40', 20, 40], ['iron-56', 26, 56]];
const gAtoms = h => {
  const [nm, Z, A] = h.pick(ATOMS), k = h.R();
  if (k < 0.4) return qNum('How many neutrons are in an atom of ' + nm + '? (Atomic number = ' + Z + ')', A - Z, ['Neutrons = mass number \u2212 atomic number = ' + A + ' \u2212 ' + Z + ' = ' + (A - Z)], { chk: () => Z + (A - Z) === A });
  if (k < 0.6) return qNum('How many protons are in an atom of ' + nm + '? (Atomic number = ' + Z + ')', Z, ['The number of protons equals the atomic number: ' + Z], { chk: () => true });
  const ion = h.pick([['Na', 11, 1], ['Mg', 12, 2], ['Al', 13, 3], ['K', 19, 1], ['Ca', 20, 2], ['Cl', 17, -1], ['O', 8, -2], ['N', 7, -3]]), ch = ion[2], sym = ion[0] + '<sup>' + (Math.abs(ch) === 1 ? '' : Math.abs(ch)) + (ch > 0 ? '+' : '\u2212') + '</sup>';
  return qNum('How many electrons does the ion ' + sym + ' have? (Atomic number = ' + ion[1] + ')', ion[1] - ch, ['A neutral atom has ' + ion[1] + ' electrons.', ch > 0 ? 'The ion has lost ' + ch + ' electron' + (ch > 1 ? 's' : '') + ': ' + ion[1] + ' \u2212 ' + ch + ' = ' + (ion[1] - ch) : 'The ion has gained ' + Math.abs(ch) + ' electron' + (ch < -1 ? 's' : '') + ': ' + ion[1] + ' + ' + Math.abs(ch) + ' = ' + (ion[1] - ch)], { chk: () => ion[1] - ch === (ch > 0 ? ion[1] - Math.abs(ch) : ion[1] + Math.abs(ch)) });
};

/* ================= LIFE SCIENCES ================= */
const ORGANELLES = [['nucleus', 'Controls the cell and holds the DNA'], ['mitochondria', 'Releases energy from food (respiration)'], ['chloroplast', 'Where photosynthesis takes place'], ['ribosome', 'Makes proteins'], ['cell membrane', 'Controls what enters and leaves the cell'], ['vacuole', 'Stores water and dissolved substances'], ['cell wall', 'Gives a plant cell support and shape'], ['cytoplasm', 'Jelly-like fluid where many reactions happen']];
const gCells = h => {
  const [nm, fn] = h.pick(ORGANELLES), wrong = h.shuf(ORGANELLES.filter(x => x[0] !== nm)).slice(0, 3);
  if (h.R() < 0.5) return qChoice(h, 'What is the main job of the ' + nm + '?', fn, wrong.map(x => x[1]), ['The ' + nm + ': ' + fn.toLowerCase() + '.']);
  return qChoice(h, 'Which part of the cell does this job: \u201C' + fn.toLowerCase() + '\u201D?', nm, wrong.map(x => x[0]), ['The ' + nm + ' ' + fn.toLowerCase() + '.']);
};
const PHOTO = [
  ['Which gas do plants take in for photosynthesis?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Hydrogen']],
  ['Which gas do plants release during photosynthesis?', 'Oxygen', ['Carbon dioxide', 'Nitrogen', 'Helium']],
  ['Where in a plant cell does photosynthesis take place?', 'Chloroplasts', ['Mitochondria', 'Nucleus', 'Ribosomes']],
  ['Which green pigment absorbs light for photosynthesis?', 'Chlorophyll', ['Haemoglobin', 'Melanin', 'Keratin']],
  ['Which sugar do plants make in photosynthesis?', 'Glucose', ['Oxygen', 'Water', 'Protein']],
  ['Which organelle releases energy from glucose in cellular respiration?', 'Mitochondria', ['Chloroplast', 'Nucleus', 'Vacuole']],
  ['Which substances does a plant need for photosynthesis?', 'Carbon dioxide, water and light energy', ['Oxygen, glucose and light energy', 'Carbon dioxide, glucose and heat', 'Nitrogen, water and light energy']],
  ['Which gas do cells use for aerobic respiration?', 'Oxygen', ['Carbon dioxide', 'Helium', 'Hydrogen']],
  ['What are the products of aerobic respiration?', 'Carbon dioxide, water and energy', ['Oxygen and glucose', 'Carbon dioxide and glucose', 'Nitrogen and water']],
  ['Complete the word equation: carbon dioxide + water \u2192 ? (in light, with chlorophyll)', 'glucose + oxygen', ['oxygen + water', 'protein + oxygen', 'carbon + water']]
];
const gPhoto = h => { const [q, a, w] = h.pick(PHOTO); return qChoice(h, q, a, w, ['Correct answer: ' + a + '.']); };
const COMP = { A: 'T', T: 'A', C: 'G', G: 'C' }, TO_RNA = { A: 'U', T: 'A', C: 'G', G: 'C' };
const gDna = h => {
  const len = h.ri(6, 9), s = Array.from({ length: len }, () => h.pick('ACGT'.split(''))).join('');
  if (h.R() < 0.5) { const r = s.split('').map(b => COMP[b]).join(''); return qText('The DNA strand ' + s.split('').join(' ') + ' is copied. Write the complementary DNA strand (letters only).', [r], ['A pairs with T, and C pairs with G.', s + ' \u2192 ' + r], { hint: 'Letters only, for example ATGC', chk: () => s.split('').every((b, i) => COMP[b] === r[i] && COMP[r[i]] === b) }); }
  const r = s.split('').map(b => TO_RNA[b]).join(''); return qText('The DNA template strand is ' + s.split('').join(' ') + '. Write the mRNA that is made from it (letters only).', [r], ['In mRNA, A pairs with U (not T), T pairs with A, C with G and G with C.', s + ' \u2192 ' + r], { hint: 'Letters only, for example AUGC', chk: () => s.split('').every((b, i) => TO_RNA[b] === r[i]) });
};
const gPunnett = h => {
  const G = ['AA', 'Aa', 'aa'], p1 = h.pick(G), p2 = h.pick(G), kids = []; for (const x of p1) for (const y of p2) kids.push([x, y].sort().join(''));
  const want = h.pick(['aa', 'Aa', 'AA']), cnt = kids.filter(g => g === want).length, pct = cnt * 25;
  return qNum('Two parents with genotypes ' + p1 + ' and ' + p2 + ' have offspring. What percentage of the offspring is expected to have the genotype ' + want + '?', pct, ['Make a Punnett square: the four offspring are ' + kids.join(', ') + '.', cnt + ' out of 4 are ' + want + ' = ' + pct + '%'], { unit: '%', chk: () => { const pa = [...p1].filter(c => c === 'a').length / 2, pb = [...p2].filter(c => c === 'a').length / 2; const probs = { aa: pa * pb, AA: (1 - pa) * (1 - pb), Aa: pa * (1 - pb) + (1 - pa) * pb }; return Math.abs(probs[want] * 100 - pct) < 1e-9; } });
};

/* ================= ENGLISH ================= */
const PLURALS = [['child', 'children'], ['man', 'men'], ['woman', 'women'], ['mouse', 'mice'], ['foot', 'feet'], ['tooth', 'teeth'], ['goose', 'geese'], ['person', 'people'], ['leaf', 'leaves'], ['knife', 'knives'], ['wolf', 'wolves'], ['city', 'cities'], ['baby', 'babies'], ['box', 'boxes'], ['bus', 'buses'], ['potato', 'potatoes'], ['photo', 'photos'], ['dress', 'dresses'], ['day', 'days'], ['church', 'churches']];
const gPlural = h => { const [s, p] = h.pick(PLURALS); return qText('Write the plural of \u201C' + s + '\u201D.', [p], ['The plural of ' + s + ' is ' + p + '.'], { chk: () => !!p && p !== s }); };
const IRREG = [['go', 'went', 'gone'], ['see', 'saw', 'seen'], ['eat', 'ate', 'eaten'], ['take', 'took', 'taken'], ['write', 'wrote', 'written'], ['buy', 'bought', 'bought'], ['bring', 'brought', 'brought'], ['run', 'ran', 'run'], ['swim', 'swam', 'swum'], ['sing', 'sang', 'sung'], ['drink', 'drank', 'drunk'], ['give', 'gave', 'given'], ['know', 'knew', 'known'], ['think', 'thought', 'thought'], ['catch', 'caught', 'caught'], ['teach', 'taught', 'taught'], ['begin', 'began', 'begun'], ['break', 'broke', 'broken'], ['choose', 'chose', 'chosen'], ['drive', 'drove', 'driven'], ['fly', 'flew', 'flown'], ['forget', 'forgot', 'forgotten'], ['grow', 'grew', 'grown'], ['hide', 'hid', 'hidden'], ['ride', 'rode', 'ridden'], ['speak', 'spoke', 'spoken'], ['steal', 'stole', 'stolen'], ['wear', 'wore', 'worn']];
const gPast = h => { const [b, p, pp] = h.pick(IRREG); return h.R() < 0.5 ? qText('Write the simple past tense of \u201C' + b + '\u201D. (Yesterday I ___.)', [p], ['The simple past of ' + b + ' is ' + p + '.'], { chk: () => !!p }) : qText('Write the past participle of \u201C' + b + '\u201D. (I have ___.)', [pp], ['The past participle of ' + b + ' is ' + pp + '.'], { chk: () => !!pp }); };
const gAgree = h => {
  const sing = h.R() < 0.5, subj = sing ? h.pick(['The dog', 'My sister', 'He', 'She', 'The teacher', 'Our school']) : h.pick(['The dogs', 'My friends', 'They', 'We', 'You', 'I', 'The teachers']);
  const v = h.pick(['walk', 'play', 'read', 'jump', 'sing', 'write', 'talk', 'work']), right = sing ? v + 's' : v;
  return qChoice(h, 'Choose the correct verb: ' + subj + ' ___ every day.', right, [sing ? v : v + 's'], ['\u201C' + subj + '\u201D is ' + (sing ? 'singular (he / she / it), so the verb takes an \u201Cs\u201D.' : 'plural, or I / you, so the verb has no \u201Cs\u201D.')]);
};
const POS = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];
const POSBANK = [['The *happy* child laughed.', 'adjective'], ['Thabo *runs* every morning.', 'verb'], ['She walked *slowly* home.', 'adverb'], ['The *cat* slept on the sofa.', 'noun'], ['*She* is my best friend.', 'pronoun'], ['The book is *on* the table.', 'preposition'], ['I like tea *and* coffee.', 'conjunction'], ['*Wow*! That is amazing.', 'interjection'], ['We saw a *beautiful* sunset.', 'adjective'], ['The children *played* outside.', 'verb'], ['The dog barked *loudly*.', 'adverb'], ['He gave the ball *to* Sipho.', 'preposition'], ['They are tired *but* happy.', 'conjunction'], ['*We* love music.', 'pronoun'], ['The *teacher* smiled.', 'noun']];
const gPos = h => { const [s, a] = h.pick(POSBANK), w = s.match(/\*(.+?)\*/)[1]; return qChoice(h, 'What part of speech is the word \u201C' + w + '\u201D in this sentence? <i>' + s.replace(/\*/g, '') + '</i>', a, h.shuf(POS.filter(p => p !== a)).slice(0, 3), ['In this sentence \u201C' + w + '\u201D is a ' + a + '.']); };

/* ================= GEOGRAPHY ================= */
const gScale = h => {
  const sc = h.pick([10000, 20000, 50000, 100000, 250000]), cm = h.ri(2, 12), km = cm * sc / 100000;
  return qNum('A map has a scale of 1 : ' + N(sc) + '. Two towns are ' + cm + ' cm apart on the map. What is the real distance in kilometres?', km, [cm + ' cm \u00D7 ' + N(sc) + ' = ' + N(cm * sc) + ' cm in real life', N(cm * sc) + ' cm \u00F7 100 000 = ' + trim(km) + ' km (100 000 cm = 1 km)'], { unit: 'km', tol: 1e-6, chk: () => Math.abs(km * 100000 - cm * sc) < 1e-6 });
};
const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const gCompass = h => {
  const i = h.ri(0, 7), turn = h.pick([[90, 2, 'clockwise'], [180, 4, 'clockwise'], [90, 6, 'anticlockwise'], [45, 1, 'clockwise']]), ans = DIRS[(i + turn[1]) % 8];
  return qChoice(h, 'You are facing ' + DIRS[i] + ' and turn ' + turn[0] + '\u00B0 ' + turn[2] + '. Which direction are you now facing?', ans, h.shuf(DIRS.filter(d => d !== ans)).slice(0, 3), ['Each step of 45\u00B0 moves one place around the compass. ' + turn[0] + '\u00B0 ' + turn[2] + ' from ' + DIRS[i] + ' is ' + ans + '.']);
};
const GEOFACTS = [['What is the latitude of the Equator?', '0\u00B0', ['23.5\u00B0', '90\u00B0', '180\u00B0']], ['What is the longitude of the Prime Meridian?', '0\u00B0', ['23.5\u00B0', '90\u00B0', '180\u00B0']], ['Lines of latitude run in which direction?', 'East to west', ['North to south', 'North-east to south-west', 'They are curved']], ['Lines of longitude run from where to where?', 'Pole to pole', ['East to west', 'Equator to equator', 'Coast to coast']], ['How many degrees of longitude equal one hour of time difference?', '15\u00B0', ['10\u00B0', '24\u00B0', '30\u00B0']], ['Which hemisphere is South Africa in (north or south of the Equator)?', 'Southern Hemisphere', ['Northern Hemisphere', 'Eastern Hemisphere only', 'Arctic']]];
const gGeoTime = h => {
  if (h.R() < 0.5) { const [q, a, w] = h.pick(GEOFACTS); return qChoice(h, q, a, w, ['Correct answer: ' + a + '.']); }
  const deg = 15 * h.ri(1, 8); return qNum('Two places are ' + deg + '\u00B0 of longitude apart. What is the difference in local (solar) time between them, in hours? (15\u00B0 = 1 hour)', deg / 15, [deg + '\u00B0 \u00F7 15\u00B0 per hour = ' + deg / 15 + ' hours'], { unit: 'hours', chk: () => deg / 15 * 15 === deg });
};

/* ======================= TOPICS ======================= */
const TOPICS = [
  { id: 'm-addsub', subj: 'maths', level: 0, title: 'Adding and subtracting big numbers', blurb: 'Place value, carrying and borrowing.', gen: gAddSub, ideas: ['Line up place values: ones, tens, hundreds, thousands.', 'When adding, carry to the next place if a column adds to 10 or more.', 'When subtracting, borrow (regroup) from the next place if the top digit is smaller.', 'Check a subtraction by adding the answer to the number you took away.'] },
  { id: 'm-muldiv', subj: 'maths', level: 0, title: 'Multiplying and dividing', blurb: 'Times tables, long multiplication and exact division.', gen: gMulDiv, ideas: ['Multiplication is repeated addition: 4 \u00D7 6 means 6 + 6 + 6 + 6.', 'To multiply by a 2-digit number, break it up: 23 \u00D7 14 = 23 \u00D7 10 + 23 \u00D7 4.', 'Division is the opposite of multiplication: 7 \u00D7 8 = 56, so 56 \u00F7 7 = 8.', 'Check a division by multiplying the answer by the divisor.'] },
  { id: 'm-frac-basic', subj: 'maths', level: 0, title: 'Fractions: simplifying, adding and subtracting', blurb: 'Equal parts, simplest form and same denominators.', gen: gFracBasic, ideas: ['In 3/4 the denominator (4) is the number of equal parts and the numerator (3) is how many we have.', 'To simplify, divide the top and bottom by the same number (their highest common factor).', 'To add or subtract fractions with the same denominator, add or subtract the numerators and keep the denominator.', 'Always give your final answer in simplest form.'] },
  { id: 'm-decimals', subj: 'maths', level: 0, title: 'Decimals and rounding', blurb: 'Tenths, hundredths and rounding off.', gen: gDecimals, ideas: ['Each place after the decimal point is ten times smaller: tenths, hundredths, thousandths.', 'To round, look at the digit after the place you are rounding to: 5 or more rounds up, 4 or less stays the same.', 'When adding decimals, line up the decimal points.'] },
  { id: 'm-perim-area', subj: 'maths', level: 0, title: 'Perimeter and area', blurb: 'Rectangles and squares.', gen: gPerimArea, ideas: ['Perimeter is the distance around a shape: add all the sides.', 'Rectangle: perimeter = 2 \u00D7 (length + width). Square: perimeter = 4 \u00D7 side.', 'Area is the space inside a shape, measured in square units (cm\u00B2, m\u00B2).', 'Rectangle area = length \u00D7 width. Square area = side \u00D7 side.'] },
  { id: 'm-integers', subj: 'maths', level: 1, title: 'Integers (negative numbers)', blurb: 'Adding, subtracting, multiplying and dividing negatives.', gen: gIntegers, ideas: ['Integers are whole numbers, including negatives and zero.', 'Subtracting a negative is the same as adding: 5 \u2212 (\u22123) = 5 + 3 = 8.', 'Same signs multiplied (or divided) give a positive; different signs give a negative.', 'On a number line, adding moves right and subtracting moves left.'] },
  { id: 'm-frac-diff', subj: 'maths', level: 1, title: 'Fractions with different denominators', blurb: 'Common denominators and simplest form.', gen: gFracDiff, ideas: ['To add or subtract fractions, they need a common denominator: use the lowest common multiple (LCM) of the denominators.', 'Change each fraction to an equivalent fraction with that denominator, then add or subtract the numerators.', 'Simplify the answer.'] },
  { id: 'm-frac-mul', subj: 'maths', level: 1, title: 'Multiplying and dividing fractions', blurb: 'Multiply across and flip to divide.', gen: gFracMul, ideas: ['To multiply fractions, multiply the numerators and multiply the denominators.', 'To divide by a fraction, multiply by its reciprocal (flip it): a/b \u00F7 c/d = a/b \u00D7 d/c.', 'Simplify your answer.'] },
  { id: 'm-percent', subj: 'maths', level: 1, title: 'Percentages', blurb: 'Percentage of an amount, increase and decrease.', gen: gPercent, ideas: ['Per cent means \u201Cout of 100\u201D: 25% = 25/100 = 0.25.', 'To find x% of an amount: (x \u00F7 100) \u00D7 amount.', 'To increase by x%, add x% of the amount. To decrease by x%, subtract it.'] },
  { id: 'm-ratio', subj: 'maths', level: 1, title: 'Ratio', blurb: 'Simplifying and sharing in a ratio.', gen: gRatio, ideas: ['A ratio compares quantities: 2 : 3.', 'To simplify a ratio, divide both parts by their highest common factor.', 'To share an amount in a ratio: add the parts, divide the amount by the total parts to get one part, then multiply.'] },
  { id: 'm-alg-simplify', subj: 'maths', level: 1, title: 'Algebra: simplifying expressions', blurb: 'Collecting like terms.', gen: gAlgSimplify, ideas: ['Like terms have the same variable part: 3x and 5x are like terms; 3x and 5 are not.', 'Add or subtract the coefficients of like terms, and add the constants separately.', 'Take care with minus signs: they belong to the term that follows.'] },
  { id: 'm-alg-solve', subj: 'maths', level: 1, title: 'Algebra: solving equations', blurb: 'One-step and two-step equations.', gen: gAlgSolve, ideas: ['An equation is like a balance: whatever you do to one side you must do to the other.', 'Use inverse operations: undo + with \u2212, and \u00D7 with \u00F7.', 'Undo addition or subtraction first, then multiplication or division.', 'Check by substituting your answer back into the equation.'] },
  { id: 'm-exponents', subj: 'maths', level: 1, title: 'Exponents', blurb: 'Powers and the exponent laws.', gen: gExponents, ideas: ['a<sup>n</sup> means a multiplied by itself n times: 2<sup>4</sup> = 2 \u00D7 2 \u00D7 2 \u00D7 2 = 16.', 'Product law: a<sup>m</sup> \u00D7 a<sup>n</sup> = a<sup>m + n</sup>.', 'Quotient law: a<sup>m</sup> \u00F7 a<sup>n</sup> = a<sup>m \u2212 n</sup>.', 'Power of a power: (a<sup>m</sup>)<sup>n</sup> = a<sup>mn</sup>.'] },
  { id: 'm-pythag', subj: 'maths', level: 1, title: 'Theorem of Pythagoras', blurb: 'Sides of right-angled triangles.', gen: gPythag, ideas: ['In a right-angled triangle, the longest side is the hypotenuse (opposite the right angle).', 'hypotenuse\u00B2 = side\u2081\u00B2 + side\u2082\u00B2.', 'To find a shorter side: side\u00B2 = hypotenuse\u00B2 \u2212 other side\u00B2.'] },
  { id: 'm-circle', subj: 'maths', level: 1, title: 'Circles', blurb: 'Circumference and area (\u03C0 = 3.14).', gen: gCircle, ideas: ['The radius is half the diameter.', 'Circumference = 2\u03C0r. Area = \u03C0r\u00B2.', 'In these questions use \u03C0 = 3.14 and round to 2 decimal places.'] },
  { id: 'm-data', subj: 'maths', level: 1, title: 'Mean, median, mode and range', blurb: 'Summarising data.', gen: gData, ideas: ['Mean = sum of the values \u00F7 how many values there are.', 'Median = the middle value when the data is in order.', 'Mode = the value that appears most often. Range = largest \u2212 smallest.'] },
  { id: 'm-quad', subj: 'maths', level: 2, title: 'Quadratic equations', blurb: 'Solving by factorising.', gen: gQuadratic, ideas: ['A quadratic equation can be written as x\u00B2 + bx + c = 0.', 'Factorise by finding two numbers that multiply to c and add to b.', 'If (x \u2212 p)(x \u2212 q) = 0 then x = p or x = q.', 'Check by substituting each answer.'] },
  { id: 'm-simul', subj: 'maths', level: 2, title: 'Simultaneous equations', blurb: 'Two equations, two unknowns.', gen: gSimul, ideas: ['Two equations with two unknowns can be solved together.', 'Substitution: make one variable the subject of one equation and put it into the other. Elimination: add or subtract the equations to cancel one variable.', 'Always check your answer in both equations.'] },
  { id: 'm-gradient', subj: 'maths', level: 2, title: 'Straight lines: gradient and intercept', blurb: 'y = mx + c.', gen: gGradient, ideas: ['The gradient m = (y\u2082 \u2212 y\u2081) \u00F7 (x\u2082 \u2212 x\u2081).', 'A straight line has the equation y = mx + c, where m is the gradient and c is the y-intercept.', 'Coordinates are written (x ; y).'] },
  { id: 'm-seq', subj: 'maths', level: 2, title: 'Number patterns and sequences', blurb: 'Arithmetic and geometric sequences.', gen: gSeq, ideas: ['An arithmetic sequence adds the same number each time: T\u2099 = a + (n \u2212 1)d.', 'A geometric sequence multiplies by the same number each time: T\u2099 = a \u00D7 r\u207F\u207B\u00B9.', 'a is the first term, d the common difference and r the common ratio.'] },
  { id: 'm-finance', subj: 'maths', level: 2, title: 'Finance: simple and compound interest', blurb: 'Growth of money over time.', gen: gFinance, ideas: ['Simple interest: A = P(1 + i \u00D7 n). Compound interest: A = P(1 + i)<sup>n</sup>.', 'P is the amount invested, i the interest rate per year as a decimal (8% = 0.08) and n the number of years.', 'Interest earned = A \u2212 P. Round money to the nearest cent.'] },
  { id: 'm-trig', subj: 'maths', level: 2, title: 'Trigonometry in right-angled triangles', blurb: 'sin, cos and tan (SOH CAH TOA).', gen: gTrig, ideas: ['Label the sides from the angle you are looking at: opposite, adjacent and hypotenuse.', 'sin \u03B8 = opposite \u00F7 hypotenuse, cos \u03B8 = adjacent \u00F7 hypotenuse, tan \u03B8 = opposite \u00F7 adjacent.', 'Give your answer as a fraction.'] },
  { id: 'm-prob', subj: 'maths', level: 2, title: 'Probability', blurb: 'Favourable outcomes over total outcomes.', gen: gProb, ideas: ['Probability = number of favourable outcomes \u00F7 total number of outcomes.', 'It is between 0 (impossible) and 1 (certain).', 'P(not A) = 1 \u2212 P(A).'] },

  { id: 'ml-convert', subj: 'mlit', level: 1, title: 'Converting units', blurb: 'Length, mass, volume, time and temperature.', gen: gConvert, ideas: ['Key conversions: 1 km = 1 000 m, 1 m = 100 cm, 1 cm = 10 mm, 1 kg = 1 000 g, 1 \u2113 = 1 000 m\u2113, 1 hour = 60 minutes.', 'To go to a smaller unit, multiply. To go to a larger unit, divide.', 'Temperature: \u00B0F = \u00B0C \u00D7 9/5 + 32.'] },
  { id: 'ml-time', subj: 'mlit', level: 1, title: 'Time and the 24-hour clock', blurb: 'Durations and times of arrival.', gen: gTime, ideas: ['On the 24-hour clock 13:00 is 1 p.m.', 'To find a duration, change both times to minutes or subtract hours and minutes carefully (1 hour = 60 minutes).', 'When the minutes reach 60, add 1 to the hours.'] },
  { id: 'ml-discount', subj: 'mlit', level: 1, title: 'Discounts and sales', blurb: 'Sale prices and percentage saved.', gen: gDiscount, ideas: ['Discount amount = marked price \u00D7 discount %.', 'Sale price = marked price \u2212 discount.', 'Percentage discount = (amount saved \u00F7 marked price) \u00D7 100.'] },
  { id: 'ml-measure', subj: 'mlit', level: 1, title: 'Volume, capacity and tiling', blurb: 'Boxes, tanks and floors.', gen: gMeasure, ideas: ['Volume of a box = length \u00D7 width \u00D7 height.', '1 000 cm\u00B3 = 1 \u2113.', 'Number of tiles = floor area \u00F7 area of one tile (use the same units for both).'] },
  { id: 'ml-vat', subj: 'mlit', level: 2, title: 'VAT', blurb: 'Value-added tax at 15%.', gen: gVat, ideas: ['VAT (value-added tax) in South Africa is 15%.', 'Price including VAT = price excluding VAT \u00D7 1.15.', 'Price excluding VAT = price including VAT \u00F7 1.15.', 'VAT amount = price excluding VAT \u00D7 0.15.'] },
  { id: 'ml-speed', subj: 'mlit', level: 2, title: 'Speed, distance, time and fuel cost', blurb: 'Travel calculations.', gen: gSpeedFuel, ideas: ['Speed = distance \u00F7 time. Distance = speed \u00D7 time. Time = distance \u00F7 speed.', 'Litres used = distance \u00F7 100 \u00D7 litres per 100 km.', 'Cost = litres used \u00D7 price per litre.'] },
  { id: 'ml-budget', subj: 'mlit', level: 2, title: 'Income, expenses and budgets', blurb: 'Savings and percentage of income.', gen: gBudget, ideas: ['Income is money coming in; expenses are money going out.', 'Savings = income \u2212 total expenses.', 'Percentage of income = (amount \u00F7 income) \u00D7 100.'] },
  { id: 'ml-exchange', subj: 'mlit', level: 2, title: 'Exchange rates', blurb: 'Changing between currencies.', gen: gExchange, ideas: ['An exchange rate tells you how much of one currency you get for another.', 'If $1 = R18, to change dollars to rand multiply by 18, and to change rand to dollars divide by 18.', 'In these questions the rate is given, so use the rate in the question.'] },
  { id: 'ml-finance', subj: 'mlit', level: 2, title: 'Interest on savings and loans', blurb: 'Simple and compound interest.', gen: gFinance, ideas: ['Simple interest: A = P(1 + i \u00D7 n). Compound interest: A = P(1 + i)<sup>n</sup>.', 'i is the yearly rate as a decimal (8% = 0.08) and n is the number of years.', 'Interest earned = A \u2212 P. Round money to the nearest cent.'] },

  { id: 's-speed', subj: 'sci', level: 1, title: 'Speed', blurb: 'Speed, distance and time in m/s.', gen: gSpeedSci, ideas: ['Speed = distance \u00F7 time. In science we usually use metres per second (m/s).', 'Distance = speed \u00D7 time. Time = distance \u00F7 speed.', 'Check that your units match before you calculate.'] },
  { id: 's-density', subj: 'sci', level: 1, title: 'Density', blurb: 'Mass, volume and density.', gen: gDensity, ideas: ['Density = mass \u00F7 volume (\u03C1 = m/V).', 'Mass = density \u00D7 volume. Volume = mass \u00F7 density.', 'Units: g/cm\u00B3 when mass is in grams and volume is in cm\u00B3.'] },
  { id: 's-ohm', subj: 'sci', level: 2, title: "Ohm's law", blurb: 'Voltage, current and resistance.', gen: gOhm, ideas: ["Ohm's law: V = I \u00D7 R (voltage = current \u00D7 resistance).", 'Voltage is measured in volts (V), current in amperes (A) and resistance in ohms (\u03A9).', 'I = V \u00F7 R and R = V \u00F7 I.'] },
  { id: 's-power', subj: 'sci', level: 2, title: 'Electrical power and energy', blurb: 'P = VI and E = Pt.', gen: gPower, ideas: ['Electrical power P = V \u00D7 I, measured in watts (W).', 'Energy E = P \u00D7 t. With time in seconds the energy is in joules (J).', '1 W = 1 J per second.'] },
  { id: 's-force', subj: 'sci', level: 2, title: 'Force, mass and weight', blurb: "Newton's second law.", gen: gForce, ideas: ["Newton's second law: F = m \u00D7 a, with force in newtons (N), mass in kg and acceleration in m/s\u00B2.", 'Weight is the force of gravity on an object: W = m \u00D7 g.', 'On Earth use g = 9.8 m/s\u00B2.'] },
  { id: 's-atoms', subj: 'sci', level: 1, title: 'Atoms and ions', blurb: 'Protons, neutrons and electrons.', gen: gAtoms, ideas: ['An atom has protons and neutrons in the nucleus, and electrons around it.', 'Atomic number (Z) = number of protons. Mass number (A) = protons + neutrons.', 'Neutrons = A \u2212 Z. A neutral atom has as many electrons as protons.', 'A positive ion has lost electrons; a negative ion has gained electrons.'] },
  { id: 's-moles', subj: 'sci', level: 2, title: 'The mole', blurb: 'Mass, molar mass and amount of substance.', gen: gMoles, ideas: ['The mole links mass to the amount of particles: n = m \u00F7 M.', 'm is the mass in grams, M is the molar mass in g/mol and n is the number of moles.', 'm = n \u00D7 M.'] },

  { id: 'l-cells', subj: 'life', level: 1, title: 'Cell structure', blurb: 'Parts of the cell and what they do.', gen: gCells, ideas: ['The nucleus controls the cell and holds the DNA.', 'Mitochondria release energy from food. Chloroplasts (in plant cells) carry out photosynthesis.', 'Ribosomes make proteins. The cell membrane controls what enters and leaves.', 'Plant cells also have a cell wall and a large vacuole.'] },
  { id: 'l-photo', subj: 'life', level: 1, title: 'Photosynthesis and respiration', blurb: 'How plants make food and how cells release energy.', gen: gPhoto, ideas: ['Photosynthesis: carbon dioxide + water \u2192 glucose + oxygen, using light energy and chlorophyll, in the chloroplasts.', 'Aerobic respiration: glucose + oxygen \u2192 carbon dioxide + water + energy, mainly in the mitochondria.', 'Plants take in carbon dioxide and release oxygen during photosynthesis.'] },
  { id: 'l-dna', subj: 'life', level: 2, title: 'DNA and base pairing', blurb: 'Complementary strands and mRNA.', gen: gDna, ideas: ['DNA has four bases: adenine (A), thymine (T), cytosine (C) and guanine (G).', 'Base pairing: A pairs with T, and C pairs with G.', 'In mRNA, thymine is replaced by uracil (U), so A pairs with U.'] },
  { id: 'l-punnett', subj: 'life', level: 2, title: 'Heredity and Punnett squares', blurb: 'Dominant and recessive alleles.', gen: gPunnett, ideas: ['Alleles come in pairs. A capital letter is the dominant allele and a small letter is the recessive allele.', 'AA and Aa show the dominant trait; aa shows the recessive trait.', 'A Punnett square shows every possible combination of one allele from each parent.'] },

  { id: 'e-plural', subj: 'eng', level: 0, title: 'Plural nouns', blurb: 'Regular and irregular plurals.', gen: gPlural, ideas: ['Most nouns add -s: day \u2192 days.', 'Nouns ending in s, x, ch or sh add -es: box \u2192 boxes.', 'Consonant + y changes to -ies: city \u2192 cities.', 'Some plurals are irregular and must be learned: child \u2192 children, man \u2192 men.'] },
  { id: 'e-past', subj: 'eng', level: 0, title: 'Irregular verbs', blurb: 'Simple past and past participle.', gen: gPast, ideas: ['Regular verbs add -ed in the past (walk \u2192 walked). Irregular verbs change form (go \u2192 went).', 'The past participle is used after have, has and had: I have gone.', 'Learn the common irregular verbs by heart.'] },
  { id: 'e-agree', subj: 'eng', level: 0, title: 'Subject-verb agreement', blurb: 'Making the verb match the subject.', gen: gAgree, ideas: ['A singular subject (he, she, it, the dog) takes a verb with -s in the present tense: she walks.', 'A plural subject (they, we, the dogs), and I and you, take the base verb: they walk.'] },
  { id: 'e-pos', subj: 'eng', level: 1, title: 'Parts of speech', blurb: 'Nouns, verbs, adjectives and more.', gen: gPos, ideas: ['A noun names a person, place or thing. A verb shows action or being.', 'An adjective describes a noun. An adverb describes a verb, adjective or another adverb.', 'A pronoun replaces a noun. A preposition shows position or relationship (on, to, in).', 'A conjunction joins words or sentences (and, but). An interjection shows sudden feeling (wow!).'] },

  { id: 'g-scale', subj: 'geo', level: 1, title: 'Map scale', blurb: 'Working out real distances from a map.', gen: gScale, ideas: ['A scale of 1 : 50 000 means 1 cm on the map is 50 000 cm in real life.', '100 000 cm = 1 km, so divide centimetres by 100 000 to get kilometres.', 'Measure on the map, multiply by the scale number, then change units.'] },
  { id: 'g-compass', subj: 'geo', level: 0, title: 'Compass directions', blurb: 'The eight compass points.', gen: gCompass, ideas: ['The eight points in order: north, north-east, east, south-east, south, south-west, west, north-west.', 'Each step is 45\u00B0. A quarter turn is 90\u00B0 and a half turn is 180\u00B0.', 'Clockwise goes north \u2192 east \u2192 south \u2192 west.'] },
  { id: 'g-latlong', subj: 'geo', level: 1, title: 'Latitude, longitude and time', blurb: 'Finding places and time differences.', gen: gGeoTime, ideas: ['Latitude lines run east\u2013west and measure distance north or south of the Equator (0\u00B0).', 'Longitude lines run pole to pole and measure distance east or west of the Prime Meridian (0\u00B0).', 'The Earth turns 360\u00B0 in 24 hours, so every 15\u00B0 of longitude is 1 hour of time difference.'] }
];

/* ---------- making and checking questions ---------- */
function makeQuestions(topic, count, seed) {
  const out = [], seen = new Set();
  for (let i = 0, tries = 0; out.length < count && tries < count * 25; tries++, i++) {
    const q = topic.gen(makeHelper((seed + i * 7919 + 13) >>> 0));
    if (seen.has(q.q)) continue; seen.add(q.q); out.push(q);
  }
  return out;
}
/* numbers typed by a student: accepts 1 200, 1200, 1,5 and 1.5, minus signs, units and R or % symbols */
function numCandidates(s) {
  let t = String(s == null ? '' : s).replace(/[\u2212\u2013\u2014]/g, '-').trim().replace(/(\d)[ \u00a0](?=\d{3}(?!\d))/g, '$1');
  const m = t.match(/-?\d[\d.,]*/); if (!m) return [];
  const tok = m[0].replace(/[.,]$/, ''), neg = tok[0] === '-' ? -1 : 1, body = tok.replace('-', ''), out = [];
  const push = x => { const v = parseFloat(x); if (isFinite(v)) out.push(neg * v); };
  const hasDot = body.includes('.'), hasCom = body.includes(',');
  if (hasDot && hasCom) { body.lastIndexOf(',') > body.lastIndexOf('.') ? push(body.replace(/\./g, '').replace(',', '.')) : push(body.replace(/,/g, '')); }
  else if (hasCom) { push(body.replace(',', '.')); if (/^\d{1,3}(,\d{3})+$/.test(body)) push(body.replace(/,/g, '')); }
  else push(body);
  return out;
}
function parseLinear(s) {
  const t = String(s || '').replace(/[\u2212\u2013\u2014]/g, '-').replace(/\s+/g, '').toLowerCase().replace(/\*/g, '');
  if (!t || /[^0-9x+\-.]/.test(t)) return null;
  let a = 0, b = 0; const terms = t.match(/[+-]?[^+-]+/g); if (!terms || terms.join('') !== t.replace(/^\+/, '') && terms.join('') !== t) return null;
  for (const tm of terms) { if (!/^[+-]?\d*\.?\d*x?$/.test(tm)) return null; if (tm.endsWith('x')) { const c = tm.slice(0, -1); a += c === '' || c === '+' ? 1 : c === '-' ? -1 : parseFloat(c); } else { if (!/\d/.test(tm)) return null; b += parseFloat(tm); } }
  return [a, b];
}
const normText = s => String(s || '').toLowerCase().replace(/[.\s]+$/g, '').replace(/\s+/g, ' ').trim();
function checkAnswer(q, input) {
  const raw = input == null ? '' : String(input);
  if (q.type !== 'choice' && !raw.trim()) return { ok: false, note: 'Type an answer first.' };
  if (q.type === 'num') return { ok: numCandidates(raw).some(v => Math.abs(v - q.a) <= (q.tol || 1e-9)) };
  if (q.type === 'frac') {
    const t = raw.trim().replace(/[\u2212]/g, '-'), m = t.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (m) { const n = +m[1], d = +m[2]; if (!d) return { ok: false }; if (n * q.a[1] !== q.a[0] * d) return { ok: false }; if (q.simplest && gcd(n, d) !== 1) return { ok: false, note: 'The value is right, but simplify it fully.' }; return { ok: true }; }
    const vals = numCandidates(t); if (!vals.length) return { ok: false };
    if (q.a[1] === 1) return { ok: vals.some(v => Math.abs(v - q.a[0]) < 1e-9) };
    if (q.simplest) return { ok: false, note: 'Give your answer as a fraction, like 3/4.' };
    return { ok: vals.some(v => Math.abs(v - q.a[0] / q.a[1]) < 0.006) };
  }
  if (q.type === 'pair') {
    const nums = (raw.replace(/[\u2212\u2013\u2014]/g, '-').replace(/,/g, ' ').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    if (nums.length !== 2) return { ok: false, note: 'Give two numbers.' };
    return { ok: q.ordered ? nums[0] === q.a[0] && nums[1] === q.a[1] : (nums[0] === q.a[0] && nums[1] === q.a[1]) || (nums[0] === q.a[1] && nums[1] === q.a[0]) };
  }
  if (q.type === 'lin') { const p = parseLinear(raw); return { ok: !!p && Math.abs(p[0] - q.a[0]) < 1e-9 && Math.abs(p[1] - q.a[1]) < 1e-9 }; }
  if (q.type === 'text') { const t = normText(raw).replace(/[\s,\-]/g, q.disp && /^[A-Z]+$/.test(q.disp) ? '' : ' ').replace(/\./g, ':'); return { ok: q.acc.some(a => normText(a).replace(/\./g, ':') === t || (/^[A-Z]+$/.test(a) && a.toLowerCase() === t.replace(/\s/g, ''))) }; }
  if (q.type === 'choice') return { ok: String(raw) === String(q.a) };
  return { ok: false };
}
/* the line a teacher pastes into the marking memo */
function memoLine(q) { return q.type === 'num' ? trim(q.a) : q.type === 'pair' ? q.a.join(q.ordered ? ' ; ' : ' , ') : q.disp.replace(/<[^>]+>/g, ''); }
const plainText = html => String(html).replace(/<[^>]+>/g, '');

if (typeof module !== 'undefined') module.exports = { LEVELS, SUBJECTS, TOPICS, makeQuestions, checkAnswer, memoLine, numCandidates, parseLinear, compoundCents, makeHelper };
