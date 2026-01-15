import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import logger from './logger.js';

class SupabaseService {
  constructor() {
    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceKey
    );
    this.tableName = config.supabase.tableName;
  }

  /**
   * Inserisce o aggiorna un annuncio nel database
   */
  async upsertListing(listing) {
    try {
      // Verifica se l'annuncio esiste già tramite link_annuncio
      const { data: existing, error: checkError } = await this.client
        .from(this.tableName)
        .select('id, prezzo, km, likes')
        .eq('link_annuncio', listing.link_annuncio)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = nessun risultato trovato
        throw checkError;
      }

      if (existing) {
        // Aggiorna solo se ci sono cambiamenti significativi
        const hasChanges = 
          existing.prezzo !== listing.prezzo ||
          existing.km !== listing.km ||
          existing.likes !== listing.likes;

        if (hasChanges) {
          const { error: updateError } = await this.client
            .from(this.tableName)
            .update({
              ...listing,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
          
          logger.info(`✏️ Annuncio aggiornato: ${listing.marca} ${listing.modello} (${existing.id})`);
          return { action: 'updated', id: existing.id };
        } else {
          logger.debug(`⏭️ Annuncio già presente senza cambiamenti: ${listing.marca} ${listing.modello}`);
          return { action: 'skipped', id: existing.id };
        }
      } else {
        // Inserisce nuovo annuncio
        const { data, error: insertError } = await this.client
          .from(this.tableName)
          .insert(listing)
          .select()
          .single();

        if (insertError) throw insertError;

        logger.info(`✅ Nuovo annuncio inserito: ${listing.marca} ${listing.modello} (${data.id})`);
        return { action: 'inserted', id: data.id };
      }
    } catch (error) {
      logger.error(`❌ Errore database per ${listing.marca} ${listing.modello}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inserisce multipli annunci in batch
   */
  async upsertListingsBatch(listings) {
    const results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    for (const listing of listings) {
      try {
        const result = await this.upsertListing(listing);
        results[result.action]++;
      } catch (error) {
        results.errors++;
      }
    }

    return results;
  }

  /**
   * Ottiene statistiche dal database
   */
  async getStats() {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return { totalListings: count };
    } catch (error) {
      logger.error(`❌ Errore nel recupero statistiche: ${error.message}`);
      return { totalListings: 0 };
    }
  }

  /**
   * Test connessione database
   */
  async testConnection() {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .select('id')
        .limit(1);

      if (error) throw error;

      logger.info('✅ Connessione Supabase OK');
      return true;
    } catch (error) {
      logger.error(`❌ Errore connessione Supabase: ${error.message}`);
      return false;
    }
  }
}

export default SupabaseService;
