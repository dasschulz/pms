# Funktionsweise Gegner-Recherche ("Tscheka")

Die Seite `/gegner-recherche` (intern und im Navigationsmenü als "Tscheka" bezeichnet) ist ein Werkzeug zur Recherche von Informationen über politische Akteure. Es aggregiert Daten aus verschiedenen Quellen (primär Abgeordnetenwatch.de und Wikipedia) und ermöglicht die Erstellung eines PDF-Dossiers über die ausgewählte Person.

## Kernfunktionen

1.  **Politiker suchen**:
    *   Ein Suchfeld ermöglicht die Namenssuche nach Politikern.
    *   Die Suche löst eine Anfrage an `GET /api/politicians?name=[name]` aus.
    *   Zeigt eine Liste passender Politiker mit Bild, Name und Partei an.

2.  **Detailansicht eines Politikers**:
    *   Nach Auswahl eines Politikers aus der Liste werden detaillierte Informationen geladen und angezeigt.
    *   **Datenquellen**:
        *   **Abgeordnetenwatch.de**: Umfassende Daten über `GET /api/politicians/[id]?parliamentId=[parliamentId]`.
        *   **Wikipedia.de**: Zusammenfassungen, Kontroversen, politische Positionen und Profilbild über `GET /api/wikipedia?name=[name]`.
    *   **Angezeigte Informationen**:
        *   Allgemeine Infos: Name, Alter, Geburtsdatum, Partei, Fraktion, Wahlkreis, Profilbild (mit Zoom-Effekt beim Hovern).
        *   Links zu sozialen Medien, persönlicher Webseite und Wikipedia-Seite.
        *   Wikipedia-Inhalte: Einleitung, politische Positionen, Kontroversen (als HTML gerendert).
        *   Parlamentarische Arbeit: Ausschussmitgliedschaften, Nebentätigkeiten.
        *   Abstimmungsverhalten: Liste von Abstimmungen mit Thema, Entscheidung des Politikers und Link zur entsprechenden Abstimmung auf Abgeordnetenwatch.de.
    *   **"Tschekisten-Alarm"**: Wenn ein Politiker der Partei "DIE LINKE" ausgewählt wird, erscheint eine ironische Toast-Benachrichtigung.

3.  **PDF-Dossier generieren**:
    *   Ein Button "PDF Dossier erstellen" startet die Generierung eines zusammenfassenden PDF-Dokuments für den ausgewählten Politiker.
    *   Löst eine Anfrage an `POST /api/dossier/generate` aus, die alle gesammelten Daten des Politikers enthält.
    *   Das generierte PDF kann anschließend heruntergeladen werden.

## API-Endpunkte und Dateninteraktionen

### 1. `GET /api/politicians?name=[name]`
-   **Zweck**: Sucht nach Politikern auf Abgeordnetenwatch.de.
-   **Externe Quelle**: `https://www.abgeordnetenwatch.de/api/v2/politicians`.
-   **Logik**: Fragt die Abgeordnetenwatch-API nach Politikern ab, die dem `name` entsprechen. Versucht, die Ergebnisse mit Informationen zur Legislaturperiode anzureichern (ggf. durch weitere API-Aufrufe oder Standardwerte für den Bundestag).
-   **Antwort**: Liste von Politiker-Objekten.

### 2. `GET /api/politicians/[id]?parliamentId=[parliamentId]`
-   **Zweck**: Ruft detaillierte Informationen zu einem spezifischen Politiker von Abgeordnetenwatch.de ab.
-   **Externe Quelle**: `https://www.abgeordnetenwatch.de/api/v2/politicians/[id]` sowie diverse verknüpfte Endpunkte (für Ausschüsse, Nebentätigkeiten, Abstimmungen, Mandate etc.).
-   **Logik**: Führt eine Hauptanfrage für den Politiker durch und zahlreiche parallele Anfragen für zugehörige Daten. Konsolidiert diese Informationen und versucht, den korrekten Kontext der Legislaturperiode zu ermitteln. Fehler bei Teilanfragen (z.B. keine Nebentätigkeiten vorhanden) werden abgefangen und in die Antwortstruktur integriert.
-   **Antwort**: Ein umfassendes JSON-Objekt mit allen verfügbaren Daten zum Politiker, inklusive Fehlerinformationen für einzelne Datenpunkte.

