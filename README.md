# StudySense (front end)

Plain HTML, CSS and JavaScript. No build step.

## Run it in VS Code
1. Open this folder in VS Code and install **Live Server** (VS Code will suggest it).
2. Right-click `index.html`, then **Open with Live Server**.

## Put it on GitHub Pages
1. Push this folder to a GitHub repo.
2. Repo **Settings**, then **Pages**, then deploy from branch `main`, folder `/ (root)`.

## Files (all in one folder, no sub-folders)
```
index.html         all pages
styles.css         design tokens (dark and light), layout, components
api.js             THE backend seam. Set API.base and the UI talks to your server
app.js             routing, note types, quiz, flashcards and mock exam, talk rooms
files.js           reads text, Word, PowerPoint, Excel, PDF and photos (OCR)
student.js         student dashboard (talk-room article feed)
teacher.js         marking, spreadsheet, export, modules, graphs
dashboard.js       teacher dashboard widgets
references.js      reference manager: Harvard, APA 7th, MLA 9th, IEEE, Chicago
extras.js          Ask my notes, podcast, WhatsApp share, PDF, quiz weak topics
config.js          company details, PAYPAL settings, LEARN settings (fill in)
privacy.js         POPIA policy text, Your data page
pricing.js         prices by country, currency conversion, plan cards
auth.js            register page, sign in, forgot password with a 6-digit code
checkout.js        payment page: debit or credit card and PayPal, then the profile
learn-data.js      Learn: lessons, question generators and answer checks
learn.js           Learn screen
learn-selftest.js  run with: node learn-selftest.js 1500  (must print failures: 0)
main.js            greetings, theme, shortcuts, read aloud, start-up
PAYMENTS-SETUP.md  step-by-step PayPal setup
```
Keep every file next to `index.html`. The scripts load in the order `index.html` lists them, so don't rename them.

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
| POST `/v1/tutor` | `{text, question}` | `{answer}` (answer only from the text) |
| POST `/v1/ocr` | multipart `file` | `{text}` |
| POST `/v1/marking` | `{memo:[line], papers:[{name,text}]}` | `{results:[{name, scores:[0, 0.5, 1]}]}` |
| POST `/v1/auth/google`, `/v1/auth/login`, `/v1/auth/register` | credentials | session cookie and user |
| GET, PATCH `/v1/me` | profile fields: name, role, occ, field, inst | user |
| GET `/v1/usage` | none | `{used, limit, subscribed}` (count free attempts on the server) |
| POST `/v1/billing/paypal/confirm` | `{orderId, role, currency, amount, country}` | Confirm the PayPal order on the server (see PAYMENTS-SETUP.md), then mark the account paid |
| GET, POST, DELETE `/v1/modules`, POST `/v1/modules/:id/sessions` | module or session `{t, q, rows:[{name, s[]}]}` | module list |
| GET `/v1/rooms`, GET and POST `/v1/rooms/:id/articles`, POST `/v1/articles/:id/comments` | `{t, b}` or `{t}` | articles with comments |

Notes for the team
- Guest attempts are counted in the browser today. Enforce the limit on the server.
- Uploaded files are read in the browser. If you read them on the server instead, return the text the same way.
- Handwriting needs a stronger OCR model than the browser one. Typed and printed scans work well already.
- Add a privacy policy, sign-up consent and a delete-my-data option (POPIA).

## POPIA checklist (needs a human and a lawyer)
The front end now includes a full Privacy Policy, a consent box at sign-up (with a separate optional marketing box and under-18 guardian consent), a "Your data" page (download, delete, marketing opt-out, send a request), a storage notice, and reminders where people upload. This is not legal advice. Before launch:
- Fill in every `[square bracket]` value in `config.js` and have a South African lawyer review the policy.
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

## Register, payment and forgot-password flow
1. **Register** (`#register`): name, email, password, student or lecturer, country, occupation, field, institution, consent, under-18 guardian consent. Then it goes to the payment page.
2. **Payment** (`#checkout`): the price is shown in the user's currency. They choose **debit or credit card** or **PayPal**. When PayPal confirms the payment, the account unlocks and the user lands on their profile automatically.
3. **Sign in**: wrong passwords lock the form for a minute after 5 tries. Accounts that haven't paid are sent to the payment page.
4. **Forgot password**: email, then a 6-digit code, then a new password.

### Prices
South Africa: R50 student, R80 lecturer. Everywhere else: US$10 student, US$15 lecturer, converted into the user's currency with live European Central Bank rates (Frankfurter). PayPal can't take every currency (for example rand, naira, rupees), so those users are charged in US dollars and shown the amount. Edit `BASE_PRICES` in `pricing.js`.

### Endpoints for the backend team (used when `API.base` is set)
| Method and path | Request | Response |
|---|---|---|
| POST `/v1/auth/register` | `{firstName, lastName, email, password, role, country, occupation, field, institution, consent}` | Creates the account and session. Respond 202 even if the email exists |
| POST `/v1/auth/login` | `{email, password}` | `{user, subscription}`. Lock after repeated failures |
| POST `/v1/auth/forgot` | `{email}` | Always 202. Email a 6-digit code |
| POST `/v1/auth/reset` | `{email, otp, password}` | Check the code, then set the password |

**One-time code rules:** 6 digits made with a secure random generator, valid for 10 minutes, single use, stored hashed, locked after 5 wrong tries, at most one new code per minute per email and per IP, and the same reply whether or not the email exists.

**Important:** without a backend, a PayPal payment is only trusted by the browser, which anyone can fake. Before launch, build `/v1/billing/paypal/confirm` so the server checks the payment with PayPal first.

## Learn (school subjects)
Levels: Grade 4 to 6, Grade 7 to 9, Grade 10 to 12, and College or university (which uses the student's own notes).
Subjects: Mathematics, Mathematical Literacy, Natural and Physical Sciences, Life Sciences, English (grammar) and Geography (map skills). 50 topics.

**How accuracy is protected (and its limits)**
- Every practice question is made by code from a seed. Its answer is worked out with exact arithmetic (whole numbers, fractions, or BigInt for compound interest), never estimated.
- Every question carries an independent check that tests the answer a different way, for example by putting it back into the equation.
- Run `node learn-selftest.js 1500` to check about 75,000 generated questions. It also checks that the correct answer typed in different ways (1 200, 1200, 1,5, 1.5, 2 or -3, 5x + 4) is accepted and that wrong answers are rejected. It must print `failures: 0`.
- Lessons use only well-established school facts, but **no automatic test can prove a lesson matches your syllabus**. A qualified teacher must check each topic before launch, then add it to `LEARN.reviewed` in `config.js` so the page shows "Checked by ...". Until then it shows "Awaiting teacher check".
- South African context: VAT is 15% (SARS), money is in rand, and coordinates are written (x ; y).
- Every question has a **Report a mistake** button. Set `LEARN.reportEmail`, or send reports to `POST /v1/learn/reports` when `API.base` is set.
- To add a topic: write a generator in `learn-data.js` that returns an answer and a `chk` function, add it to `TOPICS`, then run the self-test.

**Teachers** can make a printable worksheet with a memo (the worksheet code brings the same worksheet back) and send the memo straight into the marking tool.
