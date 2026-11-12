<?php
declare(strict_types=1);

const FREE_LIMIT = 5;      
const FREE_MODULES = 3;    
const OCCUPATIONS = ['Student', 'Teacher', 'Lecturer', 'Developer', 'Nurse', 'Accountant', 'Other'];
const FIELDS = ['History', 'IT', 'Life Sciences', 'Commerce', 'Law', 'Mathematics'];

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function json_out($data, int $status = 200): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function fail(int $status, string $msg, array $extra = []): never {
  json_out(['error' => $msg] + $extra, $status);
}

set_exception_handler(function (Throwable $e) {
  error_log((string)$e);
  fail(500, 'Something went wrong on our side');
});

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) fail(500, 'Server is not configured. Copy config.example.php to config.php.');
$CONFIG = require $configFile;
function cfg(string $k, $default = null) { global $CONFIG; return $CONFIG[$k] ?? $default; }


$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = cfg('allowed_origins', []);
$originOk = $origin !== '' && in_array($origin, $allowed, true);
if ($originOk) {
  header("Access-Control-Allow-Origin: $origin");
  header('Access-Control-Allow-Credentials: true');
  header('Vary: Origin');
  header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Max-Age: 600');
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { http_response_code(204); exit; }

if ($method !== 'GET' && $origin !== '' && !$originOk) fail(403, 'Origin not allowed');


$secure = !cfg('dev', false);
ini_set('session.gc_maxlifetime', (string)(60 * 60 * 24 * 30));
session_name('ssid');
session_set_cookie_params([
  'lifetime' => 60 * 60 * 24 * 30,
  'path' => '/',
  'secure' => $secure,
  'httponly' => true,
  'samesite' => $secure ? 'None' : 'Lax',
]);
session_start();


function db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $c = cfg('db');
    $pdo = new PDO(
      "mysql:host={$c['host']};port=" . ($c['port'] ?? 3306) . ";dbname={$c['name']};charset=utf8mb4",
      $c['user'], $c['pass'],
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $pdo->exec("SET time_zone = '+00:00'");
  }
  return $pdo;
}
function q(string $sql, array $p = []): array { $st = db()->prepare($sql); $st->execute($p); return $st->fetchAll(); }
function q1(string $sql, array $p = []): ?array { return q($sql, $p)[0] ?? null; }
function run(string $sql, array $p = []): int { $st = db()->prepare($sql); $st->execute($p); return $st->rowCount(); }


function body(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') return [];
  if (strlen($raw) > 3_000_000) fail(413, 'Request too large');
  $d = json_decode($raw, true);
  if (!is_array($d)) fail(400, 'Invalid JSON');
  return $d;
}
function str($v, int $max, bool $required = false, string $field = 'Value'): string {
  $s = is_string($v) ? trim($v) : '';
  if ($required && $s === '') fail(422, "$field is required");
  if (mb_strlen($s) > $max) fail(422, "$field is too long");
  return $s;
}
function iso(string $ts): string { return gmdate('Y-m-d\TH:i:s\Z', strtotime($ts . ' UTC')); }
function client_ip(): string { return substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45); }


function uid(): int {
  if (empty($_SESSION['uid'])) fail(401, 'Please sign in');
  return (int)$_SESSION['uid'];
}
function user_row(int $id): array {
  $u = q1('SELECT * FROM users WHERE id = ?', [$id]);
  if (!$u) { $_SESSION = []; session_destroy(); fail(401, 'Please sign in'); }
  return $u;
}
function me_payload(array $u): array {
  return [
    'user' => ['name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'], 'occ' => $u['occupation'], 'field' => $u['field'], 'inst' => $u['institution']],
    'sub' => (bool)$u['subscribed'],
    'n' => (int)$u['free_used'],
  ];
}
function start_session(int $id): void {
  session_regenerate_id(true);
  $_SESSION['uid'] = $id;
}
