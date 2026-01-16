// scraper.js completo con logger, configurazione e tutti i dati estesi inclusi
require('dotenv').config();
const { chromium } = require('playwright');
const winston = require('winston');
const config = require('./config');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: config.LOG_FILE_PATH })
  ],
});

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  'Mozilla/5.0 (X11; Linux x86_64)...'
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
  const BASE_URL = config.BASE_URL;
  const MAX_PAGES_TO_SCRAPE = config.MAX_PAGES_TO_SCRAPE;
  const MAX_LISTINGS_PER_PAGE = config.MAX_LISTINGS_PER_PAGE_DEBUG;
  const MAX_TOTAL_LISTINGS = config.MAX_TOTAL_LISTINGS_DEBUG;

  let pageNumber = 1;
  let totalListingsScraped = 0;
  let errorsEncountered = 0;

  try {
    browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium-browser', args: ['--start-fullscreen'] });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, userAgent: userAgents[Math.floor(Math.random() * userAgents.length)] });
    const page = await context.newPage();

    while (pageNumber <= MAX_PAGES_TO_SCRAPE && totalListingsScraped < MAX_TOTAL_LISTINGS) {
      const currentPageUrl = pageNumber === 1 ? BASE_URL : `${BASE_URL}?o=${pageNumber}`;
      logger.info(`🌐 Navigazione alla pagina ${pageNumber}: ${currentPageUrl}`);
      try {
        await page.goto(currentPageUrl, { waitUntil: 'networkidle', timeout: 90000 });
      } catch (err) {
        logger.error(`❌ Errore navigazione: ${err.message}`);
        errorsEncountered++;
        pageNumber++;
        continue;
      }

      const listingLinks = await page.$$('div:nth-of-type(3) a.SmallCard-module_link__hOkzY');
      if (listingLinks.length === 0) break;

      for (const linkElement of listingLinks) {
        if (totalListingsScraped >= MAX_TOTAL_LISTINGS) break;
        const fullUrl = await linkElement?.getAttribute('href');
        if (!fullUrl) continue;

        const detailPage = await context.newPage();
        try {
          await detailPage.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

          const getText = async (selector) => (await (await detailPage.$(selector))?.textContent())?.trim();

          const titolo = await getText('h1');
          const descrizione = await getText('p.AdDescription_description__154FP');
          const dataText = await getText('span.index-module_insertion-date__MU4AZ');
          const data_pubblicazione = parseSubitoDate(dataText);
          const kilometriText = await getText('li:nth-of-type(6) span.feature-list_value__SZDpz');
          const kilometri = kilometriText ? parseInt(kilometriText.replace(/\D/g, '')) : null;
          const prezzoText = await getText('p.AdInfo_price__flXgp');
          const cleanedPrice = prezzoText?.replace(/€|\s/g, '').replace(/\./g, '').replace(',', '.');
          const prezzoParsed = cleanedPrice ? parseFloat(cleanedPrice) : null;
          const annoText = await getText('li:nth-of-type(7) span.feature-list_value__SZDpz');
          const anno = annoText ? parseInt(annoText.replace(/\D/g, '')) : null;
          const comune = await getText('p.AdInfo_locationText__rDhKP');
          const nome = await getText('.PrivateUserProfileBadge_small__lEJuK .headline-6 a');
          const cilindrataText = await getText('li:nth-of-type(4) span.feature-list_value__SZDpz');
          const cilindrata = cilindrataText ? parseInt(cilindrataText.replace(/\D/g, '')) : null;
          const likesText = await getText('span.Heart_counter-wrapper__number__Xltfo');

          const mainDataSection = await detailPage.$('section.main-data');
          const parsedFeatures = {};
          if (mainDataSection) {
            const featureItems = await mainDataSection.$$('li.feature-list_feature__gAyqB');
            for (const item of featureItems) {
              const label = (await (await item.$('span:first-child'))?.textContent())?.trim();
              const value = (await (await item.$('span.feature-list_value__SZDpz'))?.textContent())?.trim();
              if (label && value) parsedFeatures[label.toLowerCase().replace(/\s/g, '')] = value;
            }
          }

          const record = {
            titolo,
            descrizione,
            comune,
            nome_venditore: nome || null,
            cilindrata,
            marca: parsedFeatures.marca || null,
            modello: parsedFeatures.modello || null,
            prezzo: prezzoParsed || null,
            anno: parsedFeatures.immatricolazione
              ? parseInt(parsedFeatures.immatricolazione.replace(/\D/g, ''))
              : anno,
            km: parsedFeatures.km
              ? parseInt(parsedFeatures.km.replace(/\D/g, ''))
              : kilometri,
            likes: likesText ? parseInt(likesText.replace(/\D/g, '')) : null,
            data_pubblicazione,
            link_annuncio: fullUrl,
            created_at: new Date().toISOString(),
          };

          const { error } = await supabase.from('moto_listings').insert([record]);
          if (error) logger.error(`❌ Supabase insert error: ${error.message}`);

        } catch (err) {
          logger.error(`❌ Errore scraping dettaglio: ${err.message}`);
          errorsEncountered++;
        } finally {
          await detailPage.close();
        }
        totalListingsScraped++;
        await page.waitForTimeout(getRandomDelay(200, 800));
      }
      pageNumber++;
    }

    logger.info(`✅ Fine scraping. Totale: ${totalListingsScraped}, Errori: ${errorsEncountered}`);

  } catch (err) {
    logger.error(`❌ Errore critico: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

runScraper().catch(err => logger.error(`❌ Unhandled error: ${err.message}`));
