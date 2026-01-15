/**
 * Utility functions per parsing e manipolazione dati
 */

/**
 * Estrae numero da stringa (es: "5.000 km" -> 5000)
 */
export function parseNumber(text) {
  if (!text) return null;
  const cleaned = text.toString().replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Estrae prezzo da stringa (es: "€ 7.500" -> 7500)
 */
export function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/€|\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normalizza data da formato italiano a ISO
 */
export function parseDate(dateText) {
  if (!dateText) return null;
  
  try {
    // Gestisce formati come "Oggi alle 10:30", "Ieri alle 15:00", "10 gen"
    const today = new Date();
    
    if (dateText.toLowerCase().includes('oggi')) {
      return today.toISOString();
    }
    
    if (dateText.toLowerCase().includes('ieri')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString();
    }
    
    // Per altre date, ritorna la stringa pulita
    return dateText.trim();
  } catch (error) {
    return dateText;
  }
}

/**
 * Genera URL completo da path relativo
 */
export function buildFullUrl(href, baseUrl) {
  if (!href) return null;
  
  if (href.startsWith('http')) {
    return href;
  }
  
  try {
    return new URL(href, baseUrl).href;
  } catch (error) {
    return null;
  }
}

/**
 * Estrae ID annuncio da URL
 */
export function extractListingId(url) {
  if (!url) return null;
  
  try {
    const match = url.match(/\/([a-zA-Z0-9-]+)\.htm/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Sleep helper
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ritardo random tra min e max millisecondi
 */
export function randomDelay(min = 1000, max = 3000) {
  return sleep(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Retry con backoff esponenziale
 */
export async function withRetry(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Valida e pulisce dati annuncio
 */
export function validateListing(listing) {
  return {
    marca: listing.marca?.trim() || null,
    modello: listing.modello?.trim() || null,
    anno: listing.anno || null,
    km: listing.km || null,
    prezzo: listing.prezzo || null,
    likes: listing.likes || 0,
    citta: listing.citta?.trim() || null,
    data_pubblicazione: listing.data_pubblicazione || new Date().toISOString(),
    link_annuncio: listing.link_annuncio?.trim() || null,
    tipo_veicolo: listing.tipo_veicolo?.trim() || null,
    cilindrata: listing.cilindrata || null,
    versione: listing.versione?.trim() || null,
    descrizione: listing.descrizione?.trim() || null,
    venditore: listing.venditore?.trim() || null
  };
}

/**
 * Formatta numero per logging
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('it-IT').format(num);
}

/**
 * Tronca testo per logging
 */
export function truncate(text, maxLength = 100) {
  if (!text) return 'N/A';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
