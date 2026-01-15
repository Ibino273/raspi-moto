# Contributing to Moto Scraper V2

Grazie per il tuo interesse nel contribuire! 🎉

## 🚀 Come Contribuire

### 1. Setup Ambiente di Sviluppo

```bash
# Fork il repository su GitHub
git clone https://github.com/tuo-username/moto-scraper-v2.git
cd moto-scraper-v2

# Installa dipendenze
npm install
cd frontend && npm install && cd ..

# Configura .env per test
cp .env.example .env
# Aggiungi le tue credenziali Supabase di test
```

### 2. Crea un Branch

```bash
git checkout -b feature/nome-feature
# oppure
git checkout -b fix/nome-bug
```

### 3. Fai le Modifiche

- Segui lo stile del codice esistente
- Aggiungi commenti dove necessario
- Testa le modifiche localmente

### 4. Commit

```bash
git add .
git commit -m "feat: descrizione breve della feature"
# oppure
git commit -m "fix: descrizione del bug risolto"
```

**Convenzioni commit:**
- `feat:` - Nuova feature
- `fix:` - Bug fix
- `docs:` - Modifiche documentazione
- `style:` - Formattazione codice
- `refactor:` - Refactoring
- `test:` - Aggiunta test
- `chore:` - Manutenzione

### 5. Push e Pull Request

```bash
git push origin feature/nome-feature
```

Poi apri una Pull Request su GitHub con:
- Descrizione chiara delle modifiche
- Screenshot se UI/UX
- Link a issue correlate

## 📝 Linee Guida Codice

### JavaScript/TypeScript

```javascript
// ✅ Buono
async function fetchListings() {
  try {
    const data = await api.getListings();
    return data;
  } catch (error) {
    logger.error(`Errore fetch: ${error.message}`);
    throw error;
  }
}

// ❌ Da evitare
async function fetchListings() {
  const data = await api.getListings();
  return data;
}
```

### Logging

```javascript
// ✅ Usa logger
logger.info('Operazione completata');
logger.error('Errore:', error);

// ❌ Non usare console
console.log('test');
```

### Gestione Errori

```javascript
// ✅ Sempre catch errors
try {
  await riskyOperation();
} catch (error) {
  logger.error('Errore:', error);
  // Gestisci l'errore
}
```

## 🧪 Testing

Prima di inviare una PR:

```bash
# Test backend
npm run test

# Test frontend (se modificato)
cd frontend
npm run build
npm run start
```

## 📋 Checklist PR

- [ ] Codice testato localmente
- [ ] Nessun warning/errore
- [ ] Documentazione aggiornata se necessario
- [ ] Commit message seguono le convenzioni
- [ ] Branch aggiornato con main

## 🐛 Segnalare Bug

Apri una [issue](https://github.com/tuo-username/moto-scraper-v2/issues) con:

1. **Titolo chiaro**: es. "Parser fallisce su annunci senza prezzo"
2. **Descrizione**:
   - Cosa dovrebbe succedere
   - Cosa succede invece
   - Come riprodurre
3. **Log/Screenshot** se disponibili
4. **Ambiente**: OS, Node version, etc.

## 💡 Proporre Feature

Apri una [discussion](https://github.com/tuo-username/moto-scraper-v2/discussions) con:

1. Caso d'uso
2. Benefici
3. Possibile implementazione

## 📞 Contatti

- 💬 Discussions per domande generali
- 🐛 Issues per bug
- 📧 Email per questioni sensibili

## 🙏 Grazie!

Ogni contributo è prezioso, grande o piccolo che sia!
