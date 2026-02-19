# Subscription setup checklist

To enable subscriptions, complete these steps:

## 1. Stripe

1. **Create a Product** (Dashboard → Products → Add product)
   - Name: "Collector IQ" (or similar)
   - Add Price: **$6.99 CAD/month** recurring → copy Price ID → `STRIPE_PRICE_ID`

2. **Copy the Price ID** (starts with `price_`) and set in `.env`:
   ```
   STRIPE_PRICE_ID=price_xxxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_live_xxx   # or sk_test_xxx for testing
   ```

3. **Webhook** (Dashboard → Developers → Webhooks → Add endpoint)
   - URL: `https://your-domain.vercel.app/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the Signing secret → `STRIPE_WEBHOOK_SECRET=whsec_xxx`

## 2. Firebase Admin

From Firebase Console → Project Settings → Service accounts → Generate new private key:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (paste the `private_key` value; use `\n` for newlines in Vercel)

## 3. Vercel env vars

Set all of the above in Vercel → Project → Settings → Environment Variables.

## 4. Test the flow

1. Deploy to Vercel (API + frontend must be live)
2. Add one watch (free)
3. Click "Add another watch" → you should see the paywall
4. Click "Monthly" or "Annual" → Stripe Checkout should open
5. Use test card `4242 4242 4242 4242` if using Stripe test mode

## Troubleshooting

- **"STRIPE_PRICE_ID not set"** → Add the Price ID to env
- **"Opening checkout" then nothing** → Check browser console; API may be failing (wrong CORS or env)
- **Trial error from Stripe** → Set `STRIPE_TRIAL_DAYS=0` to disable
- **Subscription not updating** → Ensure webhook URL is correct and events are selected
- **Local dev** → Run `vercel dev` (not `npm run dev`) so the API routes work
