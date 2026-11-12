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
