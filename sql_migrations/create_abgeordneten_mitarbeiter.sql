-- SQL Script für Abgeordneten-Mitarbeiter System
-- Dieses Skript kann direkt im Supabase SQL Editor ausgeführt werden

-- 1. Erstelle Enums für Eingruppierung
CREATE TYPE eingruppierung_enum AS ENUM (
    'Bürokraft',
    'Sekretär:in', 
    'Sachbearbeiter:in',
    'Wissenschaftliche:r Mitarbeiter:in'
);

-- 2. Erstelle Enum für Einsatzort (wird später mit Wahlkreisbüros erweitert)
CREATE TYPE einsatzort_enum AS ENUM (
    'Bundestag'
    -- Weitere Wahlkreisbüros werden hier dynamisch hinzugefügt
);

-- 3. Erweitere users Tabelle für MdB mit zusätzlichen Feldern
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS geburtsdatum DATE,
ADD COLUMN IF NOT EXISTS bueronummer TEXT,
ADD COLUMN IF NOT EXISTS mobilnummer TEXT;

-- 4. Erstelle Haupttabelle für Abgeordneten-Mitarbeiter
CREATE TABLE IF NOT EXISTS abgeordneten_mitarbeiter (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    strasse TEXT NOT NULL,
    hausnummer TEXT NOT NULL,
    plz TEXT NOT NULL CHECK (plz ~ '^[0-9]{5}$'), -- Deutsche PLZ Format
    ort TEXT NOT NULL,
    geburtsdatum DATE NOT NULL,
    email TEXT UNIQUE CHECK (email LIKE '%@bundestag.de'),
    bueronummer TEXT,
    mobilnummer TEXT,
    profilbild_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Erstelle Junction-Tabelle für MdB-Mitarbeiter Zuordnungen
-- Da ein Mitarbeiter bis zu 3 MdB zugeordnet werden kann und dabei
-- Eingruppierung, Zuständigkeit, etc. unterschiedlich sein können
CREATE TABLE IF NOT EXISTS mdb_mitarbeiter_zuordnungen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mitarbeiter_id UUID NOT NULL REFERENCES abgeordneten_mitarbeiter(id) ON DELETE CASCADE,
    mdb_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    eingruppierung eingruppierung_enum NOT NULL,
    zustaendigkeit TEXT NOT NULL,
    einstellungsdatum DATE NOT NULL,
    befristung_bis DATE, -- Optional, da unbefristet möglich
    einsatzort einsatzort_enum NOT NULL DEFAULT 'Bundestag',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Ein Mitarbeiter kann maximal 3 MdB zugeordnet werden
    CONSTRAINT unique_mitarbeiter_mdb UNIQUE (mitarbeiter_id, mdb_user_id)
);

-- 6. Erstelle Funktion zur Überprüfung der maximalen MdB-Zuordnungen
CREATE OR REPLACE FUNCTION check_max_mdb_assignments()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM mdb_mitarbeiter_zuordnungen WHERE mitarbeiter_id = NEW.mitarbeiter_id) >= 3 THEN
        RAISE EXCEPTION 'Ein Mitarbeiter kann maximal 3 MdB zugeordnet werden';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Erstelle Trigger für die Überprüfung
CREATE TRIGGER trigger_check_max_mdb_assignments
    BEFORE INSERT ON mdb_mitarbeiter_zuordnungen
    FOR EACH ROW
    EXECUTE FUNCTION check_max_mdb_assignments();

-- 8. Erstelle automatische Timestamp-Updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_abgeordneten_mitarbeiter_updated_at
    BEFORE UPDATE ON abgeordneten_mitarbeiter
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mdb_mitarbeiter_zuordnungen_updated_at
    BEFORE UPDATE ON mdb_mitarbeiter_zuordnungen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Erstelle Indizes für bessere Performance
CREATE INDEX idx_abgeordneten_mitarbeiter_name ON abgeordneten_mitarbeiter(name);
CREATE INDEX idx_abgeordneten_mitarbeiter_email ON abgeordneten_mitarbeiter(email);
CREATE INDEX idx_mdb_mitarbeiter_zuordnungen_mitarbeiter ON mdb_mitarbeiter_zuordnungen(mitarbeiter_id);
CREATE INDEX idx_mdb_mitarbeiter_zuordnungen_mdb ON mdb_mitarbeiter_zuordnungen(mdb_user_id);
CREATE INDEX idx_mdb_mitarbeiter_zuordnungen_einsatzort ON mdb_mitarbeiter_zuordnungen(einsatzort);

