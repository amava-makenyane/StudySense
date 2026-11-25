/* Run with: node learn-selftest.js
   Makes thousands of questions for every topic and checks that each answer is exactly right:
   1. the question's own independent check (q.chk) passes,
   2. the correct answer typed the way a student would is accepted,
   3. a wrong answer is rejected,
   4. nothing prints NaN or undefined. */
const L = require('./learn-data.js');
const SEEDS = +process.argv[2] || 600;
let bad = 0, total = 0; const per = {};
const canon = q => q.type === 'num' ? String(Math.round(q.a * 1e6) / 1e6) : q.type === 'pair' ? q.a.join(q.ordered ? ', ' : ' or ') : q.type === 'choice' ? String(q.a) : q.type === 'text' ? q.acc[0] : q.disp;
const wrong = q => q.type === 'num' ? String(q.a + 1) : q.type === 'pair' ? (q.a[0] + 100) + ', ' + q.a[1] : q.type === 'choice' ? String((q.a + 1) % q.opts.length) : q.type === 'frac' ? (q.a[0] + 1) + '/' + q.a[1] : q.type === 'lin' ? '7x + 100' : 'zzz';
const fail = (t, seed, why, q) => { bad++; if (bad <= 25) console.log('FAIL', t.id, 'seed', seed, why, '\n   ', JSON.stringify(q).slice(0, 260)); };
for (const t of L.TOPICS) {
  per[t.id] = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    let qs; try { qs = L.makeQuestions(t, 1, seed * 101); } catch (e) { fail(t, seed, 'threw ' + e.message, {}); continue; }
    const q = qs[0]; total++; per[t.id]++;
    if (!q || typeof q.q !== 'string' || !q.q) { fail(t, seed, 'no question text', q); continue; }
    const text = JSON.stringify([q.q, q.disp, q.steps, q.opts]);
    if (/NaN|undefined|Infinity|\[object/.test(text)) { fail(t, seed, 'bad text', q); continue; }
    if (!Array.isArray(q.steps) || !q.steps.length) { fail(t, seed, 'no steps', q); continue; }
    if (q.chk && q.chk() !== true) { fail(t, seed, 'independent check failed', q); continue; }
    if (q.type === 'num' && !isFinite(q.a)) { fail(t, seed, 'answer not finite', q); continue; }
    if (q.type === 'choice' && (q.a < 0 || new Set(q.opts).size !== q.opts.length || q.opts.length < 2)) { fail(t, seed, 'bad options', q); continue; }
    const ok = L.checkAnswer(q, canon(q)); if (!ok.ok) { fail(t, seed, 'correct answer rejected (' + canon(q) + ')', q); continue; }
    const no = L.checkAnswer(q, wrong(q)); if (no.ok) { fail(t, seed, 'wrong answer accepted (' + wrong(q) + ')', q); continue; }
  }
}
// answer parsing
const eq = (a, b, m) => { total++; if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('FAIL parse', m, JSON.stringify(a), '!=', JSON.stringify(b)); } };
eq(L.numCandidates('1 200'), [1200], '1 200'); eq(L.numCandidates('1,5'), [1.5], '1,5'); eq(L.numCandidates('1,200'), [1.2, 1200], '1,200'); eq(L.numCandidates('R1 200,50'), [1200.5], 'R1 200,50');
eq(L.numCandidates('\u22125'), [-5], 'minus'); eq(L.numCandidates('15%'), [15], '%'); eq(L.numCandidates('x = 5'), [5], 'x = 5'); eq(L.numCandidates('2.5 cm'), [2.5], 'cm'); eq(L.numCandidates('abc'), [], 'abc'); eq(L.numCandidates('1.234,5'), [1234.5], '1.234,5');
eq(L.parseLinear('5x + 4'), [5, 4], '5x+4'); eq(L.parseLinear('4+5x'), [5, 4], '4+5x'); eq(L.parseLinear('-x - 2'), [-1, -2], '-x-2'); eq(L.parseLinear('3x'), [3, 0], '3x'); eq(L.parseLinear('x'), [1, 0], 'x'); eq(L.parseLinear('2x+x+1'), [3, 1], 'like terms'); eq(L.parseLinear('5y'), null, '5y'); eq(L.parseLinear('++'), null, '++');
eq(L.compoundCents(1000, 10, 2), 121000, 'compound 1000 10% 2y'); eq(L.compoundCents(5000, 8, 3), 629856, 'compound 5000 8% 3y');
const wq = { type: 'num', a: 8405, tol: 0 }; eq(L.checkAnswer(wq, '8 405').ok, true, 'space thousands'); eq(L.checkAnswer(wq, '8405').ok, true, 'plain'); eq(L.checkAnswer(wq, '8,405').ok, true, 'comma thousands'); eq(L.checkAnswer(wq, '8406').ok, false, 'off by one'); eq(L.checkAnswer(wq, '').ok, false, 'empty');
const fq = { type: 'frac', a: [3, 4], simplest: true }; eq(L.checkAnswer(fq, '3/4').ok, true, '3/4'); eq(L.checkAnswer(fq, '6/8').ok, false, '6/8 not simplest'); eq(L.checkAnswer(fq, '0.75').ok, false, 'decimal when fraction asked');
const tq = { type: 'frac', a: [3, 5], simplest: false }; eq(L.checkAnswer(tq, '6/10').ok, true, 'trig equivalent'); eq(L.checkAnswer(tq, '0,6').ok, true, 'trig decimal');
const pq = { type: 'pair', a: [2, -3], ordered: false }; eq(L.checkAnswer(pq, 'x = -3 or x = 2').ok, true, 'roots any order'); eq(L.checkAnswer(pq, '2, 3').ok, false, 'wrong root');
const oq = { type: 'pair', a: [4, 1], ordered: true }; eq(L.checkAnswer(oq, 'x = 4, y = 1').ok, true, 'ordered'); eq(L.checkAnswer(oq, '1, 4').ok, false, 'swapped');
const xq = { type: 'text', acc: ['11:25'], disp: '11:25' }; eq(L.checkAnswer(xq, '11:25').ok, true, 'time'); eq(L.checkAnswer(xq, ' 11.25 ').ok, true, 'time dot');
const dq = { type: 'text', acc: ['TAGC'], disp: 'TAGC' }; eq(L.checkAnswer(dq, 't a g c').ok, true, 'dna spaced'); eq(L.checkAnswer(dq, 'TAGG').ok, false, 'dna wrong');
const nq = { type: 'text', acc: ['children'], disp: 'children' }; eq(L.checkAnswer(nq, ' Children. ').ok, true, 'plural'); 
console.log('\nTopics:', L.TOPICS.length, '| questions checked:', total, '| failures:', bad);
if (bad) process.exit(1);
