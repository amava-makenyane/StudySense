# Setting up payments (PayPal): step by step

StudySense takes **debit or credit cards** and **PayPal** through PayPal's checkout. Pick your path below.
Edit `config.js` (the `PAYPAL` block) when you have the details.

## Path A: automatic (recommended): PayPal Client ID
The user pays, PayPal tells the page it worked, and the user lands on their profile with the account unlocked.

1. **Open a PayPal Business account** at paypal.com/business. Confirm your email, add your business details and link your bank account.
   PayPal's rules for receiving money and withdrawing to a bank differ by country (check this for South Africa on paypal.com/za or with PayPal support before you rely on it).
2. **Get your Client ID.** Go to developer.paypal.com and log in. Open **Apps & Credentials**, switch to **Sandbox**, press **Create App**, and copy the **Client ID**.
   Never put the **Secret** in the website. It belongs on your server only.
3. **Test with fake money.** In the same site open **Testing Tools, then Sandbox Accounts**. Use the "Personal" sandbox account to pay as a buyer. Paste the sandbox Client ID into `PAYPAL.clientId` and try a payment.
4. **Go live.** In **Apps & Credentials**, switch to **Live**, create an app, copy the live Client ID and replace the sandbox one.
5. **Cards.** The card button appears when PayPal allows guest card payments for your account and the customer's country. If it doesn't appear, check your PayPal Business settings for accepting cards, or ask PayPal support.
6. **Currencies.** The site charges in the customer's own currency when PayPal supports it (for example USD, EUR, GBP, AUD, CAD) and in US dollars when it doesn't (for example rand). Check your PayPal account is set to accept those currencies.

## Path B: simple pay link (no Client ID yet): PayPal.Me
1. Open **https://www.paypal.com/paypalme/my/profile** and create your PayPal.Me name (for example `StudySense`). Your link becomes `paypal.me/StudySense`.
2. Put the name in `PAYPAL.meUser` in `config.js`.
3. The checkout page then shows a button that opens PayPal with the exact amount filled in, for example `paypal.me/StudySense/10USD`. The customer can pay by PayPal or by card on that page.
4. **Limit:** PayPal.Me can't tell the website a payment happened. After paying, the user presses "I have paid" and the account shows **Payment pending** until you confirm it by hand. Use Path A for automatic unlocking.

## Path C: demo
With neither set, the page shows a demo button so you can try the whole flow without money.

## Confirm payments on your server (do this before launch)
A payment confirmed only in the browser can be faked. Your backend must check it:
1. Build `POST /v1/billing/paypal/confirm` (the page already calls it when `API.base` is set).
2. Get an access token from PayPal using your Client ID and **Secret** (server only).
3. Call PayPal's Orders API to read the order. Check that its status is completed, that the amount and currency match what you expect for that user's country and role, and that you haven't used this order id before.
4. Only then mark the account paid and return success.
5. Also listen to PayPal **webhooks** (for example `PAYMENT.CAPTURE.COMPLETED`) so you hear about refunds and disputes.

## Automatic monthly billing (optional)
By default one payment buys one month, then the user pays again. For automatic renewals:
1. In PayPal, create a **product** and then a monthly **plan** for each currency and role (a plan has one currency).
2. Put the plan ids in `PAYPAL.subscriptionPlans`, for example `{ USD: { student: 'P-AAA', teacher: 'P-BBB' } }`, and set `PAYPAL.mode = 'subscription'`.
3. Use webhooks (`BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `PAYMENT.SALE.COMPLETED`) to keep accounts in step.

## Before you go live
- [ ] Live Client ID in `config.js`, and the server check above working
- [ ] One real payment tested and refunded
- [ ] Terms, refund policy and privacy policy ready (PayPal is named in the privacy policy as a payment provider)
- [ ] Prices checked in `pricing.js`: R50 and R80 in South Africa, US$10 and US$15 elsewhere
- [ ] A lawyer or accountant has checked VAT and consumer-law points for the countries you sell in
