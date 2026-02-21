# App Store Connect — Submission Guide

Checklist to get Collector IQ ready for production submission.

---

## Pre-submission checklist

### 1. App configuration (already set)

| Item | Value |
|------|-------|
| Bundle ID | `app.collectoriq` |
| Display name | Collector IQ |
| Version | 1.0 (1) |
| iOS deployment target | 15.0 |
| Sign in with Apple | ✓ (in entitlements) |
| StoreKit / In-App Purchase | ✓ (framework linked) |

### 2. Before you submit

- [ ] **Build for release** — `npm run build` then `npx cap sync ios`
- [ ] **Archive in Xcode** — Product → Archive (use a real device or "Any iOS Device")
- [ ] **In-App Purchase capability** — Xcode → App target → Signing & Capabilities → + Capability → In-App Purchase
- [ ] **Subscription in App Store Connect** — Create `collectoriq_pro_monthly` (see APPLE_IAP_SETUP.md)

---

## App Store Connect setup

### Step 1: Create the app (if not done)

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**
2. **Platforms:** iOS
3. **Name:** Collector IQ
4. **Primary language:** English (U.S.)
5. **Bundle ID:** Select `app.collectoriq` (must exist in Developer Portal)
6. **SKU:** e.g. `collectoriq-ios-001` (internal, never shown to users)
7. **User Access:** Full Access

---

### Step 2: App information

**General → App Information**

| Field | Value |
|-------|-------|
| Privacy Policy URL | `https://collectoriq.app/privacy` |
| Category | Primary: **Utilities** (or Lifestyle) |
| Content Rights | Check if you have rights to all content |
| Age Rating | Complete questionnaire (likely 4+) |

**Age rating** — Answer the questionnaire. For Collector IQ (no violence, no gambling, no unrestricted web):
- Typically results in **4+** or **12+** depending on account/social features.

---

### Step 3: Pricing and availability

- **Price:** Free (with in-app purchases)
- **Availability:** Select countries/regions
- **Pre-order:** No (unless you want a pre-order)

---

### Step 4: In-app purchases

Create the subscription **before** submitting (required for review):

1. **Subscriptions** → **Subscription Groups** → **+** → Name: `Collector IQ Pro`
2. **+** to add subscription:
   - **Reference name:** Collector IQ Pro Monthly
   - **Product ID:** `collectoriq_pro_monthly`
   - **Price:** $6.99 CAD/month
   - **Localization:** At least English (display name, description)
3. Wait 15–30 min for propagation

---

### Step 5: App privacy (required)

**App Privacy** → **Get started** or **Edit**

Apple asks what data you collect. For Collector IQ:

| Data type | Collected? | Purpose |
|-----------|------------|---------|
| Contact info (email) | Yes | Account, sign-in (Firebase Auth) |
| User ID | Yes | Account, sync (Firebase) |
| Product interaction | Yes | Subscription status |
| Diagnostics | Optional | Crash/performance (if you use Firebase Crashlytics) |

- **Sign-in:** Email from Firebase Auth (Apple, Google)
- **Data linked to user:** Yes (account, collection, readings)
- **Data used for tracking:** No (unless you use analytics for ads)

Be accurate — this appears on your App Store listing.

---

### Step 6: Version information (for 1.0)

**App Store** tab → **iOS App** → **Prepare for Submission** (or + Version)

**Screenshots (required)**

- **6.7" (iPhone 15 Pro Max):** 1290 × 2796 px — at least 3
- **6.5" (iPhone 14 Plus):** 1284 × 2778 px — at least 3
- **5.5" (iPhone 8 Plus):** 1242 × 2208 px — at least 3

Or use one size; Apple can scale, but quality may suffer.

**Promotional text (optional, 170 chars)**  
e.g. *Track your watch accuracy. Drift test vs atomic clock. First watch free.*

**Description (required, 4000 chars max)**  
e.g.:

> Collector IQ helps watch enthusiasts track and analyze the accuracy of their timepieces.
>
> • First watch free — no card required  
> • Drift test against atomic clock time  
> • Compare to manufacturer specs (COSC, s/day)  
> • Add unlimited watches with Collector IQ Pro ($6.99/month, renews until cancelled)  
> • Export your data anytime  
>
> Sign in with Apple or Google. Cancel anytime.

**Keywords (100 chars max, comma-separated)**  
e.g. `watch accuracy,drift test,atomic clock,COSC,chronometer,mechanical watch`

**Support URL (required)**  
`https://collectoriq.app` or `mailto:support@collectoriq.app`

**Marketing URL (optional)**  
`https://collectoriq.app`

**Version:** 1.0

**Copyright:** e.g. `2025 Your Name` or `2025 Collector IQ`

**What's new:** e.g. *Initial release. Track watch accuracy with drift tests and compare to manufacturer specs.*

---

### Step 7: Build

1. In Xcode: **Product** → **Archive**
2. When archive completes: **Distribute App** → **App Store Connect** → **Upload**
3. In App Store Connect, the build appears under the version (can take 5–30 min)
4. Select the build for the version

---

### Step 8: Review information

**App Review Information**

| Field | Value |
|-------|-------|
| Contact email | support@collectoriq.app (or your email) |
| Contact phone | Your number (for urgent review issues) |
| Demo account | Optional — provide test Apple ID + password if login is required |
| Notes | e.g. "First watch is free. Subscription required for additional watches. Use sandbox account to test IAP." |

**Version release**

- **Manually release** — You release after approval
- **Automatically release** — Apple releases as soon as approved

---

### Step 9: Submit for review

1. Complete all required fields (red warnings must be fixed)
2. Click **Add for Review** → **Submit to App Review**
3. Typical review time: 24–48 hours

---

## Production readiness checklist

| Item | Status |
|------|--------|
| Bundle ID `app.collectoriq` in Developer Portal | ✓ |
| App record in App Store Connect | ? |
| Subscription `collectoriq_pro_monthly` created | ? |
| In-App Purchase capability in Xcode | ? |
| Privacy policy at collectoriq.app/privacy | ✓ |
| App icons (AppIcon in Assets.xcassets) | ? |
| Screenshots for required sizes | ? |
| Privacy nutrition labels completed | ? |
| Firebase production config (not debug) | ? |
| Stripe live keys (if web uses same backend) | ? |

---

## Common rejection reasons

1. **Incomplete metadata** — Screenshots, description, privacy policy, support URL
2. **Crashes** — Test on a real device before submitting
3. **Broken IAP** — Subscription must exist and work in sandbox
4. **Privacy mismatch** — App Privacy must match actual data use
5. **Guideline 4.2 (minimum functionality)** — Ensure the app clearly provides value
6. **Guideline 2.1 (app completeness)** — No placeholder content, all features working

---

## After approval

- Monitor **App Store Connect** for crash reports and ratings
- Use **TestFlight** for beta testers before public release
- Keep **Version release** as Manual until you're ready to go live
