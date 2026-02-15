/**
 * Official service / find-a-service URLs by brand (lowercase).
 * Add more as needed; in the future this could be dynamic (e.g. watchmaker listings).
 */
const OFFICIAL_SERVICE_URLS = {
  rolex: 'https://www.rolex.com/rolex-service',
  omega: 'https://www.omegawatches.com/customer-service',
  seiko: 'https://www.seikowatches.com/global-en/support',
  citizen: 'https://www.citizenwatch.com/support',
  tagheuer: 'https://www.tagheuer.com/service',
  tudor: 'https://www.tudorwatch.com/service',
  breitling: 'https://www.breitling.com/service',
  longines: 'https://www.longines.com/service',
  tissot: 'https://www.tissotwatches.com/service',
  grandseiko: 'https://www.grand-seiko.com/global-en/support',
  cartier: 'https://www.cartier.com/en-us/services/after-sales-service.html',
  iwc: 'https://www.iwc.com/en/customer-service.html',
  panerai: 'https://www.panerai.com/service',
  patekphilippe: 'https://www.patek.com/en/retail-service',
  audemarspiguet: 'https://www.audemarspiguet.com/service',
  jaegerlecoultre: 'https://www.jaeger-lecoultre.com/service',
  hublot: 'https://www.hublot.com/service',
}

export function getOfficialServiceUrl(brand) {
  if (!brand || typeof brand !== 'string') return null
  const key = brand.toLowerCase().replace(/\s+/g, '')
  return OFFICIAL_SERVICE_URLS[key] || null
}
