-- ================================================
-- Schema Database per Moto Scraper V2
-- Tabella: moto_listings
-- Database: Supabase (PostgreSQL)
-- ================================================

-- Elimina tabella se esiste (ATTENZIONE: cancella tutti i dati!)
-- DROP TABLE IF EXISTS moto_listings;

-- Crea la tabella principale
CREATE TABLE IF NOT EXISTS moto_listings (
  -- Identificativo e timestamp
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Informazioni sul veicolo
  marca TEXT,
  modello TEXT,
  anno INTEGER CHECK (anno >= 1900 AND anno <= EXTRACT(YEAR FROM NOW()) + 1),
  km INTEGER CHECK (km >= 0),
  cilindrata INTEGER CHECK (cilindrata > 0 AND cilindrata <= 2000),
  versione TEXT,
  tipo_veicolo TEXT,
  
  -- Informazioni annuncio
  prezzo NUMERIC(10, 2) CHECK (prezzo >= 0),
  likes INTEGER DEFAULT 0 CHECK (likes >= 0),
  citta TEXT,
  data_pubblicazione TIMESTAMPTZ,
  descrizione TEXT,
  titolo TEXT,
  link_annuncio TEXT NOT NULL UNIQUE,
  
  -- Informazioni venditore
  venditore TEXT,
  
  -- Metadati
  iva_esposta TEXT,
  
  -- Constraint
  CONSTRAINT valid_link CHECK (link_annuncio ~* '^https?://.*')
);

-- ================================================
-- Indici per migliorare le performance
-- ================================================

-- Indice per ricerche per marca e modello
CREATE INDEX IF NOT EXISTS idx_moto_marca_modello 
ON moto_listings(marca, modello);

-- Indice per ricerche per prezzo
CREATE INDEX IF NOT EXISTS idx_moto_prezzo 
ON moto_listings(prezzo) 
WHERE prezzo IS NOT NULL;

-- Indice per ricerche per anno
CREATE INDEX IF NOT EXISTS idx_moto_anno 
ON moto_listings(anno) 
WHERE anno IS NOT NULL;

-- Indice per ricerche per km
CREATE INDEX IF NOT EXISTS idx_moto_km 
ON moto_listings(km) 
WHERE km IS NOT NULL;

-- Indice per ricerche per città
CREATE INDEX IF NOT EXISTS idx_moto_citta 
ON moto_listings(citta) 
WHERE citta IS NOT NULL;

-- Indice per ordinamento per data pubblicazione (più recenti)
CREATE INDEX IF NOT EXISTS idx_moto_data_pubblicazione 
ON moto_listings(data_pubblicazione DESC NULLS LAST);

-- Indice per ordinamento per created_at (più recenti)
CREATE INDEX IF NOT EXISTS idx_moto_created_at 
ON moto_listings(created_at DESC);

-- Indice per link_annuncio (per deduplicazione veloce)
CREATE INDEX IF NOT EXISTS idx_moto_link_annuncio 
ON moto_listings(link_annuncio);

-- Indice per cilindrata
CREATE INDEX IF NOT EXISTS idx_moto_cilindrata 
ON moto_listings(cilindrata) 
WHERE cilindrata IS NOT NULL;

-- ================================================
-- Trigger per aggiornare automaticamente updated_at
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_moto_listings_updated_at ON moto_listings;

CREATE TRIGGER update_moto_listings_updated_at
    BEFORE UPDATE ON moto_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- View per statistiche rapide
-- ================================================

CREATE OR REPLACE VIEW moto_stats AS
SELECT 
    COUNT(*) as total_listings,
    COUNT(DISTINCT marca) as total_brands,
    AVG(prezzo)::NUMERIC(10,2) as avg_price,
    MIN(prezzo)::NUMERIC(10,2) as min_price,
    MAX(prezzo)::NUMERIC(10,2) as max_price,
    AVG(km)::INTEGER as avg_km,
    AVG(anno)::INTEGER as avg_year,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week
FROM moto_listings;

-- ================================================
-- View per annunci più popolari
-- ================================================

CREATE OR REPLACE VIEW moto_popular AS
SELECT 
    id,
    marca,
    modello,
    anno,
    prezzo,
    likes,
    citta,
    link_annuncio,
    created_at
FROM moto_listings
WHERE likes > 0
ORDER BY likes DESC, created_at DESC
LIMIT 100;

-- ================================================
-- View per annunci recenti
-- ================================================

CREATE OR REPLACE VIEW moto_recent AS
SELECT 
    id,
    marca,
    modello,
    anno,
    km,
    prezzo,
    citta,
    link_annuncio,
    created_at
FROM moto_listings
ORDER BY created_at DESC
LIMIT 100;

-- ================================================
-- Funzione per ricerca full-text
-- ================================================

-- Aggiungi colonna tsvector per full-text search
ALTER TABLE moto_listings 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Crea indice GIN per full-text search
CREATE INDEX IF NOT EXISTS idx_moto_search_vector 
ON moto_listings 
USING GIN(search_vector);

-- Funzione per aggiornare search_vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('italian', COALESCE(NEW.marca, '')), 'A') ||
        setweight(to_tsvector('italian', COALESCE(NEW.modello, '')), 'A') ||
        setweight(to_tsvector('italian', COALESCE(NEW.versione, '')), 'B') ||
        setweight(to_tsvector('italian', COALESCE(NEW.descrizione, '')), 'C') ||
        setweight(to_tsvector('italian', COALESCE(NEW.citta, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare search_vector automaticamente
DROP TRIGGER IF EXISTS update_moto_search_vector ON moto_listings;

CREATE TRIGGER update_moto_search_vector
    BEFORE INSERT OR UPDATE ON moto_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- ================================================
-- Policy RLS (Row Level Security) - Opzionale
-- ================================================

-- Abilita RLS (se vuoi restrizioni di accesso)
-- ALTER TABLE moto_listings ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
-- CREATE POLICY "Lettura pubblica" ON moto_listings
--     FOR SELECT USING (true);

-- Policy per inserimento solo con service_role
-- CREATE POLICY "Inserimento autenticato" ON moto_listings
--     FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ================================================
-- Commenti per documentazione
-- ================================================

COMMENT ON TABLE moto_listings IS 'Tabella principale per annunci moto scrapati da Subito.it';
COMMENT ON COLUMN moto_listings.link_annuncio IS 'URL unico dell''annuncio, usato per deduplicazione';
COMMENT ON COLUMN moto_listings.search_vector IS 'Vettore per ricerca full-text';

-- ================================================
-- Query di esempio per testare
-- ================================================

-- Inserimento di test
-- INSERT INTO moto_listings (marca, modello, anno, km, prezzo, citta, link_annuncio)
-- VALUES ('Yamaha', 'MT-07', 2022, 5000, 7500, 'Milano', 'https://www.subito.it/moto/test-123.htm');

-- Ricerca per marca
-- SELECT * FROM moto_listings WHERE marca = 'Yamaha';

-- Ricerca full-text
-- SELECT * FROM moto_listings 
-- WHERE search_vector @@ to_tsquery('italian', 'yamaha & mt07');

-- Statistiche
-- SELECT * FROM moto_stats;

-- ================================================
-- Fine Schema
-- ================================================

-- Verifica creazione tabella
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'moto_listings';
