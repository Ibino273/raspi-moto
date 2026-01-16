import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import logger from './logger.js';

class SupabaseService {
  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.key);
  }

  async testConnection() {
    try {
      const { error } = await this.client.from('annunci_moto').select('count', { count: 'exact', head: true });
      if (error) throw error;
      logger.info('✅ Connessione Supabase OK');
      return true;
    } catch (error) {
      logger.error(`❌ Errore Supabase: ${error.message}`);
      throw error;
    }
  }

  async upsertListingsBatch(listings) {
    const stats = { inserted: 0, updated: 0, errors: 0 };
    try {
      const { error } = await this.client
        .from('annunci_moto')
        .upsert(listings, { onConflict: 'link_annuncio' });

      if (error) throw error;
      stats.inserted = listings.length;
      return stats;
    } catch (error) {
      logger.error(`❌ Errore salvataggio: ${error.message}`);
      stats.errors = listings.length;
      return stats;
    }
  }
}

export default SupabaseService;
