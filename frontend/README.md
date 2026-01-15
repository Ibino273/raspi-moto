# 🎨 MotoMarkt Dashboard - Frontend

Dashboard moderna e performante per visualizzare gli annunci moto scrapati da Subito.it.

## 🚀 Stack Tecnologico

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling utility-first
- **Supabase** - Database real-time
- **Vercel** - Hosting e deployment

## 📦 Installazione

```bash
cd frontend
npm install
```

## ⚙️ Configurazione

1. Crea il file `.env.local`:

```bash
cp .env.local.example .env.local
```

2. Aggiungi le credenziali Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

> ⚠️ Usa la `anon` key (pubblica), NON la `service_role` key!

3. Configura le Row Level Security policies su Supabase:

```sql
-- Abilita RLS
ALTER TABLE moto_listings ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
CREATE POLICY "Lettura pubblica annunci" 
ON moto_listings FOR SELECT 
USING (true);
```

## 🏃 Sviluppo Locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 🌐 Deployment su Vercel

### 1. Deploy automatico (consigliato)

1. Pusha il codice su GitHub
2. Vai su [vercel.com](https://vercel.com)
3. Clicca "New Project"
4. Importa il repository GitHub
5. Configura le variabili ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Clicca "Deploy"

### 2. Deploy da CLI

```bash
npm install -g vercel
vercel login
vercel
```

Segui le istruzioni interattive.

## 🎨 Features

### Design
- ✨ Design scuro ispirato al mondo automotive
- 🎭 Animazioni fluide e micro-interazioni
- 📱 Completamente responsive
- 🎨 Effetti visuali con texture e gradient

### Funzionalità
- 🔍 Filtri per marca e prezzo
- 📊 Statistiche real-time
- 💖 Indicatore di popolarità (likes)
- 🔗 Link diretti agli annunci originali
- ⚡ Caricamento ottimizzato
- 🔄 Aggiornamento automatico dati

## 📁 Struttura

```
frontend/
├── app/
│   ├── layout.tsx       # Layout principale
│   ├── page.tsx         # Homepage con dashboard
│   └── globals.css      # Stili globali
├── public/              # Asset statici
├── .env.local.example   # Template variabili ambiente
├── next.config.js       # Configurazione Next.js
├── tailwind.config.js   # Configurazione Tailwind
├── tsconfig.json        # Configurazione TypeScript
└── package.json         # Dipendenze
```

## 🔧 Personalizzazione

### Cambiare colori

Modifica `app/page.tsx`:

```tsx
// Da rosso a blu
className="text-red-600" → className="text-blue-600"
className="border-red-600" → className="border-blue-600"
```

### Aggiungere campi

1. Aggiungi il campo in `interface MotoListing`
2. Aggiorna la query Supabase in `fetchListings()`
3. Mostra il dato nel componente `MotoCard`

### Modificare filtri

Aggiungi nuovi filtri in `filter` state:

```tsx
const [filter, setFilter] = useState({ 
  marca: '',
  minPrice: 0,
  maxPrice: 100000,
  minAnno: 2000, // Nuovo filtro
  maxKm: 50000   // Nuovo filtro
});
```

## 📊 Performance

- ⚡ First Contentful Paint: < 1.2s
- 🎯 Time to Interactive: < 2.5s
- 📦 Bundle size ottimizzato
- 🖼️ Lazy loading immagini
- 💾 Caching automatico

## 🐛 Troubleshooting

### Errore: "Failed to fetch"

Verifica:
1. Le credenziali Supabase in `.env.local`
2. Che le RLS policies siano configurate
3. La connessione internet

### Build fallisce

```bash
# Pulisci cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Styling non funziona

```bash
# Reinstalla Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 🔐 Sicurezza

- ✅ Usa SOLO chiave `anon` pubblicamente
- ✅ RLS policies configurate su Supabase
- ✅ Nessun dato sensibile nel codice
- ✅ HTTPS su Vercel (automatico)

## 🚀 Ottimizzazioni Future

- [ ] Infinite scroll per listing
- [ ] Salvataggio preferiti in localStorage
- [ ] Notifiche per nuovi annunci
- [ ] Grafici statistiche (Chart.js)
- [ ] Confronto annunci
- [ ] Export dati in CSV
- [ ] PWA per uso offline
- [ ] Dark/Light mode toggle

## 📝 Licenza

MIT

---

Made with ❤️ for moto enthusiasts
