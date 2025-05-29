# Funktionsweise BPA-Fahrten & Anmeldungsmanagement

Verwaltung von BPA-Informationsfahrten durch MdBs. Umfasst eine Übersichtsseite, Detailansichten pro Fahrt mit Anmeldungsmanagement und Supabase-Integration über API-Endpunkte.

## 1. Übersichtsseite (`/bpa-fahrten`)
Zeigt BPA-Fahrten des MdB; Erstellen und Bearbeiten von Fahrten mit interaktiver Statusverwaltung.

### Kernfunktionen:
- **Fahrtenauflistung**: Kartenansicht mit Details (Zielort, Daten, Status, Anmeldungen) und Aktionen (Details, Bearbeiten, Löschen).
- **Interaktive Statusverwaltung**: 
  - Status-Dropdown direkt auf Karten für schnelle Statusänderungen (Planung, Anmeldung offen, etc.)
  - Echtzeit-Updates ohne Seitenaktualisierung
- **Fahrt Erstellen/Bearbeiten**: Dialoge zur Dateneingabe/Änderung mit erweiterten Feldern (Hotel, Beschreibung, Zustiegsorte).
- **Fahrt Löschen**: Löschfunktion mit Bestätigungsdialog und Schutz vor Löschung bei vorhandenen Anmeldungen.
- **Embed Code / Link**: Generiert Iframe/Link zum öffentlichen Anmeldeformular (`/bpa/[lastName]`).
- **Toast-Benachrichtigungen**: Erfolgsmeldungen und Fehlermeldungen bei allen Aktionen.

### API-Interaktionen:
- `GET, POST /api/bpa-fahrten`
- `PUT /api/bpa-fahrten/[fahrtId]` (für Updates und Inline-Status-Updates)
- `DELETE /api/bpa-fahrten/[fahrtId]` (mit Schutz vor Löschung bei vorhandenen Anmeldungen)

### Supabase-Tabellen & Felder (Übersicht):
- **`bpa_fahrten`**: Fahrtdaten. Gelesen/Geschrieben u.a.: `fahrt_datum_von/bis`, `zielort`, `kontingent_max`, `status_fahrt` (Enum), `user_id` (UUID Foreign Key zu `users`), `hotel_name`, `hotel_adresse`, `beschreibung`, `anmeldefrist`, `zustiegsorte_config`. Anmeldungsstatistiken werden durch Joins mit `bpa_formular` berechnet.
- **`users`**: MdB-Identifizierung. Gelesen: Supabase UUID als Primärschlüssel.

## 2. Detailseite einer Fahrt (`/bpa-fahrten/[fahrtId]`)
Details zu einer Fahrt; Liste und Verwaltung der Anmeldungen.

### Kernfunktionen:
- **Fahrtdetails anzeigen**: Vollständige Fahrtinformationen inkl. Hotel und Beschreibung.
- **Anmeldungen auflisten**: Tabelle mit Anmeldungen (Name, Email, Teilnahme-Status, Spam-Score).
- **Teilnahme-Status ändern**: Dropdown zur Statusaktualisierung.
- **Spam-Analyse**: Anzeige des Spam-Scores zur Qualitätsbewertung der Anmeldungen.

### API-Interaktionen:
- `GET /api/bpa-fahrten/[fahrtId]`
- `GET /api/bpa-anmeldungen?fahrtId=[fahrtId]`
- `PUT /api/bpa-anmeldungen/[anmeldungId]`

### Supabase-Tabellen & Felder (Detail & Anmeldungen):
- **`bpa_fahrten`**: Gelesen für Details & Berechtigungen (`user_id`).
- **`bpa_formular`**: Anmeldungen.
    - Gelesen: `id` (UUID), `fahrt_id` (UUID Foreign Key zu `bpa_fahrten`), `vorname`, `nachname`, `email`, `status_teilnahme`, `spam_score`, etc.
    - Aktualisiert: `status_teilnahme`.
- **`users`**: Berechtigungsprüfung über Supabase UUID.

## 3. Öffentliche Anmeldeformulare (`/bpa/[lastName]`)
Öffentlich zugängliche Anmeldeformulare für Bürger ohne Authentifizierung.

### Kernfunktionen:
- **MdB-Erkennung**: Automatische Zuordnung über lastName-Parameter.
- **Fahrtauswahl**: Dynamische Liste verfügbarer Fahrten (Status='Anmeldung offen').
- **Vollständiges Anmeldeformular**: Persönliche Daten, Anschrift, Fahrtdetails, Präferenzen.
- **Spam-Schutz**: Umfassende Spam-Erkennung mit mehreren Schutzebenen.
- **Responsive Design**: Optimiert für alle Geräte mit DIE LINKE Branding.

### Spam-Schutz Features:
- **Rate Limiting**: 5 Anfragen pro Stunde pro IP-Adresse
- **Honeypot-Felder**: Versteckte Felder (website, phone_number, company, fax) die nur Bots ausfüllen
- **Content-Analyse**: Erkennung von Spam-Keywords, übermäßigen Links, verdächtigen Email-Domains
- **Timing-Validierung**: Blockierung zu schneller Submissions (<3 Sekunden)
- **Spam-Scoring**: 0-100 Skala, ab 70 Punkte wird blockiert, ab 40 als verdächtig geloggt