### 3. `GET /api/wikipedia?name=[name]`
-   **Zweck**: Ruft und verarbeitet Inhalte von der deutschen Wikipedia-Seite eines Politikers.
-   **Externe Quelle**: `https://de.wikipedia.org/w/api.php`.
-   **Logik**:
    1.  Sucht die passende Wikipedia-Seite.
    2.  Extrahiert das Hauptbild und dessen Attributierung.
    3.  Extrahiert spezifische HTML-Abschnitte (Einleitung, "Kontroversen", "Politische Positionen") anhand gängiger deutscher Überschriften.
    4.  **HTML-Bereinigung**: Nutzt `cheerio` serverseitig, um das HTML zu säubern: Entfernt Bearbeitungslinks, Bilder, Thumbnails, Referenzlisten (Einzelnachweise, Literatur etc.). Versucht, Zitat-Links (`<sup>`) entweder in direkte externe Links umzuwandeln (falls eine externe Quelle in der Referenzliste gefunden wird) oder sie auf die Wikipedia-Referenz zu verlinken.
-   **Antwort**: JSON-Objekt mit Name, Wikipedia-URL, Bild-URL, Bildattributierung und dem bereinigten HTML der angeforderten Abschnitte.

### 4. `POST /api/dossier/generate`
-   **Zweck**: Erstellt ein PDF-Dossier aus den übergebenen Politikerdaten.
-   **Bibliotheken**: `pdf-lib`, `fontkit`.
-   **Authentifizierung**: Erfordert eine aktive Benutzersitzung.
-   **Airtable-Interaktion**: Ruft `Name` und `Organisation` des angemeldeten Benutzers aus der `Users`-Tabelle ab, um diese Information im PDF-Footer zu platzieren ("Erstellt von [Name], [Organisation] am [Datum]").
-   **Logik**:
    1.  Lädt benutzerdefinierte Schriftarten.
    2.  Erstellt ein PDF-Dokument mit `pdf-lib`.
    3.  **Layout und Inhalt des PDFs**:
        *   Strukturierte Anordnung der Informationen: Persönliche Daten, Social Media, Wikipedia-Texte (Einleitung, Positionen, Kontroversen), Ausschüsse, Nebentätigkeiten, Abstimmungsverhalten.
        *   Verwendet benutzerdefinierte Schriftarten und -größen, behandelt Textumbruch.
        *   Fügt Seitenzahlen ("Seite X von Y") und ein Logo (`/public/images/logo_rw.png` oder Platzhalter) im Footer jeder Seite hinzu.
        *   Fügt eine Zeile mit Erstellerinformationen (Name, Organisation, Datum) im Footer hinzu.
    4.  Serialisiert das PDF und gibt es als Base64-kodierten String mit einem Dateinamen zurück.

## Verwendete Airtable-Tabellen

-   **`Users`**: Wird von `/api/dossier/generate` genutzt, um `Name` und `Organisation` des Dossier-Erstellers für den PDF-Footer abzurufen.

## Integrationen

-   **Abgeordnetenwatch.de API**: Hauptquelle für Politikerdaten, Mandate, Abstimmungen, etc.
-   **Wikipedia.de API**: Quelle für biografische Texte, politische Positionen und Kontroversen.
-   **Airtable**: Für Benutzerinformationen im PDF-Dossier.

## Besondere Hinweise

-   Der Begriff "Tscheka" wird im Frontend (Navigation, Toast-Nachricht) verwendet und verweist auf diese Funktionalität, die offiziell "Gegner-Recherche" heißt.
-   Die Komplexität liegt vor allem in der Aggregation und Aufbereitung von Daten aus multiplen externen Quellen sowie der dynamischen PDF-Generierung.
-   Die HTML-Bereinigung für Wikipedia-Inhalte ist umfangreich, um eine saubere Darstellung im UI und PDF zu gewährleisten. 