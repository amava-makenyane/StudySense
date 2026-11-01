# StudySense (front end)

Plain HTML, CSS and JavaScript. No build step.

## Run it in VS Code
1. Open this folder in VS Code and install **Live Server** (VS Code will suggest it).
2. Right-click `index.html`, then **Open with Live Server**.

## Put it on GitHub Pages
1. Push this folder to a GitHub repo.
2. Repo **Settings**, then **Pages**, then deploy from branch `main`, folder `/ (root)`.

## Folder map
```
index.html        all pages (home, notes, sign in, role, profile, dashboards, rooms, pricing)
css/styles.css    design tokens (dark and light), layout, components
js/api.js         THE backend seam. Set API.base and the UI talks to your server
js/app.js         routing, sign-in, note types, quiz and mock exam, talk rooms
js/files.js       reads text, Word, PowerPoint, Excel, PDF and photos (OCR)
js/student.js     student dashboard (talk-room article feed)
js/teacher.js     marking, spreadsheet, export, modules, graphs
js/dashboard.js   teacher dashboard widgets (results, activity, top performers, up next)
js/config.js      company and Information Officer details (FILL THESE IN)
js/privacy.js     POPIA policy text, sign-up consent, Your data page, storage notice
js/main.js        greetings, theme, shortcuts, read aloud, start-up
```
Libraries load from CDNs: JSZip, PDF.js, SheetJS, Chart.js, Tesseract.js.

## What works today (demo mode)
- Guest mode with 5 free summaries, then a sign-in and subscribe prompt.
- Uploads: `.txt .md .csv .json .html .docx .pptx .xlsx .xls .xlsm .ods .pdf` and photos or scans.
  Old binary `.doc` and `.ppt` need saving as `.docx` or `.pptx` (or handling on the server).
- Seven note types: simple, slides, exam, test, extended, quiz, mock exam.
- Teacher: upload or scan the memo and each student's paper, mark, edit marks, download Excel or CSV,
  save into modules, and see four graphs. Free plan keeps 3 modules, subscribers get unlimited.
- Student dashboard: talk-room articles. Rooms can post articles and comment.
- Light and dark theme, read aloud, copy and download notes, drafts that autosave.

Right now accounts, usage counts, modules and room posts live in `localStorage` (key `ss`).
Summaries and marking use simple in-browser logic. Replace them by setting `API.base`.

## API contract (JSON, cookies for auth)
`api.js` already calls these three. The rest are for you to wire in where `S` and `save()` are used.

| Method and path | Request | Response |
|---|---|---|
| POST `/v1/notes` | `{text, mode}` mode is `simple, slides, exam, test, extended, quiz, mock` | `{mode, pts[], kw[], qs[], quiz[{s,a,o[]}], groups[{h,c[]}]}` or `null` if too short |
| POST `/v1/ocr` | multipart `file` | `{text}` |
| POST `/v1/marking` | `{memo:[line], papers:[{name,text}]}` | `{results:[{name, scores:[0, 0.5, 1]}]}` |
| POST `/v1/auth/google`, `/v1/auth/login`, `/v1/auth/register` | credentials | session cookie and user |
| GET, PATCH `/v1/me` | profile fields: name, role, occ, field, inst | user |
| GET `/v1/usage` | none | `{used, limit, subscribed}` (count free attempts on the server) |
| POST `/v1/billing/subscribe` | none | PayFast redirect URL (R50 a month) |
| GET, POST, DELETE `/v1/modules`, POST `/v1/modules/:id/sessions` | module or session `{t, q, rows:[{name, s[]}]}` | module list |
| GET `/v1/rooms`, GET and POST `/v1/rooms/:id/articles`, POST `/v1/articles/:id/comments` | `{t, b}` or `{t}` | articles with comments |

Notes for the team
- Guest attempts are counted in the browser today. Enforce the limit on the server.
- Uploaded files are read in the browser. If you read them on the server instead, return the text the same way.
- Handwriting needs a stronger OCR model than the browser one. Typed and printed scans work well already.
- Add a privacy policy, sign-up consent and a delete-my-data option (POPIA).

## POPIA checklist (needs a human and a lawyer)
The front end now includes a full Privacy Policy, a consent box at sign-up (with a separate optional marketing box and under-18 guardian consent), a "Your data" page (download, delete, marketing opt-out, send a request), a storage notice, and reminders where people upload. This is not legal advice. Before launch:
- Fill in every `[square bracket]` value in `js/config.js` and have a South African lawyer review the policy.
- Register your Information Officer with the Information Regulator (inforegulator.org.za).
- Sign operator agreements with your hosting, AI and email providers (POPIA sections 20 and 21), and confirm the AI provider will not train on customer content. The policy says so.
- Store the consent record (`S.consent`: version, date, marketing, minor, guardian email) on the server.
- Implement `GET /v1/me/export`, `DELETE /v1/me` (must also clear backups within the days in `config.js`) and `POST /v1/privacy/requests`.
- Make sure a security breach can be reported to the Regulator (POPIACompliance@inforegulator.org.za) and to affected people (section 22).
- Do not log or store ID numbers. Keep learner papers private to the teacher who uploaded them.

Designed and built by [The NextWeb Studio](https://thenextwebstudio.lovable.app/).

## Brand
- Study Sense: lime `#93DD0C` and ink navy `#0A1024` (from the logo). Links and small text use deep lime `#3F7A00` on light backgrounds.
- The NextWeb Studio credit: navy `#0D1B33` footer with silver `#B2B5BA` and a serif wordmark.
- `assets/` holds your original logo files. The site draws the Study Sense mark in CSS (`--logo-dark`, `--logo-light`), so swap the SVG there if the logo changes.
