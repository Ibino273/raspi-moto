import { chromium } from 'playwright';
import { config, validateConfig } from './config.js';
import logger from './logger.js';
import SupabaseService from './supabase.js';
import SubitoParser from './parser.js';
import { buildFullUrl, randomDelay, withRetry, validateListing } from './utils.js';

class MotoScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.db = new SupabaseService();
    this.parser = new SubitoParser();
    this.stats = {
      pagesScraped: 0,
      listingsFound: 0,
      listingsProcessed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Inizializza il browser
   */
  async initBrowser() {
    logger.info('🚀 Inizializzazione browser...');
    
    this.browser = await chromium.launch({
      headless: config.browser.headless,
      executablePath: '/usr/bin/chromium-browser',
      args: config.browser.args
    });

    const randomUserAgent = config.userAgents[
      Math.floor(Math.random() * config.userAgents.length)
    ];

    this.context = await this.browser.newContext({
      viewport: config.browser.viewport,
      userAgent: randomUserAgent
    });

    logger.info('✅ Browser inizializzato');
  }

  /**
   * Chiude il browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      logger.info('🔒 Browser chiuso');
    }
  }

  /**
   * Scrapa una singola pagina di listing
   */
  async scrapePage(pageNumber) {
    const page = await this.context.newPage();
    
    try {
      const url = pageNumber === 1 
        ? config.scraping.baseUrl 
        : `${config.scraping.baseUrl}?o=${pageNumber}`;

      logger.info(`📄 Caricamento pagina ${pageNumber}: ${url}`);

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.scraping.timeout
      });

      // Gestisce cookie banner
      await this.parser.handleCookieBanner(page);

      // Estrae i link degli annunci
      const links = await this.parser.extractListingLinks(page);
      
      logger.info(`🔍 Trovati ${links.length} annunci sulla pagina ${pageNumber}`);
      this.stats.listingsFound += links.length;

      await page.close();
      return links;

    } catch (error) {
      logger.error(`❌ Errore scraping pagina ${pageNumber}: ${error.message}`);
      await page.close();
      return [];
    }
  }

  /**
   * Scrapa i dettagli di un singolo annuncio
   */
  async scrapeListingDetails(url) {
    const page = await this.context.newPage();
    
    try {
      logger.debug(`🔎 Scraping dettagli: ${url}`);

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.scraping.timeout
      });

      // Estrae tutti i dati
      const data = await this.parser.extractListingDetails(page, url);
      
      await page.close();

      if (!data) {
        throw new Error('Nessun dato estratto');
      }

      // Valida e pulisce i dati
      return validateListing(data);

    } catch (error) {
      logger.error(`❌ Errore dettagli annuncio ${url}: ${error.message}`);
      await page.close();
      return null;
    }
  }

  /**
   * Processa un batch di listing
   */
  async processListings(links) {
    const listings = [];

    for (const link of links) {
      try {
        // Random delay tra richieste
        await randomDelay(2000, 5000);

        const listing = await withRetry(
          () => this.scrapeListingDetails(link),
          config.scraping.retries,
          config.scraping.retryDelay
        );

        if (listing) {
          listings.push(listing);
          this.stats.listingsProcessed++;
        } else {
          this.stats.errors++;
        }

      } catch (error) {
        logger.error(`❌ Errore processing ${link}: ${error.message}`);
        this.stats.errors++;
      }
    }

    return listings;
  }

  /**
   * Salva i listing nel database
   */
  async saveListings(listings) {
    if (listings.length === 0) {
      logger.info('⏭️ Nessun listing da salvare');
      return;
    }

    logger.info(`💾 Salvataggio ${listings.length} annunci nel database...`);

    const results = await this.db.upsertListingsBatch(listings);
    
    this.stats.inserted += results.inserted;
    this.stats.updated += results.updated;
    this.stats.skipped += results.skipped;
    this.stats.errors += results.errors;

    logger.info(`✅ Salvati: ${results.inserted} nuovi, ${results.updated} aggiornati, ${results.skipped} saltati, ${results.errors} errori`);
  }

  /**
   * Stampa le statistiche finali
   */
  printStats() {
    const duration = Math.round((this.stats.endTime - this.stats.startTime) / 1000);
    
    logger.info('');
    logger.info('═══════════════════════════════════════');
    logger.info('📊 STATISTICHE SCRAPING');
    logger.info('═══════════════════════════════════════');
    logger.info(`⏱️  Durata: ${duration} secondi`);
    logger.info(`📄 Pagine scrapate: ${this.stats.pagesScraped}`);
    logger.info(`🔍 Annunci trovati: ${this.stats.listingsFound}`);
    logger.info(`✅ Annunci processati: ${this.stats.listingsProcessed}`);
    logger.info(`➕ Nuovi inseriti: ${this.stats.inserted}`);
    logger.info(`✏️  Aggiornati: ${this.stats.updated}`);
    logger.info(`⏭️  Saltati: ${this.stats.skipped}`);
    logger.info(`❌ Errori: ${this.stats.errors}`);
    logger.info('═══════════════════════════════════════');
    logger.info('');
  }

  /**
   * Esegue lo scraping completo
   */
  async run() {
    this.stats.startTime = Date.now();

    try {
      // Valida configurazione
      validateConfig();
      logger.info('✅ Configurazione validata');

      // Test connessione database
      const dbConnected = await this.db.testConnection();
      if (!dbConnected) {
        throw new Error('Impossibile connettersi al database');
      }

      // Inizializza browser
      await this.initBrowser();

      // Scraping delle pagine
      for (let pageNum = 1; pageNum <= config.scraping.maxPages; pageNum++) {
        try {
          // Scrapa la pagina
          const links = await this.scrapePage(pageNum);
          this.stats.pagesScraped++;

          if (links.length === 0) {
            logger.info('⚠️ Nessun annuncio trovato, stop scraping');
            break;
          }

          // Limita il numero di listing per pagina se configurato
          const linksToProcess = links.slice(0, config.scraping.maxListingsPerPage);

          // Processa i listing
          const listings = await this.processListings(linksToProcess);

          // Salva nel database
          await this.saveListings(listings);

          // Delay tra pagine
          await randomDelay(3000, 6000);

        } catch (error) {
          logger.error(`❌ Errore durante scraping pagina ${pageNum}: ${error.message}`);
          this.stats.errors++;
        }
      }

      // Statistiche finali
      this.stats.endTime = Date.now();
      this.printStats();

      logger.info('✅ Scraping completato con successo!');

    } catch (error) {
      logger.error(`❌ Errore fatale: ${error.message}`);
      logger.error(error.stack);
      throw error;

    } finally {
      await this.closeBrowser();
    }
  }
}

// Esegue lo scraper se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new MotoScraper();
  
  scraper.run()
    .then(() => {
      logger.info('🎉 Programma terminato');
      process.exit(0);
    })
    .catch(error => {
      logger.error(`💥 Programma terminato con errori: ${error.message}`);
      process.exit(1);
    });
}

export default MotoScraper;
