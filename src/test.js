import { config, validateConfig } from './config.js';
import logger from './logger.js';
import SupabaseService from './supabase.js';

async function runTests() {
  logger.info('🧪 Avvio test di configurazione...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Validazione configurazione
  try {
    validateConfig();
    logger.info('✅ Test 1: Configurazione valida');
    passed++;
  } catch (error) {
    logger.error(`❌ Test 1: Configurazione non valida - ${error.message}`);
    failed++;
    return;
  }

  // Test 2: Connessione Supabase
  try {
    const db = new SupabaseService();
    const connected = await db.testConnection();
    
    if (connected) {
      logger.info('✅ Test 2: Connessione Supabase OK');
      passed++;
    } else {
      throw new Error('Connessione fallita');
    }
  } catch (error) {
    logger.error(`❌ Test 2: Errore connessione Supabase - ${error.message}`);
    failed++;
  }

  // Test 3: Statistiche database
  try {
    const db = new SupabaseService();
    const stats = await db.getStats();
    
    logger.info(`✅ Test 3: Database operativo - ${stats.totalListings} annunci presenti`);
    passed++;
  } catch (error) {
    logger.error(`❌ Test 3: Errore recupero statistiche - ${error.message}`);
    failed++;
  }

  // Test 4: Test inserimento/aggiornamento
  try {
    const db = new SupabaseService();
    const testListing = {
      marca: 'TEST',
      modello: 'TEST_MODEL',
      anno: 2024,
      km: 0,
      prezzo: 1,
      citta: 'Test City',
      link_annuncio: `https://test.com/test-${Date.now()}.htm`,
      data_pubblicazione: new Date().toISOString()
    };

    const result = await db.upsertListing(testListing);
    
    if (result.action === 'inserted') {
      logger.info('✅ Test 4: Inserimento test OK');
      passed++;

      // Pulisci l'annuncio di test
      // (Nota: aggiungi un metodo delete se vuoi pulizia automatica)
    } else {
      throw new Error('Inserimento non riuscito');
    }
  } catch (error) {
    logger.error(`❌ Test 4: Errore inserimento test - ${error.message}`);
    failed++;
  }

  // Riepilogo
  logger.info('\n' + '='.repeat(50));
  logger.info('📊 RIEPILOGO TEST');
  logger.info('='.repeat(50));
  logger.info(`✅ Test passati: ${passed}`);
  logger.info(`❌ Test falliti: ${failed}`);
  logger.info(`📈 Successo: ${Math.round((passed / (passed + failed)) * 100)}%`);
  logger.info('='.repeat(50) + '\n');

  if (failed === 0) {
    logger.info('🎉 Tutti i test superati! Il sistema è pronto per lo scraping.\n');
    logger.info('Prossimi passi:');
    logger.info('1. Esegui: npm run scrape');
    logger.info('2. Configura il cron job per esecuzione automatica');
    logger.info('3. Monitora i log: tail -f logs/scraper.log\n');
  } else {
    logger.error('⚠️ Alcuni test sono falliti. Risolvi gli errori prima di procedere.\n');
    process.exit(1);
  }
}

// Esegui i test
runTests()
  .then(() => {
    logger.info('Test completati');
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Errore durante i test: ${error.message}`);
    process.exit(1);
  });
