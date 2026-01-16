import dotenv from 'dotenv';
dotenv.config();
import { chromium } from 'playwright';
import winston from 'winston';
import { config } from './config.js'; // Assicurati che config.js esporti con "export const config"
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
// Uso SUPABASE_KEY per coerenza con i tuoi file precedenti, o SUPABASE_API_KEY come nel tuo snippet
const SUPABASE_API_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_API_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/scraper.log' })
  ],
});

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

const getRandomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function parseSubitoDate(input) {
  const months = {
    gen: '01', feb: '02', mar: '03', apr: '04', mag: '05', giu: '06',
    lug: '07', ago: '08', set: '09', ott: '10', nov: '11', dic: '12'
  };
  const now = new Date();

  if (input?.toLowerCase().includes('oggi')) {
    const hourMatch = input.match(/(\d{2}:\d{2})/);
    if (!hourMatch) return null;
    const [hours, minutes] = hourMatch[1].split(':');
    now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return now.toISOString();
  }

  if (input?.toLowerCase().includes('ieri')) {
    const hourMatch = input.match(/(\d{2}:\d{2})/);
    if (!hourMatch) return null;
    now.setDate(now.getDate() - 1);
    const [hours, minutes] = hourMatch[1].split(':');
    now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return now.toISOString();
  }

  const match = input.match(/(\d{1,2}) (\w{3}) (?:all'|alle) (\d{2}:\d{2})/);
  if (!match) return null;
  const [_, day, monthAbbr, time] = match;
  const month = months[monthAbbr];
  if (!month) return null;
  const year = now.getFullYear();
  return `${year}-${month}-${day.padStart(2, '0')}T${time}:00`;
}

async function runScraper() {
  let browser;
  // Fallback se config non è caricato correttamente
  const BASE_URL = config?.scraping?.baseUrl || 'https://www.subito.it/annunci-piemonte/vendita/moto-e-scooter/';
  const MAX_PAGES_TO_SCRAPE = 5;
  const MAX_TOTAL_LISTINGS = 100;

  let pageNumber = 1;
  let totalListingsScraped = 0;
  let errorsEncountered = 0;

  try {
    // IMPOSTAZIONE: headless: false per vedere Chromium, zoom 0.8 come richiesto
    browser = await chromium.launch({ 
      headless: false, 
      executablePath: '/usr/bin/chromium-browser', 
      args: ['--start-maximized', '--force-device-scale-factor=0.8'] 
    });
    
    const context = await browser.newContext({ 
      viewport: null, 
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)] 
    });
    const page = await context.newPage();

    while (pageNumber <= MAX_PAGES_TO_SCRAPE && totalListingsScraped < MAX_TOTAL_LISTINGS) {
      const currentPageUrl = pageNumber === 1 ? BASE_URL : `${BASE_URL}?o=${pageNumber}`;
      logger.info(`🌐 Pagina ${pageNumber}: ${currentPageUrl}`);
      
      try {
        await page.goto(currentPageUrl, { waitUntil: 'networkidle', timeout: 60000 });
      } catch (err) {
        logger.error(`❌ Errore navigazione: ${err.message}`);
        pageNumber++;
        continue;
      }

      // Selettore aggiornato per i link
      const listingLinks = await page.$$eval('article[class*="index-module_card"] a', els => els.map(el => el.href));
      const uniqueLinks = [...new Set(listingLinks.filter(l => l.includes('.htm')))];

      for (const fullUrl of uniqueLinks) {
        if (totalListingsScraped >= MAX_TOTAL_LISTINGS) break;

        const detailPage = await context.newPage();
        try {
          await detailPage.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

          const getText = async (selector) => {
            try {
              return (await detailPage.locator(selector).first().innerText())?.trim();
            } catch { return null; }
          };

          const titolo = await getText('h1');
          const prezzoText = await getText('p[class*="index-module_price"]');
          const cleanedPrice = prezzoText?.replace(/[^0-9]/g, '');
          const prezzoParsed = cleanedPrice ? parseFloat(cleanedPrice) : null;
          
          const record = {
            titolo,
            prezzo: prezzoParsed,
            link_annuncio: fullUrl,
            created_at: new Date().toISOString(),
            // Aggiungi qui gli altri campi come marca, modello, ecc.
          };

          const { error } = await supabase.from('annunci_moto').upsert([record], { onConflict: 'link_annuncio' });
          if (error) logger.error(`❌ Supabase error: ${error.message}`);
          else logger.info(`✅ Salvato: ${titolo}`);

        } catch (err) {
          logger.error(`❌ Errore dettaglio: ${err.message}`);
        } finally {
          await detailPage.close();
        }
        totalListingsScraped++;
        await page.waitForTimeout(getRandomDelay(1000, 2000));
      }
      pageNumber++;
    }
  } catch (err) {
    logger.error(`❌ Errore critico: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

runScraper();
