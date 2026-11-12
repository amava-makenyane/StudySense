# StudySense API (PHP 8.1+ and MySQL)

## Run it locally
1. Create an empty MySQL database (XAMPP/phpMyAdmin is fine) and import `schema.sql` into it.
2. Copy `config.example.php` to `config.php` and fill in the database details.
3. In this folder run: `php -S 127.0.0.1:8000 index.php`
4. In `js/api.js` set `base: 'http://127.0.0.1:8000'`, add `<script src="js/sync.js"></script>` after `main.js` in `index.html`.
5. Open the front end with Live Server at `http://127.0.0.1:5500` (use 127.0.0.1 for BOTH, or localhost for both, never mixed).

## Deploy
- Upload the `api/` folder to a PHP 8.1+ host with MySQL, import `schema.sql`, create `config.php` on the server.
- In `config.php` set `dev` to `false` (needs https), put your GitHub Pages origin in `allowed_origins`.
- In `js/api.js` set `base` to your API address (the folder that holds `index.php`), e.g. `https://yourdomain.co.za/api`.
- Best practice: keep `config.php` above the public web root and change the `require` path in `bootstrap.php`.

## Endpoints (all under /v1, JSON, session cookie)
Auth: POST /auth/register, /auth/login, /auth/google, /auth/logout
Me: GET, PATCH /me, PATCH /me/consent, GET /me/export, DELETE /me, POST /privacy/requests
Usage: GET /usage, POST /usage/consume, POST /billing/subscribe
Modules: GET, POST /modules, DELETE /modules/:id, POST /modules/:id/sessions
Rooms: GET /rooms, GET /articles, GET, POST /rooms/:id/articles, POST /articles/:id/comments

## Still to do
- `/v1/notes`, `/v1/ocr`, `/v1/marking`: summarising and marking still run in the browser, so the free limit can be bypassed until they move here. Then set `API.serverAi = true`.
- Payments: `/billing/subscribe` is a demo switch. Add PayFast checkout + ITN webhook, then set `dev_fake_subscribe` to false.
- Google sign-in: create an OAuth client, set `google_client_id` (config.php) and `googleClientId` (api.js).
- POPIA: fill `js/config.js`, register the Information Officer, and make sure deleted data leaves backups within the stated days.