-- 10. Erstelle RLS (Row Level Security) Policies
ALTER TABLE abgeordneten_mitarbeiter ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdb_mitarbeiter_zuordnungen ENABLE ROW LEVEL SECURITY;

-- Policy: MdB können nur ihre eigenen Mitarbeiter sehen
CREATE POLICY "MdB können ihre eigenen Mitarbeiter einsehen" ON abgeordneten_mitarbeiter
    FOR SELECT
    USING (
        id IN (
            SELECT mitarbeiter_id 
            FROM mdb_mitarbeiter_zuordnungen 
            WHERE mdb_user_id = auth.uid()
        )
    );

-- Policy: MdB können ihre eigenen Mitarbeiter bearbeiten
CREATE POLICY "MdB können ihre eigenen Mitarbeiter bearbeiten" ON abgeordneten_mitarbeiter
    FOR ALL
    USING (
        id IN (
            SELECT mitarbeiter_id 
            FROM mdb_mitarbeiter_zuordnungen 
            WHERE mdb_user_id = auth.uid()
        )
    );

-- Policy: MdB können nur ihre eigenen Zuordnungen sehen
CREATE POLICY "MdB können ihre eigenen Zuordnungen einsehen" ON mdb_mitarbeiter_zuordnungen
    FOR SELECT
    USING (mdb_user_id = auth.uid());

-- Policy: MdB können nur ihre eigenen Zuordnungen verwalten
CREATE POLICY "MdB können ihre eigenen Zuordnungen verwalten" ON mdb_mitarbeiter_zuordnungen
    FOR ALL
    USING (mdb_user_id = auth.uid());

-- 11. Erstelle View für einfachere Abfragen mit allen Mitarbeiterdaten
CREATE OR REPLACE VIEW mitarbeiter_vollstaendig AS
SELECT 
    m.id,
    m.name,
    m.strasse,
    m.hausnummer,
    m.plz,
    m.ort,
    m.geburtsdatum,
    m.email,
    m.bueronummer,
    m.mobilnummer,
    m.profilbild_url,
    z.eingruppierung,
    z.zustaendigkeit,
    z.einstellungsdatum,
    z.befristung_bis,
    z.einsatzort,
    u.name as mdb_name,
    u.id as mdb_id,
    m.created_at,
    m.updated_at
FROM abgeordneten_mitarbeiter m
JOIN mdb_mitarbeiter_zuordnungen z ON m.id = z.mitarbeiter_id
JOIN users u ON z.mdb_user_id = u.id;

-- 12. Kommentare für bessere Dokumentation
COMMENT ON TABLE abgeordneten_mitarbeiter IS 'Tabelle für alle Mitarbeiter der Abgeordneten';
COMMENT ON TABLE mdb_mitarbeiter_zuordnungen IS 'Junction-Tabelle für Zuordnungen zwischen MdB und Mitarbeitern';
COMMENT ON COLUMN abgeordneten_mitarbeiter.email IS 'E-Mail muss @bundestag.de Domain haben';
COMMENT ON COLUMN mdb_mitarbeiter_zuordnungen.befristung_bis IS 'Null = unbefristet';

-- 13. Erstelle Funktion zum Hinzufügen von Wahlkreisbüros als Einsatzorte
CREATE OR REPLACE FUNCTION add_wahlkreisbuero_to_einsatzort(buero_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('ALTER TYPE einsatzort_enum ADD VALUE %L', buero_name);
END;
$$ LANGUAGE plpgsql;

-- Beispiel: Wahlkreisbüros hinzufügen (auskommentiert, da diese dynamisch hinzugefügt werden sollten)
-- SELECT add_wahlkreisbuero_to_einsatzort('Wahlkreisbüro Berlin');
-- SELECT add_wahlkreisbuero_to_einsatzort('Wahlkreisbüro Hamburg');

-- 14. Info-Ausgabe
DO $$
BEGIN
    RAISE NOTICE 'Abgeordneten-Mitarbeiter System erfolgreich erstellt!';
    RAISE NOTICE 'Tabellen: abgeordneten_mitarbeiter, mdb_mitarbeiter_zuordnungen';
    RAISE NOTICE 'View: mitarbeiter_vollstaendig';
    RAISE NOTICE 'Enums: eingruppierung_enum, einsatzort_enum';
    RAISE NOTICE 'Users Tabelle wurde erweitert um: geburtsdatum, bueronummer, mobilnummer';
    RAISE NOTICE 'RLS Policies sind aktiviert';
    RAISE NOTICE 'Maximal 3 MdB-Zuordnungen pro Mitarbeiter werden durch Trigger überprüft';
END $$; 