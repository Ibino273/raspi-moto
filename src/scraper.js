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

function parseSubitoDate(input) {
  const months = {
    gen: '01', feb: '02', mar: '03', apr: '04', mag: '05', giu: '06',
    lug: '07', ago: '08', set: '09', ott: '10', nov: '11', dic: '12'
  };
  const now = new Date();
  if (!input) return null;

  if (input.toLowerCase().includes('oggi')) {
    const hourMatch = input.match(/(\d{2}:\d{2})/);
    if (!hourMatch) return now.toISOString();
    const [h, m] = hourMatch[1].split(':');
    now.setHours(parseInt(h), parseInt(m), 0, 0);
    return now.toISOString();
  }

  if (input.toLowerCase().includes('ieri')) {
    const hourMatch = input.match(/(\d{2}:\d{2})/);
    now.setDate(now.getDate() - 1);
    if (!hourMatch) return now.toISOString();
    const [h, m] = hourMatch[1].split(':');
    now.setHours(parseInt(h), parseInt(m), 0, 0);
    return now.toISOString();
  }

  const match = input.match(/(\d{1,2}) (\w{3}) (?:all'|alle) (\d{2}:\d{2})/);
  if (!match) return null;
  const [_, day, monthAbbr, time] = match;
  const month = months[monthAbbr];
  if (!month) return null;
  return `${now.getFullYear()}-${month}-${day.padStart(2, '0')}T${time}:00`;
}

async function handleCookieBanner(page) {
  try {
    const cookieButton = page.locator('#didomi-notice-agree-button');
    if (await cookieButton.isVisible({ timeout: 3000 })) {
      await cookieButton.click();
      logger.info("🍪 Cookie accettati.");
      await page.waitForTimeout(1000);
    }
  } catch (err) { }
}

async function runScraper() {
  let browser;
  const BASE_URL = config?.scraping?.baseUrl || 'https://www.subito.it/annunci-piemonte/vendita/moto-e-scooter/';
  const MAX_PAGES = config?.scraping?.maxPages || 3;

  try {
    logger.info("🚀 Avvio scraper...");
    browser = await chromium.launch({
      headless: false,
      executablePath: '/usr/bin/chromium-browser',
      args: ['--start-maximized', '--force-device-scale-factor=0.8']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: userAgents[0]
    });

    const page = await context.newPage();

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const url = pageNum === 1 ? BASE_URL : `${BASE_URL}?o=${pageNum}`;
      logger.info(`🌐 Pagina ${pageNum}: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await handleCookieBanner(page);

      const links = await page.$$eval('article a', els => 
        els.map(el => el.href).filter(href => href.includes('.htm'))
      );
      const uniqueLinks = [...new Set(links)];

      for (const link of uniqueLinks) {
        const detailPage = await context.newPage();
        try {
          await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
          
          const title = await detailPage.locator('h1').innerText().catch(() => '');
          const priceText = await detailPage.locator('p[class*="index-module_price"]').first().innerText().catch(() => '');
          const desc = await detailPage.locator('p[class*="AdDescription_description"]').innerText().catch(() => '');
          const dateText = await detailPage.locator('span[class*="index-module_insertion-date"]').innerText().catch(() => '');
          const loc = await detailPage.locator('p[class*="AdInfo_location"]').innerText().catch(() => '');

          // Estrazione caratteristiche tecniche
          const features = {};
          const items = await detailPage.locator('li[class*="feature-list_feature"]').all();
          for (const item of items) {
            const label = await item.locator('span').first().innerText().catch(() => '');
            const value = await item.locator('span.feature-list_value__SZDpz').innerText().catch(() => '');
            if (label && value) features[label.toLowerCase().replace(/\s/g, '')] = value;
          }

          const record = {
            titolo: title,
            descrizione: desc,
            prezzo: priceText ? parseFloat(priceText.replace(/[^0-9]/g, '')) : null,
            citta: loc, // Aggiornato da 'comune' a 'citta' per corrispondere allo schema Supabase
            marca: features.marca || null,
            modello: features.modello || null,
            cilindrata: features.cilindrata ? parseInt(features.cilindrata.replace(/\D/g, '')) : null,
            km: features.km ? parseInt(features.km.replace(/\D/g, '')) : null,
            anno: features.immatricolazione ? parseInt(features.immatricolazione.replace(/\D/g, '')) : null,
            link_annuncio: link,
            data_pubblicazione: parseSubitoDate(dateText),
            created_at: new Date().toISOString()
          };

          const { error } = await supabase.from('moto_listings').upsert(record, { onConflict: 'link_annuncio' });

          if (error) {
             logger.error(`❌ Errore DB: ${error.message}`);
          } else {
             logger.info(`✅ Salvato: ${title.substring(0, 25)}...`);
          }

        } catch (err) {
          logger.error(`⚠️ Errore link: ${err.message}`);
        } finally {
          await detailPage.close();
        }
        await page.waitForTimeout(getRandomDelay(1000, 2000));
      }
    }
  } catch (err) {
    logger.error(`❌ Critico: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

runScraper();
