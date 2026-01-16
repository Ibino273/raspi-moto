import dotenv from 'dotenv';
dotenv.config();
import { chromium } from 'playwright';
import winston from 'winston';
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Inizializzazione Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configurazione Logger
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

/**
 * Gestione Banner Cookie
 */
async function handleCookieBanner(page) {
  try {
    // Selettore comune per Didomi (usato da Subito)
    const cookieButton = page.locator('#didomi-notice-agree-button');
    if (await cookieButton.isVisible({ timeout: 5000 })) {
      await cookieButton.click();
      logger.info("🍪 Banner cookie accettato.");
      // Aspetta un secondo che il banner scompaia graficamente
      await page.waitForTimeout(1000);
    }
  } catch (err) {
    // Spesso il banner non appare se i cookie sono già salvati nel contesto
    logger.info("ℹ️ Banner cookie non visualizzato.");
  }
}

async function runScraper() {
  let browser;
  const BASE_URL = config?.scraping?.baseUrl || 'https://www.subito.it/annunci-piemonte/vendita/moto-e-scooter/';
  const MAX_PAGES = 5;
  const MAX_LISTINGS = 50;

  let pageNumber = 1;
  let totalScraped = 0;

  try {
    logger.info("🚀 Avvio browser Chromium...");
    browser = await chromium.launch({
      headless: false, // Impostato a false per monitorare sulla Raspberry
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--start-maximized',
        '--force-device-scale-factor=0.8' // Zoom all'80%
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)]
    });

    const page = await context.newPage();

    while (pageNumber <= MAX_PAGES && totalScraped < MAX_LISTINGS) {
      const url = pageNumber === 1 ? BASE_URL : `${BASE_URL}?o=${pageNumber}`;
      logger.info(`🌐 Navigazione: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

      // Gestione cookie solo sulla prima pagina o se appare
      await handleCookieBanner(page);

      // Estrazione link annunci
      const links = await page.$$eval('article a', els => 
        els.map(el => el.href).filter(href => href.includes('.htm'))
      );
      
      const uniqueLinks = [...new Set(links)];
      logger.info(`Found ${uniqueLinks.length} annunci nella pagina ${pageNumber}`);

      for (const link of uniqueLinks) {
        if (totalScraped >= MAX_LISTINGS) break;

        const detailPage = await context.newPage();
        try {
          await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
          
          // Chiudi eventuali popup sovrapposti se necessario
          await handleCookieBanner(detailPage);

          const title = await detailPage.locator('h1').innerText().catch(() => null);
          const priceText = await detailPage.locator('p[class*="index-module_price"]').first().innerText().catch(() => null);
          const location = await detailPage.locator('p[class*="AdInfo_location"]').innerText().catch(() => null);

          if (title) {
            const price = priceText ? parseFloat(priceText.replace(/[^0-9]/g, '')) : null;
            
            const { error } = await supabase.from('moto_listings').upsert({
              titolo: title,
              prezzo: price,
              comune: location,
              link_annuncio: link,
              created_at: new Date().toISOString()
            }, { onConflict: 'link_annuncio' });

            if (error) logger.error(`❌ Errore Database: ${error.message}`);
            else logger.info(`✅ Salvato: ${title.substring(0, 30)}...`);
            
            totalScraped++;
          }
        } catch (err) {
          logger.error(`⚠️ Errore durante lo scraping del link ${link}: ${err.message}`);
        } finally {
          await detailPage.close();
        }

        await page.waitForTimeout(getRandomDelay(1500, 3000));
      }
      pageNumber++;
    }

    logger.info(`✨ Scraping completato. Totale annunci: ${totalScraped}`);

  } catch (err) {
    logger.error(`❌ Errore Critico: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

runScraper();
