# Payments setup (Stripe + Firebase)

## Model
- **First watch**: free
- **Additional watches**: $6.99 CAD/month subscription

## Stripe setup

1. Create a [Stripe account](https://dashboard.stripe.com/register) if needed.

2. Create a Product and Price:
   - Stripe Dashboard → Products → Add product
   - Name: "Collector IQ" (or similar)
   - Add Price: **$6.99 CAD/month**, recurring
   - Copy the **Price ID** (e.g. `price_xxx`)

3. Get API keys:
   - Developers → API keys
   - Copy **Secret key** (starts with `sk_`; use `sk_test_` for testing)

4. Configure webhook:
   - Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (starts with `whsec_`)

## Firebase Admin

1. Firebase Console → Project settings → Service accounts
2. Generate new private key (JSON)
3. From the JSON, copy:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`  
     (In Vercel, paste the key and replace real newlines with `\n`)

## Vercel env vars

Add these in Vercel → Project → Settings → Environment variables:

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | `sk_...` (or `sk_test_...` for testing) |
| `STRIPE_PRICE_ID` | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `FIREBASE_PROJECT_ID` | From service account JSON |
| `FIREBASE_CLIENT_EMAIL` | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | From service account JSON |

## API routes

The following API routes are deployed with the frontend on Vercel:

- `POST /api/create-checkout-session` — Creates Stripe Checkout session (requires Firebase ID token)
- `POST /api/stripe-webhook` — Handles Stripe events, updates Firestore `users/{uid}`
- `POST /api/create-portal-session` — Creates Stripe Customer Portal for managing subscription
- `POST /api/upload-reading` — Uploads drift reading, recomputes aggregate with outlier removal (IQR) and median (requires Firebase ID token)

The `vercel.json` rewrite excludes `/api/*` so these routes are served correctly.

## Local testing

- Run `vercel dev` (not `npm run dev`) so the API routes work.
- Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe-webhook`
- Use test card `4242 4242 4242 4242` in Stripe test mode.
