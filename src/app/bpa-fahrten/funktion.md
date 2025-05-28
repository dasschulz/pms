# Funktionsweise BPA-Fahrten & Anmeldungsmanagement

Verwaltung von BPA-Informationsfahrten durch MdBs. Umfasst eine Übersichtsseite, Detailansichten pro Fahrt mit Anmeldungsmanagement und Airtable-Integration über API-Endpunkte.

## 1. Übersichtsseite (`/bpa-fahrten`)
Zeigt BPA-Fahrten des MdB; Erstellen und Bearbeiten von Fahrten.

### Kernfunktionen:
- **Fahrtenauflistung**: Kartenansicht mit Details (Zielort, Daten, Status, Anmeldungen, Aktiv-Status) und Aktionen (Details, Bearbeiten, Löschen – Lösch-API fehlt).
- **Fahrt Erstellen/Bearbeiten**: Dialoge zur Dateneingabe/Änderung.
- **Embed Code / Link**: Generiert Iframe/Link zum öffentlichen Anmeldeformular (`/bpa-form/[lastName]`).

### API-Interaktionen:
- `GET, POST /api/bpa-fahrten`
- `PUT /api/bpa-fahrten/[fahrtId]`

### Airtable-Tabellen & Felder (Übersicht):
- **`BPA_Fahrten`**: Fahrtdaten. Gelesen/Geschrieben u.a.: `Fahrt_Datum_von/Bis`, `Zielort`, `Kontingent_Max`, `Status_Fahrt`, `Aktiv`, `UserID` (Link `Users`). `Aktuelle_Anmeldungen`, `Bestaetigte_Anmeldungen` sind Rollups.
- **`Users`**: MdB-Identifizierung. Gelesen: `UserID` (Nummer), Airtable Record ID.

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

### Airtable-Tabellen & Felder (Detail & Anmeldungen):
- **`BPA_Fahrten`**: Gelesen für Details & Berechtigungen (`UserID`).
- **`BPA_Formular`**: Anmeldungen.
    - Gelesen: `id`, `FahrtID_ForeignKey` (Link `BPA_Fahrten`), `Vorname`, `Nachname`, `Email`, `Status_Teilnahme`, etc.
    - Aktualisiert: `Status_Teilnahme`.
- **`Users`**: Berechtigungsprüfung.

## 3. API-Endpunkte Details

### `/api/bpa-fahrten` (GET, POST)
- **GET**: Holt Fahrten des MdB (Filter `BPA_Fahrten.UserID`).
- **POST**: Erstellt neue Fahrt, verlinkt MdB (`BPA_Fahrten.UserID`).

### `/api/bpa-fahrten/[fahrtId]` (GET, PUT)
- **GET**: Holt spezifische Fahrt; prüft MdB-Berechtigung.
- **PUT**: Aktualisiert Fahrt; prüft MdB-Berechtigung.

### `/api/bpa-anmeldungen?fahrtId=[fahrtId]` (GET)
- Holt Anmeldungen (`BPA_Formular`) für eine `fahrtId`.
- Prüft MdB-Berechtigung über `BPA_Fahrten.UserID`.

### `/api/bpa-anmeldungen/[anmeldungId]` (PUT)
- Aktualisiert Anmeldung (`BPA_Formular.Status_Teilnahme`).
- Prüft MdB-Berechtigung.

## Wichtige Airtable Feldnamen:
- **`BPA_Fahrten`**: `UserID`, `Fahrt_Datum_von`, `Fahrt_Datum_Bis`, `Zielort`, `Kontingent_Max`, `Status_Fahrt`, `Aktiv`.
- **`BPA_Formular`**: `FahrtID_ForeignKey`, `Vorname`, `Nachname`, `Email`, `Status_Teilnahme`.

## Beobachtungen:
- **Lösch-API für Fahrten fehlt**.
- **Adressfelder-Inkonsistenz**: `Anschrift` (API) vs. `Strasse`/`Hausnummer` (Client-Interface `Anmeldung`).
- **Berechtigungsmodell**: Basiert auf Verknüpfung `Users.RecordID` mit `BPA_Fahrten.UserID`.