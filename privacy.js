/* ===== POPIA: policy text, sign-up consent, "Your data" tools, storage notice ===== */
const C = k => esc(String(COMPANY[k]));
const isDraft = () => Object.values(COMPANY).some(v => typeof v === 'string' && v.charAt(0) === '[');
const pdate = () => new Date(POLICY_VERSION).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

function policyHTML() {
  const S_ = [
    ['1. Who we are and what this policy covers',
      `<p><b>${C('name')}</b> (&ldquo;StudySense&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is the <b>responsible party</b> for the personal information you give us. Registration number: ${C('regNo')}. Address: ${C('address')}.</p>
       <p>This policy explains, in plain language, how we collect, use, share and protect your personal information in line with the <b>Protection of Personal Information Act 4 of 2013 (POPIA)</b>. Our <b>Information Officer</b> is ${C('officer')}, reachable at ${C('officerEmail')} or ${C('officerPhone')}.</p>
       <p>Version ${esc(POLICY_VERSION)}. Last updated ${pdate()}.</p>`],
    ['2. What we collect',
      `<ul><li><b>Account details:</b> your name, email address, role (student or teacher), occupation, field of study or subject, and institution.</li>
       <li><b>What you upload or type:</b> notes, slides, memos, answer sheets and photos or scans. Teachers&rsquo; uploads can include learners&rsquo; names and marks.</li>
       <li><b>What we create for you:</b> summaries, quizzes, mock exams, marks, spreadsheets, modules and drafts.</li>
       <li><b>Talk rooms:</b> the articles and comments you post, with your name.</li>
       <li><b>Usage and plan:</b> how many free summaries you have used and whether you are subscribed.</li>
       <li><b>Payments:</b> handled by PayFast. We do not see or store your full card number.</li>
       <li><b>Your consent choices</b> and the date you gave them.</li></ul>
       <p>We do not knowingly collect <b>special personal information</b> (for example health, religion, race, biometric or criminal records). Please do not upload it, and please leave out ID numbers.</p>`],
    ['3. Why we use it',
      `<p>We use your information only for the purposes below, and for nothing unrelated without asking you first (POPIA conditions on purpose specification and further processing).</p>
       <ul><li>To create and run your account, and to give you notes, quizzes, mock exams, marking and graphs. <i>Basis: to carry out our agreement with you.</i></li>
       <li>To take payment for your subscription and keep records the law requires.</li>
       <li>To run talk rooms and keep them safe, including removing harmful posts.</li>
       <li>To protect StudySense against fraud and abuse, and to fix problems.</li>
       <li>To send you study tips and product news <b>only if you opt in</b>.</li></ul>
       <p>Where we rely on your <b>consent</b>, you can withdraw it at any time. Withdrawing does not affect what we did before, and some features may stop working.</p>`],
    ['4. If you are a teacher or lecturer',
      `<p>When you upload learners&rsquo; papers or marks, you are responsible for having the authority to do so, and for telling learners (and parents or guardians of minors) how their work is used. Usually your school, college or university is the responsible party for that information, and StudySense processes it for you as an <b>operator</b>, only to provide the marking service. We keep it confidential and do not use it for our own purposes.</p>`],
    ['5. If you are under 18',
      `<p>POPIA says information about a child (anyone under 18) may only be processed with the consent of a competent person, such as a parent or guardian. If you are under 18, we ask for your parent or guardian&rsquo;s email and consent when you sign up. Please never share your phone number, address, school name or ID number in talk rooms. A parent or guardian can ask us at any time to see, correct or delete a child&rsquo;s information.</p>`],
    ['6. AI and automated marking',
      `<p>To make notes and marks we send the text you upload to an AI service provider (${C('aiProvider')}). We choose providers that let us stop customer content being used to train their models, and we will tell you if that changes.</p>
       <p>Marks and summaries are suggestions. A teacher can change any mark, and no decision that has a legal or significant effect on a person is made by automation alone (POPIA section 71). If you think an automated result is wrong, tell us and a person will look at it.</p>`],
    ['7. Who we share it with',
      `<p>We never sell your personal information. We share it only with service providers (&ldquo;operators&rdquo;) who process it for us under written agreements that require them to keep it secure and confidential: hosting (${C('hosting')}), the AI provider above, PayFast for payments, and an email service for account messages. We may also share information where the law requires it, or to protect rights and safety.</p>`],
    ['8. Sending information outside South Africa',
      `<p>Some of our providers store or process information outside South Africa. We only send personal information to another country if the recipient is bound by a law, binding corporate rules or an agreement that gives protection similar to POPIA, or if you consent, or if it is necessary to carry out our agreement with you (POPIA section 72).</p>`],
    ['9. How long we keep it',
      `<p>We keep your information only as long as we need it for the purposes above (POPIA section 14). Your content stays until you delete it or your account. After you delete your account we remove it within ${C('retentionDays')} days, and it leaves our backups within ${C('backupDays')} days. We keep billing records for as long as the law requires, for example for tax.</p>`],
    ['10. How we keep it safe',
      `<p>We use reasonable technical and organisational measures: encryption in transit, access controls, separate accounts for our team, and regular reviews. If we have reason to believe your information has been accessed by an unauthorised person, we will tell the Information Regulator and the people affected as soon as reasonably possible (POPIA section 22).</p>`],
    ['11. Your rights',
      `<p>Under POPIA you have the right to:</p>
       <ul><li><b>Know</b> what we hold and why, and <b>ask for a copy</b> (section 23).</li>
       <li><b>Correct or delete</b> information that is wrong, out of date or no longer needed (section 24).</li>
       <li><b>Object</b> to us processing your information (section 11(3)).</li>
       <li><b>Withdraw consent</b> at any time.</li>
       <li><b>Opt out of direct marketing</b> (section 69).</li>
       <li><b>Not be subject to a decision made only by automated means</b> (section 71).</li>
       <li><b>Complain</b> to the Information Regulator, and take civil action.</li></ul>
       <p>Use the <b>Your data</b> page to download or delete your data, or send a request to our Information Officer. We may ask you to confirm who you are first, and we aim to reply within 30 days.</p>
       <p><button class="btn sm" data-go="mydata">Go to Your data</button></p>`],
    ['12. Marketing',
      `<p>We send marketing only to people who opt in (an unticked box at sign-up). Every message tells you how to stop, and you can switch it off any time on the Your data page.</p>`],
    ['13. Browser storage and cookies',
      `<p>StudySense stores a few things in your browser so it works: your session and saved work (<code>ss</code>), your theme (<code>ss-theme</code>) and whether you have seen our storage notice (<code>ss-notice</code>). These are essential. We do not use advertising or cross-site tracking cookies. Clearing your browser data removes them.</p>`],
    ['14. Complaints',
      `<p>Please talk to our Information Officer first so we can put things right. You also have the right to complain to the Information Regulator:</p>
       <p><b>${esc(REGULATOR.name)}</b><br>${esc(REGULATOR.address)}<br>Complaints: <a href="mailto:${REGULATOR.complaints}">${REGULATOR.complaints}</a><br>Enquiries: <a href="mailto:${REGULATOR.enquiries}">${REGULATOR.enquiries}</a> &middot; ${esc(REGULATOR.phone)}<br><a href="${REGULATOR.site}" target="_blank" rel="noopener">${REGULATOR.site.replace('https://', '')}</a></p>`],
    ['15. Changes to this policy',
      `<p>If we change this policy in a way that matters, we will tell you in the app or by email before it takes effect. The version and date at the top always show the latest one.</p>`]
  ];
  return S_.map(s => '<section class="pol"><h3>' + s[0] + '</h3>' + s[1] + '</section>').join('');
}
function renderPolicy() {
  $('#policy').innerHTML = (isDraft() ? '<div class="card devnote"><b>Draft for developers:</b> fill in the details in square brackets in <code>js/config.js</code>, and have a South African lawyer review this policy before launch. This message disappears once they are filled in.</div>' : '') + policyHTML();
}

