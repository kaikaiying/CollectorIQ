# Apple In-App Purchase — Step-by-Step

Product ID in app: `com.collectoriq.monthly` ($6.99 CAD/month, adjusted for other countries; no trial)

---

## Part 1: App Store Connect

### 1.1 Create Subscription Group (if you don't have one)

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps** → your Collector IQ app
3. **Subscriptions** (left sidebar) → **Subscription Groups**
4. Click **+** to create a group
5. Reference name: `Collector IQ Pro`
6. Save

### 1.2 Create the Subscription Product

1. In **Subscriptions** → click your subscription group (or create one first)
2. Click **+** to add a subscription
3. **Reference name**: `Collector IQ Pro Monthly`
4. **Product ID**: `com.collectoriq.monthly` ← must match exactly
5. Click **Create**

### 1.3 Add a Price

1. Under the subscription, click **Subscription Prices**
2. Click **+** to add a price
3. **Price**: $6.99 CAD (Apple adjusts for other countries)
4. **Billing period**: 1 month
5. Save

### 1.4 Add Localization (required)

1. Under the subscription → **App Store Localization**
2. Add at least one language (e.g. English)
3. **Subscription display name**: `Collector IQ Pro`
4. **Description**: e.g. `Add unlimited watches to your collection`

---

## Part 2: Xcode

### 2.1 Add In-App Purchase Capability

1. Open the project:
   ```bash
   npx cap open ios
   ```
2. Select the **App** target (left sidebar)
3. Open **Signing & Capabilities** tab
4. Click **+ Capability**
5. Search for **In-App Purchase**
6. Double-click to add it

### 2.2 Build and Run

1. Select your device or simulator
2. **Product** → **Build** (⌘B)
3. **Product** → **Run** (⌘R)

---

## Part 3: Sandbox Testing

### 3.1 Create Sandbox Tester

1. App Store Connect → **Users and Access** → **Sandbox** tab
2. **Testers** → **+** to add
3. Create a test Apple ID (e.g. `test@yourdomain.com`)
4. Use a unique email — it doesn't need to be real

### 3.2 Test on Device

1. On your iPhone: **Settings** → **App Store** → sign out of your real Apple ID
2. Run the app from Xcode on the device
3. Add first watch (free)
4. Tap **Add another watch** → paywall appears
5. Tap **Subscribe** → Apple payment sheet
6. When asked for Apple ID, sign in with your **sandbox** tester
7. Complete the purchase (sandbox = no real charge)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "No products available" | Wait 15–30 min after creating in App Store Connect. Ensure Product ID is exactly `com.collectoriq.monthly` |
| "The string did not match expected pattern" | Product not in App Store Connect yet, or Product ID typo. Create the subscription (Part 1 above), wait 15–30 min, rebuild. Apple Pay sheet won’t show until the product exists. |
| "Cannot connect to iTunes Store" | Use a real device; simulator can be flaky. Check sandbox sign-in |
| Capability missing | Clean build (⇧⌘K), rebuild |
| Different product ID | Edit `src/lib/purchases.js` → `SUBSCRIPTION_PRODUCT_ID` |
