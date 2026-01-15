# 🚀 GUIDA INSTALLAZIONE RAPIDA - Moto Scraper V2

## 📦 Cosa hai ricevuto

Hai un sistema completo composto da 3 parti:

1. **Backend Scraper** (Raspberry Pi) - Raccoglie dati da Subito.it
2. **Database** (Supabase) - Memorizza gli annunci
3. **Frontend Dashboard** (Vercel) - Visualizza i dati

---

## ⚡ STEP 1: Setup Supabase (5 minuti)

### 1.1 Crea progetto
1. Vai su [supabase.com](https://supabase.com)
2. Clicca "New Project"
3. Scegli nome e password
4. Attendi che il progetto sia pronto

### 1.2 Crea la tabella
1. Vai su **SQL Editor**
2. Clicca "New Query"
3. Copia e incolla il contenuto di `database/schema.sql`
4. Clicca "Run"

### 1.3 Ottieni le credenziali
1. Vai su **Settings** → **API**
2. Copia:
   - `URL` (es: https://xxxxx.supabase.co)
   - `service_role key` (la chiave segreta)
   - `anon public key` (la chiave pubblica)

---

## ⚡ STEP 2: Setup Backend (Raspberry Pi)

### 2.1 Trasferisci i file

**Opzione A - Via GitHub (consigliata):**
```bash
# Sul tuo PC
cd /path/to/downloaded/files
git init
git add .
git commit -m "Initial commit"
git remote add origin <tuo-repo-url>
git push -u origin main

# Sul Raspberry Pi
ssh pi@raspberrypi.local
cd ~
git clone <tuo-repo-url> moto-scraper-v2
cd moto-scraper-v2
```

**Opzione B - Via SCP:**
```bash
# Sul tuo PC
scp -r /path/to/downloaded/files pi@raspberrypi.local:~/moto-scraper-v2
```

### 2.2 Installa tutto
```bash
cd ~/moto-scraper-v2
chmod +x setup.sh quickstart.sh
./setup.sh
```

Lo script installerà:
- Node.js 18
- Dipendenze npm
- Chromium per Playwright

### 2.3 Configura
```bash
cp .env.example .env
nano .env
```

Inserisci i tuoi dati Supabase:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
MAX_PAGES=5
MAX_LISTINGS_PER_PAGE=30
LOG_LEVEL=info
```

Salva con `CTRL+O`, poi `CTRL+X`

### 2.4 Testa
```bash
./quickstart.sh
```

Se vedi "✅ SISTEMA PRONTO", sei a posto!

### 2.5 Test scraping
```bash
npm run scrape
```

Aspetta qualche minuto. Controlla i log:
```bash
tail -f logs/scraper.log
```

### 2.6 Automazione (opzionale)
```bash
crontab -e
```

Aggiungi questa riga per esecuzione giornaliera alle 7:00:
```
0 7 * * * /home/pi/moto-scraper-v2/run-scraper.sh
```

---

## ⚡ STEP 3: Setup Frontend (Vercel)

### 3.1 Deploy

**Opzione A - Via GitHub (consigliata):**
1. Pusha il codice su GitHub (se non l'hai già fatto)
2. Vai su [vercel.com](https://vercel.com)
3. Clicca "New Project"
4. Importa il repository
5. Seleziona la cartella `frontend` come root
6. Clicca "Deploy"

**Opzione B - Via CLI:**
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

### 3.2 Configura variabili ambiente

Su Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc... (usa la anon key, NON service_role!)
```

### 3.3 Configura RLS su Supabase

Vai su Supabase → SQL Editor ed esegui:

```sql
-- Abilita RLS
ALTER TABLE moto_listings ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
CREATE POLICY "Lettura pubblica annunci" 
ON moto_listings FOR SELECT 
USING (true);
```

### 3.4 Redeploy

Su Vercel dashboard → Deployments → **⋯** → Redeploy

---

## 📊 Verifica Funzionamento

### Backend
```bash
# Su Raspberry Pi
cd ~/moto-scraper-v2
tail -50 logs/scraper.log

# Dovresti vedere:
# ✅ Annunci processati: XX
# ✅ Nuovi inseriti: XX
```

### Database
1. Vai su Supabase → Table Editor
2. Apri la tabella `moto_listings`
3. Dovresti vedere gli annunci

### Frontend
1. Apri il tuo sito Vercel (es: `moto-scraper.vercel.app`)
2. Dovresti vedere la dashboard con gli annunci

---

## 🐛 Problemi Comuni

### "Errore connessione Supabase"
- Verifica che le credenziali in `.env` siano corrette
- Controlla che la tabella `moto_listings` esista
- Prova a ping supabase: `ping xxxxx.supabase.co`

### "Playwright non trova Chromium"
```bash
npx playwright install chromium
npx playwright install-deps chromium
```

### "Frontend non mostra dati"
- Verifica RLS policies su Supabase
- Controlla variabili ambiente su Vercel
- Apri Console del browser (F12) per vedere errori

### "Memoria insufficiente su Raspberry Pi"
Riduci MAX_PAGES in `.env`:
```env
MAX_PAGES=2
MAX_LISTINGS_PER_PAGE=15
```

---

## 📈 Monitoraggio

### Log Backend
```bash
# Live
tail -f ~/moto-scraper-v2/logs/scraper.log

# Ultimi 100 log
tail -100 ~/moto-scraper-v2/logs/scraper.log

# Cerca errori
grep "ERROR" ~/moto-scraper-v2/logs/scraper.log
```

### Statistiche Database
Su Supabase → SQL Editor:
```sql
SELECT * FROM moto_stats;
```

### Metriche Vercel
Vercel Dashboard → Analytics

---

## 🎯 Prossimi Passi

✅ Sistema installato e funzionante

Ora puoi:
1. **Personalizzare** - Modifica colori, filtri, layout del frontend
2. **Ottimizzare** - Ajusta MAX_PAGES e timing in base alle tue esigenze
3. **Espandere** - Aggiungi nuove feature (notifiche, confronti, grafici)
4. **Monitorare** - Controlla regolarmente i log

---

## 📚 Documentazione

- `README.md` - Documentazione completa backend
- `frontend/README.md` - Documentazione frontend
- `STRUCTURE.md` - Struttura del progetto
- `database/schema.sql` - Schema database con commenti

---

## 💬 Supporto

In caso di problemi:

1. Controlla i log: `tail -f logs/scraper.log`
2. Verifica le credenziali nel `.env`
3. Testa la connessione: `npm run test`
4. Controlla che Supabase sia raggiungibile

**Errori comuni:**
- Cookie banner cambiato → Parser da aggiornare
- Rate limiting → Aumenta i delay in `config.js`
- Memoria piena → Riduci `MAX_PAGES` e pulisci log vecchi

---

## ✅ Checklist Finale

- [ ] Supabase progetto creato
- [ ] Tabella moto_listings creata
- [ ] Backend installato su Raspberry Pi
- [ ] File .env configurato
- [ ] Test superati (quickstart.sh)
- [ ] Primo scraping completato
- [ ] Frontend deployato su Vercel
- [ ] Variabili ambiente configurate su Vercel
- [ ] RLS policies configurate
- [ ] Dashboard visualizza dati
- [ ] Cron job configurato (opzionale)

---

**Tempo totale stimato:** 20-30 minuti

**Buon scraping! 🏍️**
