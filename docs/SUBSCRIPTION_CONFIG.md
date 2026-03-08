# Subscription configuration checklist

Use this checklist to get Stripe subscriptions working for the web app.

---

## 1. Stripe Dashboard

### Product & price (if not done)
- [ ] [Stripe Dashboard](https://dashboard.stripe.com) → **Products** → **Add product**
- [ ] Name: **Collector IQ**
- [ ] Add price: **$6.99 CAD/month**, recurring
- [ ] Copy the **Price ID** (`price_xxx`) → set as `STRIPE_PRICE_ID`

### API keys
- [ ] **Developers** → **API keys**
- [ ] Copy **Secret key** (`sk_test_...` for testing, `sk_live_...` for production)
- [ ] Set as `STRIPE_SECRET_KEY`

### Webhook
- [ ] **Developers** → **Webhooks** (or **Destinations**) → **Add endpoint**
- [ ] **Endpoint URL:** `https://YOUR-DOMAIN.vercel.app/api/stripe-webhook`
  - Replace `YOUR-DOMAIN` with your Vercel project URL (e.g. `collectoriq` → `https://collectoriq.vercel.app/api/stripe-webhook`)
- [ ] **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Copy the **Signing secret** (`whsec_xxx`) → set as `STRIPE_WEBHOOK_SECRET`

---

## 2. Firebase Admin (service account)

The API needs Firebase Admin to verify auth tokens and write subscription status from the webhook.

- [ ] [Firebase Console](https://console.firebase.google.com) → your project (**chronospec-2a2e7**)
- [ ] **Project settings** (gear) → **Service accounts**
- [ ] **Generate new private key** → download JSON
- [ ] From the JSON, copy:
  - `project_id` → `FIREBASE_PROJECT_ID`
  - `client_email` → `FIREBASE_CLIENT_EMAIL`
  - `private_key` → `FIREBASE_PRIVATE_KEY`  
    (In Vercel, paste the full key and replace real newlines with `\n`)

---

## 3. Environment variables

### Local (.env) — for `vercel dev`

Add to your `.env`:

```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FIREBASE_PROJECT_ID=chronospec-2a2e7
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@chronospec-2a2e7.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Vercel (production)

- [ ] Vercel → your project → **Settings** → **Environment variables**
- [ ] Add the same 6 variables (Production, Preview, Development as needed)

---

## 4. Test locally

```bash
# Terminal 1: run app with API routes
vercel dev

# Terminal 2: forward Stripe webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Stripe CLI will output a **webhook signing secret** — use that for `STRIPE_WEBHOOK_SECRET` when testing locally (it's different from the one in Stripe Dashboard).

Test flow:
1. Sign in
2. Add first watch (free)
3. Add second watch → paywall
4. Subscribe → Stripe Checkout
5. Use test card `4242 4242 4242 4242`

---

## 5. Current status

| Variable | Status |
|----------|--------|
| STRIPE_PRICE_ID | ✓ In .env |
| STRIPE_SECRET_KEY | Add to .env + Vercel |
| STRIPE_WEBHOOK_SECRET | Add to .env + Vercel |
| FIREBASE_PROJECT_ID | Add to .env + Vercel |
| FIREBASE_CLIENT_EMAIL | Add to .env + Vercel |
| FIREBASE_PRIVATE_KEY | Add to .env + Vercel |
