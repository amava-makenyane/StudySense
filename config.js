/* ===== Legal details used by the Privacy Policy and the "Your data" page =====
   Fill in everything in [square brackets] before launch, then have a South African lawyer
   review the policy. While any value still starts with "[", a draft notice shows on the policy page.
   Your company must also register its Information Officer with the Information Regulator. */
const POLICY_VERSION = '2026-10-28';

const COMPANY = {
  name: '[Your company name (Pty) Ltd]',
  regNo: '[Company registration number]',
  address: '[Physical address, South Africa]',
  officer: '[Information Officer full name]',
  officerEmail: '[privacy@yourdomain.co.za]',
  officerPhone: '[Phone number]',
  aiProvider: '[AI provider name and the country its servers are in]',
  hosting: '[Hosting provider and region]',
  retentionDays: 30,     // days we keep account data after someone deletes their account
  backupDays: 90         // days until deleted data has also left our backups
};

/* The Information Regulator's details, taken from inforegulator.org.za (checked October 2026). */
const REGULATOR = {
  name: 'The Information Regulator (South Africa)',
  address: 'JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001',
  complaints: 'POPIAComplaints@inforegulator.org.za',
  enquiries: 'enquiries@inforegulator.org.za',
  phone: '010 023 5200',
  site: 'https://inforegulator.org.za'
};

/* Prices live in pricing.js (BASE_PRICES): South Africa R50 student and R80 lecturer, everyone else
   US$10 student and US$15 lecturer, converted into their own currency. */

/* ===== Payments (PayPal) =====
   Fill in ONE of these. See PAYMENTS-SETUP.md for the steps.
   clientId  : developer.paypal.com > Apps & Credentials > your app > Client ID.
               Gives a PayPal button and a debit or credit card button, and unlocks the account automatically.
   meUser    : your PayPal.Me name (create it at https://www.paypal.com/paypalme/my/profile).
               Simple pay link. PayPal can't tell the website it was paid, so accounts stay "pending" until confirmed.
   mode      : 'order' = one payment for one month. 'subscription' = automatic monthly billing (needs plan ids).
   subscriptionPlans : { USD: { student: 'P-XXXX', teacher: 'P-YYYY' }, EUR: { ... } }  one plan per currency. */
const PAYPAL = { clientId: '', meUser: '', mode: 'order', subscriptionPlans: {} };

/* ===== Learn (school subjects) =====
   reportEmail : where "Report a mistake" messages go.
   reviewed    : topics a qualified teacher has checked, shown as a badge. Add an entry after each check, for example
                 'm-percent': { by: 'Mrs Naidoo, Maths teacher', on: '2026-12-01' }
   Topic ids are in learn-data.js. A topic with no entry shows "Awaiting teacher check". */
const LEARN = { reportEmail: '[learn@yourdomain.co.za]', reviewed: {} };
