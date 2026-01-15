# 📁 Struttura Progetto Moto Scraper V2

```
moto-scraper-v2/
│
├── 📁 src/                          # Codice sorgente backend
│   ├── config.js                    # Configurazione centralizzata
│   ├── logger.js                    # Sistema di logging Winston
│   ├── supabase.js                  # Client e operazioni Supabase
│   ├── parser.js                    # Parser HTML per Subito.it
│   ├── scraper.js                   # Scraper principale
│   ├── utils.js                     # Utility functions
│   └── test.js                      # Script di test configurazione
│
├── 📁 database/                     # Database e schema
│   └── schema.sql                   # Schema PostgreSQL per Supabase
│
├── 📁 frontend/                     # Dashboard Next.js
│   ├── 📁 app/                      # Next.js App Router
│   │   ├── page.tsx                 # Homepage dashboard
│   │   ├── layout.tsx               # Layout base
│   │   └── globals.css              # Stili globali
│   ├── package.json                 # Dipendenze frontend
│   ├── tsconfig.json                # Config TypeScript
│   ├── tailwind.config.js           # Config Tailwind CSS
│   ├── next.config.js               # Config Next.js
│   ├── postcss.config.js            # Config PostCSS
│   ├── .env.local.example           # Template variabili ambiente
│   └── README.md                    # Documentazione frontend
│
├── 📁 logs/                         # Log files (auto-generati)
│   ├── scraper.log                  # Log principale
│   └── cron.log                     # Log esecuzioni cron
│
├── 📄 package.json                  # Dipendenze backend
├── 📄 .env.example                  # Template configurazione
├── 📄 .gitignore                    # File da ignorare
├── 📄 README.md                     # Documentazione principale
│
├── 🔧 setup.sh                      # Script setup iniziale
├── 🔧 quickstart.sh                 # Test e verifica setup
└── 🔧 run-scraper.sh                # Script per cron job (generato da setup.sh)

```

## 📦 File Principali

### Backend (Raspberry Pi)

| File | Scopo | Dipendenze |
|------|-------|------------|
| `src/scraper.js` | Entry point principale | playwright, tutti gli altri moduli |
| `src/parser.js` | Estrazione dati HTML | logger, utils |
| `src/supabase.js` | Gestione database | @supabase/supabase-js, logger |
| `src/config.js` | Configurazione | dotenv |
| `src/logger.js` | Logging | winston |
| `src/utils.js` | Utilities | - |

### Frontend (Vercel)

| File | Scopo | Dipendenze |
|------|-------|------------|
| `app/page.tsx` | Dashboard UI | @supabase/supabase-js, react |
| `app/layout.tsx` | Layout root | next |
| `app/globals.css` | Stili globali | tailwindcss |

### Database

| File | Scopo |
|------|-------|
| `database/schema.sql` | Schema completo con indici, trigger, view |

### Scripts

| File | Scopo | Quando usare |
|------|-------|--------------|
| `setup.sh` | Installazione iniziale | Prima volta su Raspberry Pi |
| `quickstart.sh` | Test configurazione | Dopo configurazione .env |
| `run-scraper.sh` | Esecuzione cron | Auto-generato, usato da cron |

## 🔄 Flusso di Lavoro

```
1. Setup Iniziale
   └─> setup.sh
       ├─> Installa Node.js
       ├─> Installa dipendenze
       └─> Installa Playwright

2. Configurazione
   └─> .env
       ├─> SUPABASE_URL
       └─> SUPABASE_SERVICE_ROLE_KEY

3. Test
   └─> quickstart.sh
       └─> npm run test
           ├─> Test config
           ├─> Test database
           └─> Test inserimento

4. Scraping
   └─> npm run scrape
       ├─> scraper.js
       │   ├─> parser.js (estrai dati)
       │   └─> supabase.js (salva dati)
       └─> logs/scraper.log

5. Automazione
   └─> cron job
       └─> run-scraper.sh
           └─> logs/cron.log

6. Visualizzazione
   └─> Frontend (Vercel)
       └─> Supabase (legge dati)
```

## 💾 Dimensioni Approssimative

```
Backend:
  - Codice sorgente: ~50 KB
  - node_modules: ~400 MB (Playwright include Chromium)
  - Log files: ~5 MB/giorno

Frontend:
  - Codice sorgente: ~30 KB
  - node_modules: ~250 MB
  - Build output: ~2 MB

Database:
  - Schema: ~15 KB
  - Dati: ~5 KB/annuncio (stimato ~50 MB per 10k annunci)
```

## 🔐 File Sensibili (.gitignore)

```
- .env                 # Credenziali Supabase
- .env.local           # Credenziali frontend
- logs/*.log           # File di log
- node_modules/        # Dipendenze
```

## 📊 Metriche Stimate

**Scraping:**
- 1 pagina = ~30 annunci
- 1 annuncio = ~5 secondi
- 5 pagine = ~150 annunci = ~15 minuti

**Database:**
- 150 annunci/giorno
- 4,500 annunci/mese
- 54,000 annunci/anno

**Storage Supabase (free tier):**
- 500 MB storage
- Capacità: ~100k annunci
- Backup automatici

## 🚀 Deploy Rapido

```bash
# Backend (Raspberry Pi)
git clone <repo>
cd moto-scraper-v2
./setup.sh
nano .env
./quickstart.sh
crontab -e  # Aggiungi: 0 7 * * * /home/pi/moto-scraper-v2/run-scraper.sh

# Frontend (Vercel)
cd frontend
vercel login
vercel
# Configura variabili ambiente su dashboard Vercel
```

---

Ultima revisione: 2026-01-15
