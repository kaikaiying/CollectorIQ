import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev server: absolute base avoids blank pages when `localhost` + HMR resolve oddly with `./`.
  // Production / Capacitor (`webDir: dist`): relative base so assets load from `file://` in the native app.
  base: command === 'serve' ? '/' : './',
  server: {
    port: 5173,
    // If 5173 is already taken (stale Vite), fail fast instead of silently jumping to 5174+ —
    // otherwise bookmarks to :5173 hit the wrong / dead server and the page looks blank.
    strictPort: true,
    host: true,
    open: '/#/',
  },
  // `npm run build && npm run preview` — production build in browser (port 4173 so it never fights dev).
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    open: '/#/',
  },
}))
