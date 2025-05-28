# Funktionsweise Dokumentensuche

Die Seite `/dokumentensuche` ermöglicht eine detaillierte Suche im "Dokumentations- und Informationssystem für Parlamentsmaterialien" (DIP) des Deutschen Bundestages. Nutzer können nach verschiedenen Dokumenttypen wie Drucksachen, Plenarprotokollen und weiteren parlamentarischen Vorgängen suchen und die Ergebnisse filtern.

## Kernfunktionen

- **Suchanfrage**: Eingabefeld für freie Suchbegriffe (z.B. "Klimaschutz", "Digitalisierung").
- **Filteroptionen**:
    - **Grundfilter**:
        - **Dokumenttyp**: Auswahl aus "Drucksachen", "Plenarprotokolle", "Aktivitäten", "Vorgänge", "Personen".
        - **Wahlperiode**: Auswahl der Legislaturperiode (z.B. "20. Wahlperiode").
    - **Erweiterte Filter**:
        - **Datum von/bis**: Eingrenzung des Suchzeitraums.
        - **Urheber**: Filterung nach dem Urheber des Dokuments (z.B. Fraktion, MdB).
- **Suchausführung**: Die Suche wird durch Klick auf "Suchen" oder Enter ausgelöst und sendet eine Anfrage an den Backend-Endpunkt `/api/dip-search`.
- **Ergebnisanzeige**:
    - Auflistung der gefundenen Dokumente in Kartenform.
    - Jede Karte zeigt relevante Informationen wie Titel, Untertitel, Dokumenttyp, Datum, Drucksachennummer, Wahlperiode, Herausgeber, Urheber.
    - Ein Link zur PDF-Version des Dokuments wird angezeigt, falls vorhanden (`fundstelle.pdf_url`).
- **Pagination**: Anzeige der Gesamtzahl der Ergebnisse und Navigation durch die Ergebnisseiten (Vor/Zurück-Buttons).

## API-Endpunkte und Datenfluss

### 1. Client-Seite (`DokumentensuchePage.tsx`)
- Sammelt Suchbegriff und Filterwerte vom Nutzer.
- Bei Suchauslösung: Baut eine Anfrage an `GET /api/dip-search`.
    - Suchbegriff wird als `q` Parameter übergeben.
    - Filter werden als JSON-String im `f` Parameter übergeben.
    - Paginierungsparameter `num` (Anzahl Ergebnisse) und `start` (Offset) werden ebenfalls gesendet.
- Verarbeitet die Antwort und zeigt die Ergebnisse oder eine Fehlermeldung an.

### 2. `GET /api/dip-search` (`src/app/api/dip-search/route.ts`)
- **Zweck**: Dient als Proxy und Query-Builder für die offizielle DIP-API.
- **Externe API**: `https://search.dip.bundestag.de/api/v1`.
- **API-Schlüssel**: Benötigt einen `DIP_API_KEY` aus den Umgebungsvariablen (`.env.local`). Hinweise zur Beschaffung sind im Codekommentar enthalten (E-Mail an `infoline.id3@bundestag.de`).
- **Verarbeitung**:
    1.  Überprüft das Vorhandensein des `DIP_API_KEY`.
    2.  Parst die übergebenen Filter (`f` Parameter).
    3.  **Wählt den API-Pfad basierend auf `documentType`**:
        - `/drucksache-text` (Standard)
        - `/plenarprotokoll-text` (wenn `documentType` "Plenarprotokoll" ist).
        - *Andere Dokumenttypen aus dem Frontend (Aktivitäten, Vorgänge, Personen) werden aktuell nicht explizit auf andere API-Pfade gemappt und würden daher den Standardpfad nutzen oder potenziell nicht die erwarteten Ergebnisse liefern.*
    4.  **Konstruiert die Anfrageparameter für die DIP-API**:
        - `rows` (aus `num`), `offset` (aus `start`), `format: 'json'`, `apikey`.
        - `f.titel` (aus `q`).
        - `f.wahlperiode` (aus Filter).
        - `f.datum.start` und `f.datum.end` (aus Datumsfiltern).
        - `f.urheber` (aus Urheber-Filter, nur bei `/drucksache-text`).
    5.  Sendet die Anfrage an die DIP-API.
    6.  Verarbeitet die Antwort: Prüft auf Fehler (z.B. ungültiger API-Key), parst das JSON.
    7.  **Transformiert die Dokumentdaten** in das von der Frontend-Komponente erwartete Format (`DIPDocument`-Interface). Dies beinhaltet das Mapping von Feldern wie `id`, `titel`, `dokumentart`, `datum`, `drucksachetyp`, `nummer`, `wahlperiode`, `herausgeber`, `fundstelle`, `urheber` etc.
    8.  Gibt eine JSON-Antwort zurück, die `success` (boolean), `documents` (Array), `numFound` (Gesamtzahl), `start` und `num` enthält.

## Airtable-Interaktion

- **Keine.** Die Funktionalität der Dokumentensuche basiert vollständig auf der externen DIP-API. Es findet keine Speicherung oder Abfrage von Daten aus Airtable statt.

## Integrationen

- **Externe DIP API**: `https://search.dip.bundestag.de/api/v1` (Bundestag Dokumentations- und Informationssystem).

## Offene To-Dos / Beobachtungen

- Die Unterstützung im Backend (`/api/dip-search`) für andere Dokumenttypen als "Drucksache" und "Plenarprotokoll" (z.B. "Aktivitäten", "Vorgänge", "Personen") scheint nicht vollständig implementiert zu sein, da keine spezifischen API-Pfade oder Parameteranpassungen für diese Typen vorgenommen werden. Dies könnte dazu führen, dass die Filterung nach diesen Typen nicht wie erwartet funktioniert.
- Ein gültiger `DIP_API_KEY` muss in den Umgebungsvariablen vorhanden sein, damit die Suche funktioniert. 