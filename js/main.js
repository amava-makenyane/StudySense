/* ===== Friendly touches and app start ===== */
const first = n => (n || 'friend').split(' ')[0];
function greet() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

const LOADING = ['Reading your notes\u2026', 'Finding what really matters\u2026', 'Putting it all together\u2026', 'Almost there\u2026'];
let lmi = 0;
function loadMsg() { return LOADING[lmi++ % LOADING.length]; }

function actionsHTML() { return '<div class="acts"><button data-act="copy">Copy</button><button data-act="read">Read aloud</button><button data-act="dl">Download</button></div>'; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const m = b.closest('.m'), bar = m.querySelector('.acts');
  bar.style.display = 'none'; const t = m.innerText; bar.style.display = '';
  if (b.dataset.act === 'copy') {
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied. Go ace it!')).catch(() => toast('Couldn\u2019t copy. Select the text and copy it by hand.'));
  } else if (b.dataset.act === 'dl') {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' })); a.download = 'studysense-notes.txt'; a.click();
  } else if ('speechSynthesis' in window) {
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
    speechSynthesis.speak(new SpeechSynthesisUtterance(t));
  } else toast('Your browser can\u2019t read aloud.');
});

function openPaySlots() {
  openPay();
  $('#pT').textContent = 'Your free module slots are full';
  $('#pD').textContent = 'Subscribe for R50 a month and keep as many modules, papers and graphs as you like.';
}

/* Called every time a page is shown. */
function afterShow(v) {
  document.body.classList.toggle('on-home', v === 'home');
  document.body.classList.toggle('on-dash', v === 'teacher');
  if (v === 'privacy') renderPolicy();
  if (v === 'mydata') renderMyData();
  if (v === 'signin') syncConsent();
  const nb = document.querySelector('#nav [data-go="guest"]');
  if (nb) nb.textContent = S.user ? 'Notes' : 'Try free';
  if (v === 'guest') {
    $('#gT').textContent = S.user ? 'Let\u2019s make some notes, ' + first(S.user.name) : 'Try StudySense free';
    $('#gS').textContent = S.user ? 'Paste anything or drop in files. There\u2019s no length limit.' : 'Paste your notes or drop in a file. Guests get 5 free summaries, then it\u2019s time to sign in and subscribe.';
  }
}

/* Light and dark theme. */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('ss-theme', t); } catch (e) { }
  document.querySelectorAll('[data-theme-toggle]').forEach(b => { b.textContent = t === 'dark' ? 'Light mode' : 'Dark mode'; });
}
let savedTheme = null; try { savedTheme = localStorage.getItem('ss-theme'); } catch (e) { }
setTheme(savedTheme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
document.addEventListener('click', e => { if (e.target.closest('[data-theme-toggle]')) setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); });

/* Shortcuts: "/" jumps to the notes box, Esc closes pop-ups. */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') $('#pay').classList.remove('on');
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key === '/' && !typing) { e.preventDefault(); show('guest'); setTimeout(() => $('#inp').focus(), 50); }
});

/* Gentle fade-in as sections scroll into view. */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.1 }) : null;
document.querySelectorAll('#home .card, #home .stat, #home details').forEach(el => { el.classList.add('reveal'); io ? io.observe(el) : el.classList.add('in'); });

/* Smooth scrolling for menu buttons, and the little sound wave on the home page. */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-scroll]'); if (!b) return;
  const el = document.getElementById(b.dataset.scroll); if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const side = b.closest('.side nav'); if (side) { side.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }
});
$('#wave').innerHTML = Array.from({ length: 34 }, (_, i) => '<i' + (i === 22 ? ' class="hot"' : '') + ' style="height:' + Math.round(10 + Math.abs(Math.sin(i * 1.7)) * 44) + 'px"></i>').join('');

/* Start. */
const h0 = location.hash.slice(1);
if (h0 && document.getElementById(h0)) show(h0); else show('home');
