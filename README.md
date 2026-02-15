# Collector IQ (Web)

Watch accuracy tracker — add your watches, measure drift against server time, see how you compare to manufacturer specs.

## How to see the app in your browser

1. **Install dependencies** (one time):
   ```bash
   cd "App Development/CollectorIQ"
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Open the URL** that appears in the terminal, e.g.:
   - **http://localhost:5173**
   - Or the one Vite prints (might be different port)

4. Use the app in the browser: log in (any name), add watches, run drift tests, check Discovery and Settings.

To stop the server: press `Ctrl+C` in the terminal.

## What’s in the app

- **Login** — Enter your name (stored in the browser only).
- **Collection** — Add watches (brand / model / reference from the built-in list), tap one for the detail dashboard.
- **Drift test** — Pick a watch, set the time your watch shows, tap when it matches the on-screen time. The app uses server time at tap to compute drift.
- **Watch detail** — Spec compliance, average drift, history, and a “Consider service” hint if you’re often out of spec.
- **Discovery** — See which brands have the tightest accuracy specs.
- **Settings** — Signed-in name and sign out.

Data is stored only in your browser (localStorage). No backend yet. Later you can move this flow to Swift and plug in a real API.
