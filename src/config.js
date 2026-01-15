import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    tableName: 'moto_listings'
  },

  // Scraping
  scraping: {
    baseUrl: 'https://www.subito.it/annunci-italia/vendita/moto/',
    maxPages: parseInt(process.env.MAX_PAGES || '5', 10),
    maxListingsPerPage: parseInt(process.env.MAX_LISTINGS_PER_PAGE || '30', 10),
    timeout: 90000,
    retries: 3,
    retryDelay: 2000
  },

  // Browser
  browser: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    viewport: { width: 1920, height: 1080 }
  },

  // User Agents
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ],

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: 'logs/scraper.log'
  }
};

// Validazione configurazione
export function validateConfig() {
  const errors = [];

  if (!config.supabase.url) {
    errors.push('SUPABASE_URL non configurata');
  }
  if (!config.supabase.serviceKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY non configurata');
  }

  if (errors.length > 0) {
    throw new Error(`Errori di configurazione:\n${errors.join('\n')}`);
  }

  return true;
}
