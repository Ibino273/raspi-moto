#!/bin/bash

echo "🔧 =========================================="
echo "🔧 Setup Moto Scraper V2 per Raspberry Pi"
echo "🔧 =========================================="
echo ""

# Aggiorna il sistema
echo "📦 Aggiornamento sistema..."
sudo apt update && sudo apt upgrade -y

# Installa Node.js 18.x
echo "📦 Installazione Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verifica installazione
echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"

# Crea directory del progetto
echo "📁 Creazione directory progetto..."
mkdir -p ~/moto-scraper-v2
cd ~/moto-scraper-v2

# Copia i file (assumendo che siano già stati clonati o trasferiti)
echo "📦 Installazione dipendenze..."
npm install

# Installa browser Chromium per Playwright
echo "🌐 Installazione Chromium per Playwright..."
npx playwright install chromium
npx playwright install-deps chromium

# Crea directory logs
mkdir -p logs

# Crea file .env se non esiste
if [ ! -f .env ]; then
    echo "📝 Creazione file .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Configura il file .env con le tue credenziali Supabase!"
    echo "   Esegui: nano .env"
fi

# Crea script per cron
echo "📝 Creazione script cron..."
cat > ~/moto-scraper-v2/run-scraper.sh << 'EOF'
#!/bin/bash
cd ~/moto-scraper-v2
echo "🚀 Avvio scraping alle $(date)" >> logs/cron.log
npm run scrape >> logs/cron.log 2>&1
echo "✅ Fine scraping alle $(date)" >> logs/cron.log
echo "---" >> logs/cron.log
EOF

chmod +x ~/moto-scraper-v2/run-scraper.sh

echo ""
echo "✅ =========================================="
echo "✅ Setup completato!"
echo "✅ =========================================="
echo ""
echo "📋 Prossimi passi:"
echo ""
echo "1. Configura le credenziali Supabase:"
echo "   cd ~/moto-scraper-v2"
echo "   nano .env"
echo ""
echo "2. Testa lo scraper:"
echo "   npm run scrape"
echo ""
echo "3. Configura il cron job per esecuzione automatica:"
echo "   crontab -e"
echo ""
echo "   Aggiungi questa riga per esecuzione giornaliera alle 7:00:"
echo "   0 7 * * * /home/pi/moto-scraper-v2/run-scraper.sh"
echo ""
echo "   Oppure ogni 6 ore:"
echo "   0 */6 * * * /home/pi/moto-scraper-v2/run-scraper.sh"
echo ""
echo "4. Monitora i log:"
echo "   tail -f ~/moto-scraper-v2/logs/scraper.log"
echo ""
