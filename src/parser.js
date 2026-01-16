import logger from './logger.js';
import { parseNumber, parsePrice } from './utils.js';

class SubitoParser {
  async handleCookieBanner(page) {
    try {
      await page.waitForTimeout(3000);
      const btn = page.locator('span.didomi-continue-without-agreeing').first();
      if (await btn.isVisible()) {
        await btn.click();
        logger.info('✅ Cookie accettati');
      } else {
        await page.evaluate(() => {
          document.querySelector('#didomi-host')?.remove();
          document.body.style.overflow = 'auto';
        });
      }
      return true;
    } catch (e) { return false; }
  }

  async extractListingLinks(page) {
    try {
      const selector = 'article[class*="index-module_card"] a[class*="index-module_link"]';
      await page.waitForSelector(selector, { state: 'attached', timeout: 10000 });
      const links = await page.$$eval(selector, els => els.map(el => el.href));
      return [...new Set(links.filter(l => l.includes('/moto-e-scooter/') && l.endsWith('.htm')))];
    } catch (e) {
      return await page.$$eval('a[href*="/moto-e-scooter/"]', els => 
        [...new Set(els.map(el => el.href).filter(l => l.endsWith('.htm')))]
      );
    }
  }

  async extractListingDetails(page, url) {
    try {
      const data = { link_annuncio: url };
      data.titolo = await this.extractText(page, 'h1[class*="index-module_title"]');
      const prezzoText = await this.extractText(page, 'p[class*="index-module_price"]');
      data.prezzo = parsePrice(prezzoText);
      data.citta = await this.extractText(page, 'span[class*="index-module_location"]');

      const mainData = await this.extractMainData(page);
      return { ...data, ...mainData };
    } catch (e) { return null; }
  }

  async extractMainData(page) {
    const data = { marca: null, modello: null, anno: null, km: null };
    try {
      const features = await page.$$eval('[class*="index-module_feature-item"]', items => 
        items.map(item => ({
          label: item.querySelector('[class*="index-module_label"]')?.textContent?.trim(),
          value: item.querySelector('[class*="index-module_value"]')?.textContent?.trim()
        }))
      );
      const mapping = { 'marca': 'marca', 'modello': 'modello', 'anno': 'anno', 'chilometraggio': 'km', 'km': 'km' };
      features.forEach(f => {
        if (!f.label || !f.value) return;
        const cleanLabel = f.label.toLowerCase();
        for (const [key, target] of Object.entries(mapping)) {
          if (cleanLabel.includes(key)) {
            data[target] = (target === 'km' || target === 'anno') ? parseNumber(f.value) : f.value;
          }
        }
      });
    } catch (e) {}
    return data;
  }

  async extractText(page, selector) {
    try {
      return (await page.locator(selector).first().innerText())?.trim();
    } catch { return null; }
  }
}
export default SubitoParser;
