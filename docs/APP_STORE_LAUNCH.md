# App Store launch — Apple subscriptions first

Focus checklist for launching Collector IQ on the App Store with Apple In-App subscriptions.

---

## 1. App Store Connect — Subscription

### Create subscription (required before submission)

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → Collector IQ
2. **Subscriptions** (left sidebar) → **Subscription Groups** → **+**
3. Reference name: `Collector IQ Pro` → Save
4. Click the group → **+** to add subscription
5. **Reference name:** Collector IQ Pro Monthly
6. **Product ID:** `com.collectoriq.monthly` ← must match exactly (see `src/lib/purchases.js`)
7. **Subscription Prices** → **+** → $6.99 CAD, 1 month
8. **App Store Localization** → Add English:
   - Display name: `Collector IQ Pro`
   - Description: `Add unlimited watches to your collection`
9. **Wait 15–30 minutes** for Apple to propagate the product

---

## 2. Xcode — In-App Purchase

1. `npx cap open ios`
2. Select **App** target → **Signing & Capabilities**
3. **+ Capability** → search **In-App Purchase** → add
4. Clean build (⇧⌘K) → Build (⌘B)

---

## 3. Sandbox testing (before submit)

1. **App Store Connect** → **Users and Access** → **Sandbox** → **Testers** → **+**
2. Create sandbox Apple ID (e.g. `test@yourdomain.com`)
3. On iPhone: **Settings** → **App Store** → sign out of real Apple ID
4. Run app from Xcode on device:
   - Add first watch (free)
   - Add second watch → paywall
   - Subscribe → use sandbox Apple ID when prompted
   - Verify "Restore Purchases" works

---

## 4. App Store metadata

| Field | Value |
|-------|-------|
| Price | Free (with in-app purchases) |
| Privacy Policy URL | `https://collectoriq.app/privacy` (or your domain) |
| Support URL | `https://collectoriq.app` or `mailto:support@collectoriq.app` |
| Category | Utilities |
| Age rating | Complete questionnaire (typically 4+) |

---

## 5. Archive & submit

1. `npm run build && npx cap sync ios`
2. Xcode → **Product** → **Archive** (use "Any iOS Device" or real device)
3. **Distribute App** → **App Store Connect** → **Upload**
4. In App Store Connect: select build, add screenshots, submit for review

---

## Product ID reference

| Item | Value |
|------|-------|
| Product ID | `com.collectoriq.monthly` |
| Bundle ID | `app.collectoriq` |
| Price | $6.99 CAD/month |

To change Product ID: edit `SUBSCRIPTION_PRODUCT_ID` in `src/lib/purchases.js`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "No products available" | Wait 15–30 min after creating in App Store Connect |
| "String did not match pattern" | Product ID typo or product not created yet |
| Apple Pay sheet doesn't show | Product must exist in App Store Connect first |
| Use real device | Simulator can be flaky for IAP |
