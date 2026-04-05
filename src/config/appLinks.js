/** Public links — set VITE_APP_STORE_REVIEW_URL in .env for App Store “write a review”. */
export const WEBSITE_URL = 'https://collectoriq.app'

export const SUPPORT_EMAIL = 'support@collectoriq.app'

/** Full URL, e.g. https://apps.apple.com/app/id123456789?action=write-review */
export const APP_STORE_REVIEW_URL = import.meta.env.VITE_APP_STORE_REVIEW_URL || ''
