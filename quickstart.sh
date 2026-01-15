#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║         🏍️  MOTO SCRAPER V2 - QUICK START 🏍️           ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 CHECKLIST PRE-AVVIO${NC}"
echo ""

# Check 1: Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅${NC} Node.js installato: ${NODE_VERSION}"
else
    echo -e "${RED}❌${NC} Node.js NON installato"
    echo "   Esegui: ./setup.sh"
    exit 1
fi

# Check 2: Directory node_modules
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} Dipendenze installate"
else
    echo -e "${YELLOW}⚠️${NC}  Dipendenze non installate"
    echo "   Esegui: npm install"
    exit 1
fi

# Check 3: File .env
if [ -f ".env" ]; then
    echo -e "${GREEN}✅${NC} File .env presente"
    
    # Verifica se è configurato
    if grep -q "tuo-progetto.supabase.co" .env || grep -q "tuo_service_role_key" .env; then
        echo -e "${RED}❌${NC} File .env NON configurato (contiene valori placeholder)"
        echo "   Edita il file: nano .env"
        exit 1
    fi
else
    echo -e "${RED}❌${NC} File .env NON trovato"
    echo "   Copia il template: cp .env.example .env"
    echo "   Configura: nano .env"
    exit 1
fi

# Check 4: Chromium Playwright
if [ -d "$HOME/.cache/ms-playwright" ]; then
    echo -e "${GREEN}✅${NC} Playwright Chromium installato"
else
    echo -e "${YELLOW}⚠️${NC}  Playwright Chromium non trovato"
    echo "   Installalo: npx playwright install chromium"
fi

echo ""
echo -e "${BLUE}🧪 ESECUZIONE TEST${NC}"
echo ""

# Esegui test
node src/test.js

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}║           ✅ SISTEMA PRONTO PER LO SCRAPING! ✅          ║${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}🚀 COMANDI DISPONIBILI:${NC}"
    echo ""
    echo "   npm run scrape        # Esegui scraping manualmente"
    echo "   npm run test          # Testa la configurazione"
    echo "   tail -f logs/scraper.log   # Monitora i log"
    echo ""
    echo -e "${BLUE}⏰ CONFIGURAZIONE CRON:${NC}"
    echo ""
    echo "   crontab -e"
    echo ""
    echo "   Aggiungi una di queste righe:"
    echo "   0 7 * * * $PWD/run-scraper.sh    # Alle 7:00"
    echo "   0 */6 * * * $PWD/run-scraper.sh  # Ogni 6 ore"
    echo ""
else
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}║        ❌ ALCUNI TEST SONO FALLITI ❌                    ║${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Risolvi gli errori sopra riportati prima di procedere."
    echo ""
    exit 1
fi
