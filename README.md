# 🏍️ Moto Scraper V2 - Raspberry Pi

Sistema completo per scraping automatico di annunci moto da Subito.it, salvataggio su Supabase e visualizzazione su dashboard web.

## 📋 Indice

- [Caratteristiche](#caratteristiche)
- [Requisiti](#requisiti)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Utilizzo](#utilizzo)
- [Struttura Database](#struttura-database)
- [Deployment Frontend](#deployment-frontend)
- [Cron Job](#cron-job)
- [Troubleshooting](#troubleshooting)

## ✨ Caratteristiche

- ✅ **Scraping robusto** con retry automatico e gestione errori
- ✅ **Deduplicazione intelligente** - aggiorna solo annunci modificati
- ✅ **Logging avanzato** con Winston
- ✅ **User-Agent rotation** per evitare blocchi
- ✅ **Rate limiting** con delay randomici
- ✅ **Configurazione flessibile** tramite variabili ambiente
- ✅ **Ottimizzato per Raspberry Pi** (headless, basso consumo)
- ✅ **Statistiche dettagliate** su ogni esecuzione

## 📦 Requisiti

- Raspberry Pi (3B+ o superiore)
- Raspbian OS (Bullseye o Bookworm)
- Node.js 18.x
- Account Supabase (gratuito)
- Minimo 2GB RAM
- Connessione internet stabile

## 🚀 Installazione

### 1. Clona o trasferisci il repository

```bash
cd ~
git clone https://github.com/tuo-username/moto-scraper-v2.git
cd moto-scraper-v2
```

### 2. Esegui lo script di setup

```bash
chmod +x setup.sh
./setup.sh
```

Lo script installerà automaticamente:
- Node.js 18.x
- Dipendenze npm
- Chromium per Playwright
- Directory e file necessari

## ⚙️ Configurazione

### 1. Configura Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto
2. Vai su **Settings** → **API**
3. Copia:
   - `URL` del progetto
   - `service_role` key (secret)

### 2. Configura le variabili ambiente

```bash
cp .env.example .env
nano .env
```

Inserisci i tuoi valori:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc....
MAX_PAGES=5
MAX_LISTINGS_PER_PAGE=30
LOG_LEVEL=info
```

### 3. Crea la tabella nel database

Vai su Supabase → **SQL Editor** ed esegui lo script `database/schema.sql`.

## 🎯 Utilizzo

### Test manuale

```bash
npm run scrape
```

### Monitora i log

```bash
# Log in tempo reale
tail -f logs/scraper.log

# Ultimi 50 log
tail -50 logs/scraper.log

# Cerca errori
grep "ERROR" logs/scraper.log
```

### Statistiche

Lo scraper stampa statistiche dettagliate al termine:

```
═══════════════════════════════════════
📊 STATISTICHE SCRAPING
═══════════════════════════════════════
⏱️  Durata: 145 secondi
📄 Pagine scrapate: 5
🔍 Annunci trovati: 150
✅ Annunci processati: 147
➕ Nuovi inseriti: 23
✏️  Aggiornati: 8
⏭️  Saltati: 116
❌ Errori: 3
═══════════════════════════════════════
```

## 🗄️ Struttura Database

La tabella `moto_listings` su Supabase ha questa struttura:

```sql
CREATE TABLE moto_listings (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Informazioni veicolo
  marca TEXT,
  modello TEXT,
  anno INTEGER,
  km INTEGER,
  cilindrata INTEGER,
  versione TEXT,
  tipo_veicolo TEXT,
  
  -- Annuncio
  prezzo NUMERIC,
  likes INTEGER DEFAULT 0,
  citta TEXT,
  data_pubblicazione TIMESTAMPTZ,
  descrizione TEXT,
  link_annuncio TEXT UNIQUE NOT NULL,
  
  -- Venditore
  venditore TEXT
);

-- Indici per performance
CREATE INDEX idx_marca_modello ON moto_listings(marca, modello);
CREATE INDEX idx_prezzo ON moto_listings(prezzo);
CREATE INDEX idx_anno ON moto_listings(anno);
CREATE INDEX idx_data_pubblicazione ON moto_listings(data_pubblicazione DESC);
CREATE INDEX idx_link_annuncio ON moto_listings(link_annuncio);
```

## ⏰ Cron Job

Per esecuzione automatica giornaliera:

```bash
crontab -e
```

Aggiungi una di queste righe:

```bash
# Ogni giorno alle 7:00
0 7 * * * /home/pi/moto-scraper-v2/run-scraper.sh

# Ogni 6 ore
0 */6 * * * /home/pi/moto-scraper-v2/run-scraper.sh

# Due volte al giorno (7:00 e 19:00)
0 7,19 * * * /home/pi/moto-scraper-v2/run-scraper.sh
```

Verifica il cron:
```bash
crontab -l
```

Monitora log cron:
```bash
tail -f logs/cron.log
```

## 🌐 Deployment Frontend

Il frontend React/Next.js può essere deployato su Vercel.

Vedi `/frontend/README.md` per istruzioni dettagliate.

## 🔧 Troubleshooting

### Errore: "SUPABASE_URL non configurata"

```bash
# Verifica che .env esista e sia configurato
cat .env
```

### Errore: "Impossibile connettersi al database"

- Verifica le credenziali Supabase
- Controlla che la tabella `moto_listings` esista
- Verifica la connessione internet

### Browser non si avvia

```bash
# Reinstalla dipendenze Playwright
npx playwright install-deps chromium
```

### Memoria insufficiente

Riduci il numero di pagine/listing nel `.env`:

```env
MAX_PAGES=3
MAX_LISTINGS_PER_PAGE=20
```

### Cookie banner non gestito

Il parser tenta 3 metodi diversi. Se falliscono tutti:
1. Controlla i log per errori specifici
2. Verifica che il sito non sia stato modificato
3. Apri un issue su GitHub

## 📊 Monitoraggio Performance

### RAM Usage

```bash
free -h
```

### CPU Usage

```bash
top -n 1 | grep node
```

### Disk Space

```bash
df -h
```

### Rotazione Log

I log vengono automaticamente ruotati (max 5 file da 5MB).

Per pulizia manuale:
```bash
rm logs/scraper.log.*
```

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch (`git checkout -b feature/nuova-funzione`)
3. Commit delle modifiche (`git commit -am 'Aggiunge nuova funzione'`)
4. Push al branch (`git push origin feature/nuova-funzione`)
5. Apri una Pull Request

## 📝 Changelog

### v2.0.0 (2026-01-15)
- ✨ Riscrittura completa con moduli ES6
- ✨ Logging avanzato con Winston
- ✨ Gestione errori robusta con retry
- ✨ Deduplicazione intelligente
- ✨ Parser modulare e manutenibile
- ✨ Statistiche dettagliate
- ✨ Ottimizzazioni per Raspberry Pi

### v1.0.0
- 🎉 Release iniziale

## 📄 Licenza

MIT

## 👨‍💻 Autore

Creato con ❤️ per il mondo delle moto
