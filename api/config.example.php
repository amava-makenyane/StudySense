<?php

return [
  'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'studysense',
    'user' => 'your_db_user',
    'pass' => 'your_db_password',
  ],

  
  'allowed_origins' => [
    'http://127.0.0.1:5500',            
    'http://localhost:5500',
    'https://YOURNAME.github.io',       
  ],

  
  'dev' => true,

  
  'google_client_id' => '',

  
  'dev_fake_subscribe' => true,
];
