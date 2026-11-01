/* ===== Student dashboard: just the talk-room articles =====
   Rooms that match the student's field of study and occupation come first. */
function renderStudent() {
  const u = S.user;
  $('#sHi').textContent = greet() + ', ' + first(u.name) + '.';
  const list = [];
  RM.forEach((r, ri) => {
    ensureArts(ri);
    S.arts[ri].forEach((a, i) => list.push({ ri, i, a, hit: (r[2] === u.field ? 2 : 0) + (r[1] === u.occ ? 1 : 0) }));
  });
  list.sort((x, y) => y.hit - x.hit);
  $('#sFeed').innerHTML = list.length ? list.map(x => {
    const a = x.a, r = RM[x.ri];
    return '<div class="card art"><span class="room-tag">' + esc(r[0]) + '</span><h3>' + esc(a.t) + '</h3><small class="note">by ' + esc(a.a) + ' &middot; ' + esc(a.d) + '</small><p style="white-space:pre-wrap">' + esc(a.b) + '</p><b>' + a.c.length + ' comment' + (a.c.length === 1 ? '' : 's') + '</b>' +
      a.c.map(c => '<div class="cmt"><b>' + esc(c.a) + '</b> ' + esc(c.t) + '</div>').join('') +
      '<div class="cm"><input aria-label="Comment" placeholder="Add your thoughts\u2026" id="sc' + x.ri + '_' + x.i + '"><button class="btn sm" data-sc="' + x.ri + ':' + x.i + '">Comment</button></div></div>';
  }).join('') : '<p class="note">It\u2019s quiet in here. Be the first to post an article in a talk room.</p>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sc]'); if (!b) return;
  const p = b.dataset.sc.split(':'), t = $('#sc' + p[0] + '_' + p[1]).value.trim();
  if (!t) return;
  S.arts[p[0]][p[1]].c.push({ a: S.user.name || 'You', t }); save(); renderStudent();
});