### API-Interaktionen:
- `GET /api/bpa-public/mdb-details?lastName=[lastName]`
- `GET /api/bpa-public/active-trips?userId=[userId]` (filtert nach Status='Anmeldung offen')
- `POST /api/bpa-public/submit-application`

## 4. API-Endpunkte Details

### `/api/bpa-fahrten` (GET, POST)
- **GET**: Holt Fahrten des MdB (Filter `bpa_fahrten.user_id` mit Supabase UUID).
- **POST**: Erstellt neue Fahrt, verlinkt MdB (`bpa_fahrten.user_id`).

### `/api/bpa-fahrten/[fahrtId]` (GET, PUT, DELETE)
- **GET**: Holt spezifische Fahrt; prüft MdB-Berechtigung über `user_id`.
- **PUT**: Aktualisiert Fahrt; prüft MdB-Berechtigung über `user_id`. Unterstützt Partial-Updates für Inline-Statusänderungen.
- **DELETE**: Löscht Fahrt mit Berechtigungsprüfung. Blockiert Löschung wenn Anmeldungen vorliegen.

### `/api/bpa-anmeldungen?fahrtId=[fahrtId]` (GET)
- Holt Anmeldungen (`bpa_formular`) für eine `fahrtId`.
- Prüft MdB-Berechtigung über `bpa_fahrten.user_id`.

### `/api/bpa-anmeldungen/[anmeldungId]` (PUT)
- Aktualisiert Anmeldung (`bpa_formular.status_teilnahme`).
- Prüft MdB-Berechtigung über Fahrt-Besitzervalidierung.

### `/api/bpa-public/*` (Öffentliche APIs)
- **mdb-details**: Sucht MdB über lastName mit Service Role Key (RLS-Bypass)
- **active-trips**: Listet verfügbare Fahrten für MdB (Status='Anmeldung offen')
- **submit-application**: Verarbeitet Anmeldungen mit Spam-Schutz und Rate Limiting

## 5. Sicherheit & Datenschutz

### Row Level Security (RLS)
- Öffentliche APIs umgehen RLS mit Service Role Key für notwendige Datenabfrage
- Nur nicht-sensible Daten (id, name, wahlkreis) werden öffentlich exponiert
- Vollständige Berechtigung nur für authentifizierte MdBs

### Delete-Schutz
- **Anmeldungsprüfung**: Fahrten mit vorhandenen Anmeldungen können nicht gelöscht werden
- **Berechtigungsprüfung**: Nur Besitzer können eigene Fahrten löschen
- **Bestätigungsdialog**: UI-seitige Warnung vor Löschung
- **Alternative**: Bei vorhandenen Anmeldungen wird Status "Storniert" empfohlen

### Spam-Schutz Implementation
- **Bibliothek**: `limiter` für Rate Limiting
- **Honeypot**: Versteckte Formularfelder mit CSS und aria-hidden
- **Content-Filter**: RegEx-Pattern für gängige Spam-Indikatoren
- **Timing**: Client- und serverseitige Timing-Validierung
- **Logging**: Verdächtige Submissions werden zur Analyse geloggt

## Wichtige Supabase Feldnamen:
- **`bpa_fahrten`**: `user_id`, `fahrt_datum_von`, `fahrt_datum_bis`, `zielort`, `kontingent_max`, `status_fahrt` (Enum), `hotel_name`, `hotel_adresse`, `beschreibung`, `anmeldefrist`, `zustiegsorte_config`.
- **`bpa_formular`**: `fahrt_id`, `vorname`, `nachname`, `email`, `status_teilnahme`, `spam_score`, `essenspraeferenzen`, `zustieg`, `parteimitglied`, `einzelzimmer`, `teilnahme_5j`.

## Technische Verbesserungen:
- **Enum-Status**: `status_fahrt` als Enum mit definierten Werten (Eingegangen, Planung, Anmeldung offen, etc.)
- **Echtzeit-Updates**: Optimistische UI-Updates für bessere User Experience
- **Delete-Funktionalität**: Sichere Löschung mit Anmeldungsschutz und Bestätigungsdialog
- **Toast-System**: Einheitliche Benachrichtigungen über alle Aktionen
- **Responsive Design**: Mobile-optimierte Formularansichten
- **Skeleton Loading**: Verbesserte Loading-States während Datenabfrage

## Routing-Struktur:
- **`/bpa-fahrten`**: Admin-Dashboard für authentifizierte MdBs
- **`/bpa-fahrten/[fahrtId]`**: Fahrt-Detailseite mit Anmeldungsmanagement
- **`/bpa/[lastName]`**: Öffentliche Anmeldeformulare (ohne Auth erforderlich)

## Beobachtungen:
- **Middleware-Integration**: Öffentliche Routen sind in middleware.ts konfiguriert
- **Berechtigungsmodell**: Basiert auf Supabase UUID-Verknüpfung zwischen `users` und `bpa_fahrten` über `user_id`.
- **Database Schema**: Benötigt `spam_score INTEGER DEFAULT 0` in `bpa_formular` Tabelle.
- **Aktiv-Field entfernt**: Statusverwaltung erfolgt nur noch über `status_fahrt` Enum für klarere Struktur.

**Mehrwert**: Ermöglicht effiziente Verwaltung von BPA-Informationsfahrten mit benutzerfreundlichen öffentlichen Anmeldeformularen, umfassendem Spam-Schutz und sicherer Löschfunktionalität, wodurch die Büroarbeit des MdB erheblich vereinfacht wird.