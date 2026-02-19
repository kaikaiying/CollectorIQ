# Payments setup (Stripe + Firebase)

## Model
- **First watch**: free
- **Additional watches**: $5/month subscription

## Stripe setup

1. Create a [Stripe account](https://dashboard.stripe.com/register) if needed.

2. Create a Product and Price:
   - Stripe Dashboard → Products → Add product
   - Name: e.g. "CollectorIQ — Additional watches"
   - Price: $5/month, recurring
   - Copy the **Price ID** (e.g. `price_xxx`)

3. Get API keys:
   - Developers → API keys
   - Copy **Secret key** (starts with `sk_`)

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
| `STRIPE_SECRET_KEY` | `sk_...` |
| `STRIPE_PRICE_ID` | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `FIREBASE_PROJECT_ID` | From service account JSON |
| `FIREBASE_CLIENT_EMAIL` | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | From service account JSON |

## Local testing

- Run `vercel dev` to test API routes locally.
- Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe-webhook`
