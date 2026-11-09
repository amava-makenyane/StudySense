<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

/* =========================== AUTH =========================== */

function consent_from($c, bool $required): ?array {
  if (!is_array($c)) { if ($required) fail(422, 'Consent is required to create an account'); return null; }
  $minor = !empty($c['minor']);
  $guardian = $minor ? str($c['guardian'] ?? null, 190, true, 'Guardian email') : '';
  if ($minor && !filter_var($guardian, FILTER_VALIDATE_EMAIL)) fail(422, 'Enter a valid parent or guardian email');
  return [
    'v' => str($c['v'] ?? null, 20, true, 'Policy version'),
    'marketing' => !empty($c['marketing']) ? 1 : 0,
    'minor' => $minor ? 1 : 0,
    'guardian' => $guardian !== '' ? $guardian : null,
  ];
}
function insert_consent(int $id, array $c): void {
  run('INSERT INTO consents (user_id, policy_version, marketing, is_minor, guardian_email) VALUES (?,?,?,?,?)',
      [$id, $c['v'], $c['marketing'], $c['minor'], $c['guardian']]);
}

function r_register(): void {
  $d = body();
  $name = str($d['name'] ?? null, 100, true, 'Name');
  $email = strtolower(str($d['email'] ?? null, 190, true, 'Email'));
  $pw = (string)($d['password'] ?? '');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail(422, 'Enter a valid email address');
  if (strlen($pw) < 8) fail(422, 'Password must be at least 8 characters');
  if (strlen($pw) > 72) fail(422, 'Password is too long (72 characters max)');
  $consent = consent_from($d['consent'] ?? null, true);

  if (q1('SELECT id FROM users WHERE email = ?', [$email])) fail(409, 'An account with that email already exists');
  $pdo = db();
  $pdo->beginTransaction();
  try {
    run('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)', [$name, $email, password_hash($pw, PASSWORD_DEFAULT)]);
    $id = (int)$pdo->lastInsertId();
    insert_consent($id, $consent);
    $pdo->commit();
  } catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->getCode() === '23000') fail(409, 'An account with that email already exists');
    throw $e;
  }
  start_session($id);
  json_out(me_payload(user_row($id)), 201);
}

function r_login(): void {
  $d = body();
  $email = strtolower(str($d['email'] ?? null, 190, true, 'Email'));
  $pw = (string)($d['password'] ?? '');
  $recent = q1('SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)', [$email]);
  if ((int)$recent['n'] >= 8) fail(429, 'Too many attempts. Please wait 15 minutes and try again.');

  $u = q1('SELECT * FROM users WHERE email = ?', [$email]);
  // Always run password_verify so response time doesn't reveal whether the email exists.
  $hash = $u['password_hash'] ?? '$2y$10$usesomesillystringforsaltuQ5v6Z8m1b5Yw0m3f8N0m8b3m6r9a6e';
  $ok = password_verify($pw, $hash) && $u && $u['password_hash'] !== null;
  if (!$ok) {
    run('INSERT INTO login_attempts (email, ip) VALUES (?,?)', [$email, client_ip()]);
    fail(401, 'Wrong email or password');
  }
  run('DELETE FROM login_attempts WHERE email = ?', [$email]);
  start_session((int)$u['id']);
  json_out(me_payload($u));
}

