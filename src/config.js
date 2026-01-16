import dotenv from 'dotenv';
dotenv.config();

export const config = {
  browser: {
    headless: false,
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-maximized',
      '--force-device-scale-factor=0.8', 
      '--disable-infobars',
      '--window-position=0,0',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled'
    ]
  },
  logging: {
    file: 'logs/scraper.log',
    level: 'info'
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  scraping: {
    baseUrl: 'https://www.subito.it/annunci-piemonte/vendita/moto-e-scooter/',
    maxPages: 5,
    maxListingsPerPage: 30
  },
  userAgents: [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  ]
};

export const validateConfig = () => {
  if (!config.supabase.url || !config.supabase.key) {
    throw new Error('❌ Errore: SUPABASE_URL o SUPABASE_KEY non trovati nel file .env');
  }
};
