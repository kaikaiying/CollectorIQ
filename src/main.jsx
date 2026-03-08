import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Analytics } from '@vercel/analytics/react'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './index.css'

if (Capacitor.getPlatform() === 'ios') {
  document.documentElement.classList.add('platform-ios')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
      <Analytics />
    </HelmetProvider>
  </React.StrictMode>
)
