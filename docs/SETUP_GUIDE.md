# Collector IQ — Setup Guide

**Pricing:** First watch free. Add more watches for $6.99 CAD/month. Cancel anytime.

---

## 1. Web (Stripe)

### Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com) → Products → Add product
2. Name: **Collector IQ Pro**
3. Add price: **$6.99 CAD/month** recurring
4. Copy the **Price ID** (`price_xxx`)

### Environment variables (Vercel or your host)

```
STRIPE_SECRET_KEY=sk_test_xxx   # or sk_live_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_TRIAL_DAYS=0
```

### Webhook

- URL: `https://your-domain.com/api/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### Firebase Admin (for webhook)

From Firebase Console → Project Settings → Service accounts → Generate new private key:

```
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
```

### API base URL (for Capacitor / iOS)

If your app calls the API from a different origin (e.g. Capacitor):

```
VITE_API_URL=https://your-domain.com
```

---

## 2. iOS (Apple In-App Purchase)

### App Store Connect

1. Your app → In-App Purchases → Create
2. Type: **Auto-Renewable Subscription**
3. Product ID: `collectoriq_pro_monthly` (or update `src/lib/purchases.js`)
4. Price: $6.99 CAD/month
5. Add to a Subscription Group

### Xcode

1. Open: `npx cap open ios`
2. App target → Signing & Capabilities → **+ Capability** → **In-App Purchase**

### Product ID

Default is `collectoriq_pro_monthly`. To change it, edit `src/lib/purchases.js`:

```js
const SUBSCRIPTION_PRODUCT_ID = 'your_product_id'
```

### Testing

- App Store Connect → Users and Access → Sandbox → Create sandbox tester
- On device: sign out of App Store (or use a test device)
- Run app → Add second watch → Subscribe → use sandbox credentials

---

## 3. Flow summary

| Step | User action |
|------|-------------|
| 1 | Sign in |
| 2 | Add first watch (free, no card) |
| 3 | Add second watch → paywall |
| 4 | Subscribe ($6.99/mo) — Stripe on web, Apple IAP on iOS |
| 5 | Add unlimited watches |

---

## 4. Price display

The price is set in `src/lib/subscription.js`:

```js
export const SUBSCRIPTION_PRICE_MONTHLY = 6.99
export const SUBSCRIPTION_CURRENCY = 'CAD'
export const SUBSCRIPTION_PRICE_DISPLAY = '$6.99 CAD/mo'
```

Change these if you update your pricing.
