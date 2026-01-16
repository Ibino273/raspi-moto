import { chromium } from 'playwright';
import { config, validateConfig } from './config.js';
import logger from './logger.js';
import SupabaseService from './supabase.js';
import SubitoParser from './parser.js';
import { randomDelay, validateListing } from './utils.js';

class MotoScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.mainPage = null;
    this.db = new SupabaseService();
    this.parser = new SubitoParser();
    this.stats = { inserted: 0, updated: 0 };
  }

  async initBrowser() {
    this.browser = await chromium.launch(config.browser);
    this.context = await this.browser.newContext({ viewport: null, userAgent: config.userAgents[0] });
    this.mainPage = await this.context.newPage();
    await this.mainPage.goto(config.scraping.baseUrl, { waitUntil: 'networkidle' });
    await this.parser.handleCookieBanner(this.mainPage);
  }

  async run() {
    try {
      validateConfig();
      await this.db.testConnection();
      await this.initBrowser();

      for (let p = 1; p <= config.scraping.maxPages; p++) {
        const url = p === 1 ? config.scraping.baseUrl : `${config.scraping.baseUrl}?o=${p}`;
        logger.info(`📄 Pagina ${p}`);
        await this.mainPage.goto(url, { waitUntil: 'domcontentloaded' });
        
        const links = await this.parser.extractListingLinks(this.mainPage);
        const chunkSize = 3;
        for (let i = 0; i < links.length; i += chunkSize) {
          const batch = links.slice(i, i + chunkSize);
          const results = await Promise.all(batch.map(link => this.scrapeTab(link)));
          const valid = results.filter(l => l !== null);
          if (valid.length > 0) {
            const res = await this.db.upsertListingsBatch(valid);
            this.stats.inserted += res.inserted;
            valid.forEach(l => logger.info(`✅ Inserito: ${l.titolo}`));
          }
          await randomDelay(1000, 2000);
        }
      }
    } catch (e) { logger.error(e.message); }
    finally { if (this.browser) await this.browser.close(); }
  }

  async scrapeTab(url) {
    const tab = await this.context.newPage();
    try {
      await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const data = await this.parser.extractListingDetails(tab, url);
      await tab.close();
      return data ? validateListing(data) : null;
    } catch (e) { if (!tab.isClosed()) await tab.close(); return null; }
  }
}

new MotoScraper().run();