/* ---------- consent at sign-up ---------- */
const needsConsent = () => up || !S.consent;
function syncConsent() { $('#consent').style.display = needsConsent() ? 'block' : 'none'; }
$('#swap').addEventListener('click', syncConsent);
$('#cMinor').onchange = () => { $('#minorBox').style.display = $('#cMinor').checked ? 'block' : 'none'; };
function consentGate() {
  if (!needsConsent()) return true;
  if (!$('#cOk').checked) { toast('Please tick the consent box to continue. POPIA asks us to get it first.'); return false; }
  if ($('#cMinor').checked && (!$('#gOk').checked || !/\S+@\S+\.\S+/.test($('#gEm').value))) {
    toast('Under 18? We need your parent or guardian\u2019s email and consent first.'); return false;
  }
  S.consent = { v: POLICY_VERSION, at: new Date().toISOString(), marketing: $('#cMkt').checked, minor: $('#cMinor').checked, guardian: $('#cMinor').checked ? $('#gEm').value.trim() : '' };
  return true;
}
['#google', '#go'].forEach(id => { const orig = $(id).onclick; $(id).onclick = e => { if (consentGate()) orig(e); }; });

/* ---------- Your data page ---------- */
function renderMyData() {
  $('#mkt').checked = !!(S.consent && S.consent.marketing);
  $('#rqEm').value = (S.user && S.user.email) || '';
  $('#contacts').innerHTML = '<div class="two"><div class="card"><b>Our Information Officer</b><p class="note">' + C('officer') + '<br>' + C('officerEmail') + '<br>' + C('officerPhone') + '</p></div><div class="card"><b>' + esc(REGULATOR.name) + '</b><p class="note">' + esc(REGULATOR.address) + '<br>Complaints: ' + REGULATOR.complaints + '<br>' + esc(REGULATOR.phone) + '</p></div></div>';
}
$('#mkt').onchange = () => {
  S.consent = S.consent || { v: POLICY_VERSION, at: new Date().toISOString(), minor: false, guardian: '' };
  S.consent.marketing = $('#mkt').checked; save();
  toast($('#mkt').checked ? 'Thanks! We\u2019ll send the occasional study tip.' : 'Done. No more marketing from us.');
};
$('#dlMy').onclick = () => {
  API.exportMe().then(d => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
    a.download = 'my-studysense-data.json'; a.click();
    toast('Your data is downloading.');
  }).catch(() => toast('Hmm, we couldn\u2019t prepare your data. Please try again or email our Information Officer.'));
};
$('#delMy').onclick = () => {
  if (!confirm('Delete everything StudySense holds about you? This can\u2019t be undone.')) return;
  API.deleteMe().then(() => {
    try { localStorage.removeItem('ss'); } catch (e) { }
    Object.keys(S).forEach(k => delete S[k]);
    Object.assign(S, { n: 0, user: null, sub: false, hist: [], marks: [] });
    show('home'); toast('All done. Your data has been deleted.');
  }).catch(() => toast('We couldn\u2019t finish deleting. Please email our Information Officer and we\u2019ll do it for you.'));
};
$('#rqSend').onclick = () => {
  const type = $('#rqType').value, text = $('#rqText').value.trim(), em = $('#rqEm').value.trim();
  if (!/\S+@\S+\.\S+/.test(em)) { toast('Add your email so we can reply.'); return; }
  const body = 'Request: ' + type + '\nFrom: ' + em + '\n\n' + text + '\n\n(Sent from the StudySense "Your data" page, policy version ' + POLICY_VERSION + ')';
  if (API.base) { API.call('/v1/privacy/requests', { type, details: text, email: em }).then(() => toast('Request sent. We\u2019ll reply soon.')).catch(() => toast('We couldn\u2019t send that. Please try again.')); return; }
  location.href = 'mailto:' + COMPANY.officerEmail + '?subject=' + encodeURIComponent('POPIA request: ' + type) + '&body=' + encodeURIComponent(body);
};

/* ---------- storage notice ---------- */
let seen = false; try { seen = !!localStorage.getItem('ss-notice'); } catch (e) { }
if (!seen) $('#notice').style.display = 'flex';
$('#noticeOk').onclick = () => { $('#notice').style.display = 'none'; try { localStorage.setItem('ss-notice', '1'); } catch (e) { } };

/* ---------- small reminders where people upload ---------- */
$('#guest .chat').insertAdjacentHTML('afterend', '<p class="note" style="margin-top:10px">Only upload your own notes or material you may share, and leave out other people\u2019s personal details. <button class="lnk2" data-go="privacy">How we protect your data</button></p>');
