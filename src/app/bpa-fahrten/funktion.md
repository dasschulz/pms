# Funktionsweise BPA-Fahrten & Anmeldungsmanagement

Verwaltung von BPA-Informationsfahrten durch MdBs. Umfasst eine Übersichtsseite, Detailansichten pro Fahrt mit Anmeldungsmanagement und Supabase-Integration über API-Endpunkte.

## 1. Übersichtsseite (`/bpa-fahrten`)
Zeigt BPA-Fahrten des MdB; Erstellen und Bearbeiten von Fahrten.

### Kernfunktionen:
- **Fahrtenauflistung**: Kartenansicht mit Details (Zielort, Daten, Status, Anmeldungen, Aktiv-Status) und Aktionen (Details, Bearbeiten, Löschen – Lösch-API fehlt).
- **Fahrt Erstellen/Bearbeiten**: Dialoge zur Dateneingabe/Änderung.
- **Embed Code / Link**: Generiert Iframe/Link zum öffentlichen Anmeldeformular (`/bpa-form/[lastName]`).

### API-Interaktionen:
- `GET, POST /api/bpa-fahrten`
- `PUT /api/bpa-fahrten/[fahrtId]`

### Supabase-Tabellen & Felder (Übersicht):
- **`bpa_fahrten`**: Fahrtdaten. Gelesen/Geschrieben u.a.: `fahrt_datum_von/bis`, `zielort`, `kontingent_max`, `status_fahrt`, `aktiv`, `user_id` (UUID Foreign Key zu `users`). Anmeldungsstatistiken werden durch Joins mit `bpa_formular` berechnet.
- **`users`**: MdB-Identifizierung. Gelesen: Supabase UUID als Primärschlüssel.

## 2. Detailseite einer Fahrt (`/bpa-fahrten/[fahrtId]`)
Details zu einer Fahrt; Liste und Verwaltung der Anmeldungen.

### Kernfunktionen:
- **Fahrtdetails anzeigen**: Infos zur Fahrt.
- **Anmeldungen auflisten**: Tabelle mit Anmeldungen (Name, Email, Teilnahme-Status).
- **Teilnahme-Status ändern**: Dropdown zur Statusaktualisierung.

### API-Interaktionen:
- `GET /api/bpa-fahrten/[fahrtId]`
- `GET /api/bpa-anmeldungen?fahrtId=[fahrtId]`
- `PUT /api/bpa-anmeldungen/[anmeldungId]`

### Supabase-Tabellen & Felder (Detail & Anmeldungen):
- **`bpa_fahrten`**: Gelesen für Details & Berechtigungen (`user_id`).
- **`bpa_formular`**: Anmeldungen.
    - Gelesen: `id` (UUID), `fahrt_id` (UUID Foreign Key zu `bpa_fahrten`), `vorname`, `nachname`, `email`, `status_teilnahme`, etc.
    - Aktualisiert: `status_teilnahme`.
- **`users`**: Berechtigungsprüfung über Supabase UUID.

## 3. API-Endpunkte Details

### `/api/bpa-fahrten` (GET, POST)
- **GET**: Holt Fahrten des MdB (Filter `bpa_fahrten.user_id` mit Supabase UUID).
- **POST**: Erstellt neue Fahrt, verlinkt MdB (`bpa_fahrten.user_id`).

### `/api/bpa-fahrten/[fahrtId]` (GET, PUT)
- **GET**: Holt spezifische Fahrt; prüft MdB-Berechtigung über `user_id`.
- **PUT**: Aktualisiert Fahrt; prüft MdB-Berechtigung über `user_id`.

### `/api/bpa-anmeldungen?fahrtId=[fahrtId]` (GET)
- Holt Anmeldungen (`bpa_formular`) für eine `fahrtId`.
- Prüft MdB-Berechtigung über `bpa_fahrten.user_id`.

### `/api/bpa-anmeldungen/[anmeldungId]` (PUT)
- Aktualisiert Anmeldung (`bpa_formular.status_teilnahme`).
- Prüft MdB-Berechtigung über Fahrt-Besitzervalidierung.

## Wichtige Supabase Feldnamen:
- **`bpa_fahrten`**: `user_id`, `fahrt_datum_von`, `fahrt_datum_bis`, `zielort`, `kontingent_max`, `status_fahrt`, `aktiv`.
- **`bpa_formular`**: `fahrt_id`, `vorname`, `nachname`, `email`, `status_teilnahme`.

## Beobachtungen:
- **Lösch-API für Fahrten fehlt**.
- **Adressfelder-Inkonsistenz**: `anschrift` (API) vs. `strasse`/`hausnummer` (Client-Interface `Anmeldung`).
- **Berechtigungsmodell**: Basiert auf Supabase UUID-Verknüpfung zwischen `users` und `bpa_fahrten` über `user_id`.