function r_google(): void {
  $d = body();
  $cid = cfg('google_client_id');
  if (!$cid) fail(501, 'Google sign-in is not configured');
  $cred = (string)($d['credential'] ?? '');
  $ctx = stream_context_create(['http' => ['timeout' => 5]]);
  $raw = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($cred), false, $ctx);
  $t = $raw ? json_decode($raw, true) : null;
  if (!is_array($t) || ($t['aud'] ?? '') !== $cid
      || !in_array($t['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true)
      || !filter_var($t['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)
      || empty($t['email'])) fail(401, 'Google sign-in failed');

  $email = strtolower((string)$t['email']);
  $u = q1('SELECT * FROM users WHERE email = ?', [$email]);
  if (!$u) {
    $consent = consent_from($d['consent'] ?? null, true);
    $name = mb_substr((string)($t['name'] ?? explode('@', $email)[0]), 0, 100);
    $pdo = db();
    $pdo->beginTransaction();
    run('INSERT INTO users (name, email) VALUES (?,?)', [$name, $email]);
    $id = (int)$pdo->lastInsertId();
    insert_consent($id, $consent);
    $pdo->commit();
    $u = user_row($id);
  }
  start_session((int)$u['id']);
  json_out(me_payload($u));
}

function r_logout(): void {
  $_SESSION = [];
  session_destroy();
  json_out(['ok' => true]);
}

/* =========================== ME / POPIA =========================== */

function r_me_get(): void { json_out(me_payload(user_row(uid()))); }

function r_me_patch(): void {
  $id = uid();
  $d = body();
  $u = user_row($id);
  $name = array_key_exists('name', $d) ? str($d['name'], 100, true, 'Name') : $u['name'];
  $role = $u['role'];
  if (array_key_exists('role', $d)) {
    if (!in_array($d['role'], ['student', 'teacher'], true)) fail(422, 'Invalid role');
    $role = $d['role'];
  }
  $occ = $u['occupation'];
  if (array_key_exists('occ', $d)) { if (!in_array($d['occ'], OCCUPATIONS, true)) fail(422, 'Invalid occupation'); $occ = $d['occ']; }
  $field = $u['field'];
  if (array_key_exists('field', $d)) { if (!in_array($d['field'], FIELDS, true)) fail(422, 'Invalid field of study'); $field = $d['field']; }
  $inst = array_key_exists('inst', $d) ? str($d['inst'], 150, false, 'Institution') : $u['institution'];
  run('UPDATE users SET name=?, role=?, occupation=?, field=?, institution=? WHERE id=?', [$name, $role, $occ, $field, $inst, $id]);
  json_out(me_payload(user_row($id)));
}

function r_consent_patch(): void {
  $id = uid();
  $d = body();
  $last = q1('SELECT * FROM consents WHERE user_id = ? ORDER BY id DESC LIMIT 1', [$id]);
  run('INSERT INTO consents (user_id, policy_version, marketing, is_minor, guardian_email) VALUES (?,?,?,?,?)',
      [$id, $last['policy_version'] ?? 'unknown', !empty($d['marketing']) ? 1 : 0, $last['is_minor'] ?? 0, $last['guardian_email'] ?? null]);
  json_out(['ok' => true]);
}

function r_export(): void {
  $id = uid();
  $u = user_row($id);
  unset($u['password_hash']);
  json_out([
    'exported_at' => gmdate('Y-m-d\TH:i:s\Z'),
    'account' => $u,
    'consents' => q('SELECT policy_version, marketing, is_minor, guardian_email, given_at FROM consents WHERE user_id = ? ORDER BY id', [$id]),
    'modules' => load_modules($id),
    'articles' => q('SELECT room_id, title, body, created_at FROM articles WHERE user_id = ? ORDER BY id', [$id]),
    'comments' => q('SELECT article_id, body, created_at FROM comments WHERE user_id = ? ORDER BY id', [$id]),
    'privacy_requests' => q('SELECT type, details, created_at FROM privacy_requests WHERE email = ? ORDER BY id', [$u['email']]),
  ]);
}

function r_delete_me(): void {
  $id = uid();
  run('DELETE FROM users WHERE id = ?', [$id]);   // cascades to consents, modules, sessions, rows, articles, comments
  $_SESSION = [];
  session_destroy();
  json_out(['ok' => true]);
}

function r_privacy_request(): void {
  $d = body();
  $email = strtolower(str($d['email'] ?? null, 190, true, 'Email'));
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail(422, 'Enter a valid email address');
  run('INSERT INTO privacy_requests (email, type, details) VALUES (?,?,?)',
      [$email, str($d['type'] ?? null, 100, true, 'Request type'), str($d['details'] ?? null, 5000)]);
  json_out(['ok' => true], 201);
}

/* =========================== USAGE / BILLING =========================== */

function r_usage_get(): void {
  $u = user_row(uid());
  json_out(['used' => (int)$u['free_used'], 'limit' => FREE_LIMIT, 'subscribed' => (bool)$u['subscribed']]);
}

function r_usage_consume(): void {
  $id = uid();
  $u = user_row($id);
  if ($u['subscribed']) json_out(['used' => (int)$u['free_used'], 'limit' => null, 'subscribed' => true]);
  // Atomic: the WHERE clause stops two parallel requests from both slipping under the limit.
  if (run('UPDATE users SET free_used = free_used + 1 WHERE id = ? AND free_used < ?', [$id, FREE_LIMIT]) === 0)
    fail(402, 'Free limit reached', ['used' => FREE_LIMIT, 'limit' => FREE_LIMIT]);
  json_out(['used' => (int)user_row($id)['free_used'], 'limit' => FREE_LIMIT, 'subscribed' => false]);
}

function r_subscribe(): void {
  $id = uid();
  // TODO: replace with a PayFast checkout + ITN webhook that sets subscribed = 1 after real payment.
  if (!cfg('dev_fake_subscribe', false)) fail(501, 'Payments are not switched on yet');
  run('UPDATE users SET subscribed = 1 WHERE id = ?', [$id]);
  json_out(me_payload(user_row($id)));
}

/* =========================== MODULES =========================== */

function load_modules(int $uid, ?int $only = null): array {
  $mods = $only
    ? q('SELECT id, name, memo FROM modules WHERE user_id = ? AND id = ?', [$uid, $only])
    : q('SELECT id, name, memo FROM modules WHERE user_id = ? ORDER BY id', [$uid]);
  if (!$mods) return [];
  $mi = array_column($mods, 'id');
  $ses = q('SELECT id, module_id, title, question_count, marked_at FROM sessions_marked WHERE module_id IN (' . implode(',', array_fill(0, count($mi), '?')) . ') ORDER BY marked_at, id', $mi);
  $rowsBy = [];
  if ($ses) {
    $si = array_column($ses, 'id');
    foreach (q('SELECT session_id, student_name, scores FROM session_rows WHERE session_id IN (' . implode(',', array_fill(0, count($si), '?')) . ') ORDER BY id', $si) as $r)
      $rowsBy[$r['session_id']][] = ['name' => $r['student_name'], 's' => json_decode($r['scores'], true)];
  }
  $sesBy = [];
  foreach ($ses as $s)
    $sesBy[$s['module_id']][] = ['id' => (int)$s['id'], 'd' => iso($s['marked_at']), 't' => $s['title'], 'q' => (int)$s['question_count'], 'rows' => $rowsBy[$s['id']] ?? []];
  return array_map(fn($m) => ['id' => (int)$m['id'], 'name' => $m['name'], 'memo' => $m['memo'] ?? '', 'sessions' => $sesBy[$m['id']] ?? []], $mods);
}

function clean_session(array $s): array {
  $title = str($s['t'] ?? null, 150, true, 'Assessment name');
  $qn = $s['q'] ?? null;
  if (!is_int($qn) || $qn < 1 || $qn > 200) fail(422, 'Invalid question count');
  $rows = $s['rows'] ?? null;
  if (!is_array($rows) || !$rows || count($rows) > 500) fail(422, 'Add between 1 and 500 papers');
  $out = [];
  foreach ($rows as $r) {
    if (!is_array($r)) fail(422, 'Invalid row');
    $name = str($r['name'] ?? null, 120, true, 'Student name');
    $sc = $r['s'] ?? null;
    if (!is_array($sc) || count($sc) !== $qn) fail(422, 'Scores do not match the memo');
    foreach ($sc as $v) {
      if ((!is_int($v) && !is_float($v)) || !in_array((float)$v, [0.0, 0.5, 1.0], true)) fail(422, 'Invalid score');
    }
    $out[] = [$name, json_encode(array_values($sc))];
  }
  return [$title, $qn, $out];
}

function insert_session(int $mid, string $title, int $qn, array $rows): int {
  run('INSERT INTO sessions_marked (module_id, title, question_count) VALUES (?,?,?)', [$mid, $title, $qn]);
  $sid = (int)db()->lastInsertId();
  $st = db()->prepare('INSERT INTO session_rows (session_id, student_name, scores) VALUES (?,?,?)');
  foreach ($rows as $r) $st->execute([$sid, $r[0], $r[1]]);
  return $sid;
}

function r_modules_list(): void { json_out(['modules' => load_modules(uid())]); }

function r_module_create(): void {
  $id = uid();
  $d = body();
  $name = str($d['name'] ?? null, 150, true, 'Module name');
  $memo = str($d['memo'] ?? null, 20000);
  $sess = isset($d['session']) && is_array($d['session']) ? clean_session($d['session']) : null;

  $existing = q1('SELECT id FROM modules WHERE user_id = ? AND name = ?', [$id, $name]);
  if ($existing) json_out(['module' => load_modules($id, (int)$existing['id'])[0]]);

  $u = user_row($id);
  if (!$u['subscribed'] && (int)q1('SELECT COUNT(*) AS n FROM modules WHERE user_id = ?', [$id])['n'] >= FREE_MODULES)
    fail(402, 'Your free module slots are full');

  $pdo = db();
  $pdo->beginTransaction();
  try {
    run('INSERT INTO modules (user_id, name, memo) VALUES (?,?,?)', [$id, $name, $memo]);
    $mid = (int)$pdo->lastInsertId();
    if ($sess) insert_session($mid, $sess[0], $sess[1], $sess[2]);
    $pdo->commit();
  } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
  json_out(['module' => load_modules($id, $mid)[0]], 201);
}

function r_module_delete(int $mid): void {
  if (run('DELETE FROM modules WHERE id = ? AND user_id = ?', [$mid, uid()]) === 0) fail(404, 'Module not found');
  json_out(['ok' => true]);
}

function r_session_create(int $mid): void {
  $id = uid();
  if (!q1('SELECT id FROM modules WHERE id = ? AND user_id = ?', [$mid, $id])) fail(404, 'Module not found');   // ownership check
  $d = body();
  [$title, $qn, $rows] = clean_session($d);
  $pdo = db();
  $pdo->beginTransaction();
  try {
    $sid = insert_session($mid, $title, $qn, $rows);
    if (array_key_exists('memo', $d)) run('UPDATE modules SET memo = ? WHERE id = ?', [str($d['memo'], 20000), $mid]);
    $pdo->commit();
  } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
  $m = load_modules($id, $mid)[0];
  foreach ($m['sessions'] as $s) if ($s['id'] === $sid) json_out(['session' => $s], 201);
  fail(500, 'Could not save');
}

/* =========================== ROOMS / ARTICLES =========================== */

function articles_query(string $where, array $p, int $limit = 200): array {
  $arts = q("SELECT a.id, a.room_id, a.title, a.body, a.created_at, u.name AS author FROM articles a JOIN users u ON u.id = a.user_id $where ORDER BY a.id DESC LIMIT $limit", $p);
  if (!$arts) return [];
  $ids = array_column($arts, 'id');
  $by = [];
  foreach (q('SELECT c.id, c.article_id, c.body, c.created_at, u.name AS author FROM comments c JOIN users u ON u.id = c.user_id WHERE c.article_id IN (' . implode(',', array_fill(0, count($ids), '?')) . ') ORDER BY c.id', $ids) as $c)
    $by[$c['article_id']][] = ['id' => (int)$c['id'], 'author' => $c['author'], 'body' => $c['body'], 'created_at' => iso($c['created_at'])];
  return array_map(fn($a) => [
    'id' => (int)$a['id'], 'room_id' => (int)$a['room_id'], 'title' => $a['title'], 'body' => $a['body'],
    'author' => $a['author'], 'created_at' => iso($a['created_at']), 'comments' => $by[$a['id']] ?? [],
  ], $arts);
}

function r_rooms(): void {
  uid();
  json_out(['rooms' => array_map(fn($r) => ['id' => (int)$r['id'], 'name' => $r['name'], 'occupation' => $r['occupation'], 'field' => $r['field'], 'members' => (int)$r['members']],
    q('SELECT id, name, occupation, field, members FROM rooms ORDER BY id'))]);
}
function r_articles_all(): void { uid(); json_out(['articles' => articles_query('', [])]); }
function r_room_articles(int $rid): void { uid(); json_out(['articles' => articles_query('WHERE a.room_id = ?', [$rid])]); }

function r_article_create(int $rid): void {
  $id = uid();
  if (!q1('SELECT id FROM rooms WHERE id = ?', [$rid])) fail(404, 'Room not found');
  $d = body();
  $title = str($d['t'] ?? null, 200, true, 'Title');
  $text = str($d['b'] ?? null, 10000, true, 'Article');
  if (mb_strlen($text) < 20) fail(422, 'Article must be at least 20 characters');
  run('INSERT INTO articles (room_id, user_id, title, body) VALUES (?,?,?,?)', [$rid, $id, $title, $text]);
  json_out(['article' => articles_query('WHERE a.id = ?', [(int)db()->lastInsertId()])[0]], 201);
}

function r_comment_create(int $aid): void {
  $id = uid();
  if (!q1('SELECT id FROM articles WHERE id = ?', [$aid])) fail(404, 'Article not found');
  $text = str(body()['t'] ?? null, 1000, true, 'Comment');
  run('INSERT INTO comments (article_id, user_id, body) VALUES (?,?,?)', [$aid, $id, $text]);
  json_out(['ok' => true], 201);
}

/* =========================== ROUTER =========================== */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (!preg_match('#/v1(/.*)?$#', $path, $m)) fail(404, 'Not found');
$path = rtrim($m[1] ?? '/', '/') ?: '/';

$routes = [
  ['POST',   '/auth/register',            'r_register'],
  ['POST',   '/auth/login',               'r_login'],
  ['POST',   '/auth/google',              'r_google'],
  ['POST',   '/auth/logout',              'r_logout'],
  ['GET',    '/me',                       'r_me_get'],
  ['PATCH',  '/me',                       'r_me_patch'],
  ['PATCH',  '/me/consent',               'r_consent_patch'],
  ['GET',    '/me/export',                'r_export'],
  ['DELETE', '/me',                       'r_delete_me'],
  ['POST',   '/privacy/requests',         'r_privacy_request'],
  ['GET',    '/usage',                    'r_usage_get'],
  ['POST',   '/usage/consume',            'r_usage_consume'],
  ['POST',   '/billing/subscribe',        'r_subscribe'],
  ['GET',    '/modules',                  'r_modules_list'],
  ['POST',   '/modules',                  'r_module_create'],
  ['DELETE', '/modules/(\d+)',            'r_module_delete'],
  ['POST',   '/modules/(\d+)/sessions',   'r_session_create'],
  ['GET',    '/rooms',                    'r_rooms'],
  ['GET',    '/articles',                 'r_articles_all'],
  ['GET',    '/rooms/(\d+)/articles',     'r_room_articles'],
  ['POST',   '/rooms/(\d+)/articles',     'r_article_create'],
  ['POST',   '/articles/(\d+)/comments',  'r_comment_create'],
];
foreach ($routes as [$meth, $pat, $fn]) {
  if ($meth === $method && preg_match('#^' . $pat . '$#', $path, $mm)) {
    array_shift($mm);
    $fn(...array_map('intval', $mm));
    exit;
  }
}
fail(404, 'Not found');
