# 🏍️ Moto Scraper V2

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi-red.svg)](https://www.raspberrypi.org/)

Sistema automatico di scraping per annunci moto da Subito.it con dashboard moderna per visualizzazione dati.

![Dashboard Preview](https://via.placeholder.com/800x400/09090b/ef4444?text=MotoMarkt+Dashboard)

## 🚀 Caratteristiche

- ✨ **Scraping automatico** di annunci moto da Subito.it
- 💾 **Salvataggio su Supabase** con deduplicazione intelligente
- 📊 **Dashboard moderna** con filtri e statistiche real-time
- 🤖 **Gestione errori robusta** con retry automatico
- 📈 **Logging professionale** con Winston
- ⚡ **Ottimizzato per Raspberry Pi** (headless, basso consumo)
- 🎨 **UI distintiva** ispirata al mondo automotive

## 📋 Stack Tecnologico

### Backend (Raspberry Pi)
- **Node.js 18+** - Runtime JavaScript
- **Playwright** - Browser automation per scraping
- **Winston** - Logging avanzato
- **Supabase.js** - Client database
- **ES Modules** - Architettura modulare moderna

### Frontend (Vercel)
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Database real-time

### Database
- **Supabase (PostgreSQL)** - Database cloud gratuito
- Full-text search
- Indici ottimizzati
- Trigger automatici

## 📦 Installazione Rapida

### Prerequisiti
- Raspberry Pi (3B+ o superiore) con Raspbian OS
- Account Supabase (gratuito)
- Account Vercel (gratuito, opzionale per frontend)

### 1️⃣ Clona il repository

```bash
git clone https://github.com/tuo-username/moto-scraper-v2.git
cd moto-scraper-v2
```

### 2️⃣ Setup automatico

```bash
chmod +x setup.sh quickstart.sh
./setup.sh
```

### 3️⃣ Configura Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Esegui lo schema SQL da `database/schema.sql`
3. Copia le credenziali in `.env`:

```bash
cp .env.example .env
nano .env
```

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
MAX_PAGES=5
MAX_LISTINGS_PER_PAGE=30
```

### 4️⃣ Test e avvio

```bash
./quickstart.sh  # Test configurazione
npm run scrape   # Primo scraping
```

### 5️⃣ Automazione (opzionale)

```bash
crontab -e
# Aggiungi: 0 7 * * * /home/pi/moto-scraper-v2/run-scraper.sh
```

## 📊 Struttura Progetto

```
moto-scraper-v2/
├── src/                    # Codice backend
│   ├── scraper.js         # Scraper principale
│   ├── parser.js          # Parser HTML
│   ├── supabase.js        # Client database
│   ├── config.js          # Configurazione
│   ├── logger.js          # Sistema logging
│   ├── utils.js           # Utility functions
│   └── test.js            # Test configurazione
├── frontend/              # Dashboard Next.js
│   ├── app/              # Pages e components
│   └── package.json      # Dipendenze frontend
├── database/             # Schema SQL
│   └── schema.sql        # Database completo
├── setup.sh              # Setup automatico
├── quickstart.sh         # Test sistema
└── README.md             # Questa guida
```

## 🎨 Frontend Dashboard

Il frontend è una dashboard moderna con:

- 🔍 **Filtri avanzati** - Per marca, prezzo, anno, km
- 📊 **Statistiche real-time** - Totale annunci, media prezzi, nuovi oggi
- 💖 **Indicatori popolarità** - Like count
- 🔗 **Link diretti** - Agli annunci originali
- 📱 **Responsive design** - Mobile-first
- 🎭 **Animazioni fluide** - Micro-interazioni curate

### Deploy Frontend su Vercel

```bash
cd frontend
npm install
vercel login
vercel
```

Configura le variabili ambiente su Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

[Guida completa frontend →](frontend/README.md)

## 📖 Documentazione

- 📘 [Installazione Rapida](INSTALLAZIONE_RAPIDA.md) - Guida step-by-step
- 📗 [Struttura Progetto](STRUCTURE.md) - Architettura dettagliata
- 📙 [Frontend README](frontend/README.md) - Documentazione dashboard
- 📕 [Database Schema](database/schema.sql) - Schema con commenti

## 🔧 Configurazione Avanzata

### Modifica numero di pagine

```env
# .env
MAX_PAGES=10                    # Numero pagine da scrapare
MAX_LISTINGS_PER_PAGE=50        # Annunci per pagina (max)
```

### Modifica scheduling cron

```bash
# Ogni 6 ore
0 */6 * * * /home/pi/moto-scraper-v2/run-scraper.sh

# Due volte al giorno (7:00 e 19:00)
0 7,19 * * * /home/pi/moto-scraper-v2/run-scraper.sh
```

### Personalizza frontend

Modifica colori in `frontend/app/page.tsx`:

```tsx
// Cambia da rosso a blu
className="text-red-600" → className="text-blue-600"
```

## 📊 Statistiche Esempio

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

## 🐛 Troubleshooting

### Errore connessione Supabase
```bash
# Verifica credenziali
cat .env
# Testa connessione
npm run test
```

### Browser non si avvia
```bash
# Reinstalla Chromium
npx playwright install chromium
npx playwright install-deps chromium
```

### Memoria insufficiente
```env
# Riduci carico in .env
MAX_PAGES=2
MAX_LISTINGS_PER_PAGE=15
```

[Troubleshooting completo →](INSTALLAZIONE_RAPIDA.md#-problemi-comuni)

## 📈 Roadmap

- [ ] Notifiche email per nuovi annunci
- [ ] Confronto prezzi storici con grafici
- [ ] Export dati in CSV/Excel
- [ ] Supporto altri siti (AutoScout24, mobile.de)
- [ ] App mobile con React Native
- [ ] Machine learning per predizione prezzi
- [ ] Sistema di alert su criteri personalizzati
- [ ] API REST pubblica

## 🤝 Contribuire

Contributi benvenuti! Per contribuire:

1. Fork del progetto
2. Crea un branch (`git checkout -b feature/nuova-funzione`)
3. Commit (`git commit -am 'Aggiunge nuova funzione'`)
4. Push (`git push origin feature/nuova-funzione`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi [LICENSE](LICENSE) per dettagli.

## 🙏 Ringraziamenti

- [Playwright](https://playwright.dev/) - Browser automation
- [Supabase](https://supabase.com/) - Database backend
- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Hosting frontend

## 📞 Supporto

- 🐛 **Bug?** Apri una [issue](https://github.com/tuo-username/moto-scraper-v2/issues)
- 💡 **Feature request?** Apri una [discussion](https://github.com/tuo-username/moto-scraper-v2/discussions)
- 📧 **Contatto:** tuo-email@example.com

---

<div align="center">
  <sub>Creato con ❤️ per gli appassionati di moto</sub>
  <br>
  <sub>Scraping responsabile • Privacy-first • Open source</sub>
</div>
