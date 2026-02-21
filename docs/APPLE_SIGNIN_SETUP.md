# Apple Sign In – Fix in 2 Steps

## Step 1: Xcode (required)

1. Open the project in Xcode: `npx cap open ios`
2. Select the **App** target in the left sidebar
3. Open the **Signing & Capabilities** tab
4. Click **+ Capability**
5. Add **Sign in with Apple**
6. Build and run

## Step 2: Firebase Console (required)

1. Go to [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → **Sign-in method**
2. Enable **Apple**
3. Add your **Services ID** (from Apple Developer → Identifiers → Services IDs)
4. Add **Team ID**, **Key ID**, and **Private Key** (.p8) from [Apple Developer → Keys](https://developer.apple.com/account/resources/authkeys/list)

## Apple Developer (if needed)

If your App ID (`app.collectoriq.web`) doesn’t exist yet:

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles** → **Identifiers**
2. Create an App ID with bundle ID `app.collectoriq.web`
3. Enable **Sign in with Apple**
4. Create a Services ID and Key for Firebase (see Firebase’s Apple setup instructions)
