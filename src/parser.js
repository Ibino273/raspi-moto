import logger from './logger.js';
import { parseNumber, parsePrice, parseDate, truncate } from './utils.js';

/**
 * Classe per parsing delle pagine Subito.it
 */
class SubitoParser {
  /**
   * Gestisce il banner dei cookie
   */
  async handleCookieBanner(page) {
    try {
      // Aspetta il container dei cookie
      const cookieContainer = await page.waitForSelector(
        'div.didomi-popup-container',
        { timeout: 5000, state: 'visible' }
      ).catch(() => null);

      if (!cookieContainer) {
        logger.debug('Banner cookie non trovato');
        return true;
      }

      // Prova a cliccare "Continua senza accettare"
      const continueButton = await page.locator('span.didomi-continue-without-agreeing').first();
      if (await continueButton.isVisible().catch(() => false)) {
        await continueButton.click();
        logger.info('✅ Cookie: cliccato "Continua senza accettare"');
        return true;
      }

      // Altrimenti clicca "Accetta"
      const acceptButton = await page.locator('button:has-text("Accetta")').first();
      if (await acceptButton.isVisible().catch(() => false)) {
        await acceptButton.click();
        logger.info('✅ Cookie: cliccato "Accetta"');
        return true;
      }

      // Ultimo tentativo: rimuovi il banner con JS
      await page.evaluate(() => {
        const banner = document.getElementById('didomi-host');
        if (banner) banner.remove();
        
        const overlay = document.querySelector('.didomi-popup-backdrop');
        if (overlay) overlay.remove();
        
        document.body.style.overflow = 'auto';
      });

      logger.info('✅ Cookie: banner rimosso con JS');
      return true;

    } catch (error) {
      logger.warn(`⚠️ Problema gestione cookie: ${error.message}`);
      return false;
    }
  }

  /**
   * Estrae i link degli annunci dalla pagina lista
   */
  async extractListingLinks(page) {
    try {
      await page.waitForSelector('div:nth-of-type(3) a.SmallCard-module_link__hOkzY', {
        timeout: 10000
      });

      const links = await page.$$eval(
        'div:nth-of-type(3) a.SmallCard-module_link__hOkzY',
        elements => elements.map(el => el.href)
      );

      return links.filter(link => link && link.includes('/moto/'));
    } catch (error) {
      logger.warn(`⚠️ Nessun link trovato sulla pagina: ${error.message}`);
      return [];
    }
  }

  /**
   * Estrae tutti i dati da una pagina dettaglio annuncio
   */
  async extractListingDetails(page, url) {
    try {
      await page.waitForLoadState('domcontentloaded');
      
      const data = {
        link_annuncio: url
      };

      // Titolo
      data.titolo = await this.extractText(page, 'h1');

      // Prezzo
      const prezzoText = await this.extractText(page, 'p.AdInfo_price__flXgp');
      data.prezzo = parsePrice(prezzoText);

      // Descrizione
      data.descrizione = await this.extractText(page, 'p.AdDescription_description__154FP');

      // Data pubblicazione
      const dataText = await this.extractText(page, 'span.index-module_insertion-date__MU4AZ');
      data.data_pubblicazione = parseDate(dataText);

      // Città
      data.citta = await this.extractText(page, 'p.AdInfo_locationText__rDhKP');

      // Likes
      const likesText = await this.extractText(page, 'span.Heart_counter-wrapper__number__Xltfo');
      data.likes = parseNumber(likesText);

      // Venditore
      data.venditore = await this.extractText(
        page,
        '.PrivateUserProfileBadge_small__lEJuK .headline-6 a'
      );

      // Dati principali dalla sezione "main-data"
      const mainData = await this.extractMainData(page);
      Object.assign(data, mainData);

      logger.debug(`Dati estratti: ${data.marca} ${data.modello} - €${data.prezzo}`);

      return data;

    } catch (error) {
      logger.error(`❌ Errore estrazione dati da ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Estrae testo da un selettore
   */
  async extractText(page, selector) {
    try {
      const element = await page.$(selector);
      if (!element) return null;
      
      const text = await element.textContent();
      return text?.trim() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Estrae i dati dalla sezione "Dati Principali"
   */
  async extractMainData(page) {
    const data = {};

    try {
      const mainDataSection = await page.$('section.main-data');
      if (!mainDataSection) {
        logger.warn('⚠️ Sezione "Dati Principali" non trovata');
        return data;
      }

      const features = await mainDataSection.$$eval(
        'li.feature-list_feature__gAyqB',
        items => items.map(item => {
          const label = item.querySelector('span:first-child')?.textContent?.trim();
          const value = item.querySelector('span.feature-list_value__SZDpz')?.textContent?.trim();
          return { label, value };
        })
      );

      // Mappa i dati con le chiavi corrette
      const mapping = {
        'marca': 'marca',
        'modello': 'modello',
        'anno': 'anno',
        'immatricolazione': 'anno',
        'km': 'km',
        'cilindrata': 'cilindrata',
        'versione': 'versione',
        'tipo di veicolo': 'tipo_veicolo',
        'iva esposta': 'iva_esposta'
      };

      for (const { label, value } of features) {
        if (!label || !value) continue;

        const normalizedLabel = label.toLowerCase();
        const key = mapping[normalizedLabel];

        if (key) {
          // Parsing specifico per tipo di dato
          if (key === 'km' || key === 'cilindrata' || key === 'anno') {
            data[key] = parseNumber(value);
          } else {
            data[key] = value;
          }
        }
      }

    } catch (error) {
      logger.warn(`⚠️ Errore estrazione dati principali: ${error.message}`);
    }

    return data;
  }
}

export default SubitoParser;
