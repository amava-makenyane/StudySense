<?php
// Copy this file to config.php and fill it in. config.php is git-ignored: NEVER commit it.
return [
  'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'studysense',
    'user' => 'your_db_user',
    'pass' => 'your_db_password',
  ],

  // Exact origins of the front end (scheme + host + port, no path, no trailing slash).
  'allowed_origins' => [
    'http://127.0.0.1:5500',            // VS Code Live Server
    'http://localhost:5500',
    'https://YOURNAME.github.io',       // GitHub Pages
  ],

  // true while developing over plain http. MUST be false in production (needs https).
  'dev' => true,

  // From Google Cloud Console > Credentials > OAuth client ID (Web). Leave '' to disable.
  'google_client_id' => '',

  // true = the Subscribe button marks the user as subscribed WITHOUT paying (demo only).
  // Set false in production until PayFast is wired in.
  'dev_fake_subscribe' => true,
];
