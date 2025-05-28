# Funktionsweise Touranfragen (Verwaltung & Linkgenerierung)

Diese Seite ermöglicht es Abgeordneten (MdBs), Anfragen für Wahlkampftouren oder Besuche zu verwalten. Kernstück ist die Generierung eines einzigartigen Formularlinks, der an anfragende Stellen (z.B. Kreisverbände) weitergegeben wird. Über diesen Link können dann konkrete Touranfragen für den MdB eingereicht werden, die anschließend auf dieser Seite erscheinen und verwaltet werden können.

## Kernfunktionen der Seite `/touranfragen`:

- **Formularlink Generieren**:
    - Ein MdB kann einen neuen, einzigartigen Link generieren lassen.
    - Dieser Vorgang ruft `POST /api/touranfragen/generate-link` auf.
    - Der generierte Link (Format: `[Basis-URL]/tour-form/[token]`) wird angezeigt und kann kopiert werden.
- **Anzeigen von Touranfragen**:
    - Listet alle Touranfragen auf, die für den eingeloggten MdB eingegangen sind (vermutlich über das oben genannte Formular).
    - Jede Anfrage wird als Karte dargestellt mit Details wie:
        - Kreisverband, Landesverband, Name des Kandidaten/Anfragenden.
        - Gewünschter Zeitraum (Von/Bis).
        - Themenvorschläge.
        - Angabe, ob Videoaufnahmen gewünscht sind.
        - Kontaktdaten der Ansprechpartner.
        - Status der Anfrage (z.B. 'Neu', 'Eingegangen', 'Terminiert', 'Abgeschlossen').
    - Die Anfragen werden von `GET /api/touranfragen` geladen.
- **Status von Anfragen ändern**:
    - Der Status jeder Anfrage kann direkt auf der Seite über ein Dropdown-Menü geändert werden.
    - Eine Statusänderung ruft `PATCH /api/touranfragen` auf.
    - Anfragen mit dem Status 'Neu' werden beim ersten Laden automatisch auf 'Eingegangen' gesetzt.

## API-Endpunkte und Airtable-Interaktion:

### 1. `GET /api/touranfragen`
- **Zweck**: Abrufen aller Touranfragen für den eingeloggten MdB.
- **Airtable-Tabelle**: `Touranfragen`.
- **Authentifizierung**: Erfordert angemeldeten MdB.
- **Filterung**: Filtert Einträge in `Touranfragen` basierend auf der `UserID` des MdB. Versucht erst direkten numerischen Filter, dann Fallback über Airtable Record ID des Users aus der `Users`-Tabelle und `SEARCH` im `UserID`-Linkfeld der `Touranfragen`-Tabelle.
- **Sortierung**: Nach `Created` (Erstellungsdatum der Anfrage), absteigend.
- **Datenmapping (Airtable-Felder zu UI-Daten)**:
    - `id` (Record ID), `Created` (`createdAt`), `Kreisverband`, `Landesverband`, `Kandidat Name`, `Zeitraum Von`, `Zeitraum Bis`, `Themen`, `Video` (Boolean zu 'Ja'/'Nein'), `Ansprechpartner 1 Name`, `Ansprechpartner 1 Phone`, `Ansprechpartner 2 Name`, `Ansprechpartner 2 Phone copy`, `Programmvorschlag` (Boolean zu Text), `Status`.

### 2. `PATCH /api/touranfragen`
- **Zweck**: Aktualisieren des `Status`-Feldes einer spezifischen Touranfrage.
- **Airtable-Tabelle**: `Touranfragen`.
- **Authentifizierung**: Erfordert angemeldeten MdB.
- **Parameter**: Benötigt `id` (Record ID der Anfrage) und neuen `status`.
- **Aktion**: Aktualisiert das Feld `Status` für den gegebenen Eintrag.

### 3. `POST /api/touranfragen/generate-link`
- **Zweck**: Generiert einen einmaligen Token und speichert diesen mit der MdB-UserID, um ein öffentliches Formular (`/tour-form/[token]`) für Touranfragen zu ermöglichen.
- **Airtable-Tabellen**:
    - `Users`: Zum Abrufen der Airtable Record ID des MdB basierend auf der numerischen `UserID` aus dem Auth-Token.
    - `Touranfragen_Links`: Zum Speichern des generierten Links/Tokens.
- **Authentifizierung**: Erfordert angemeldeten MdB.
- **Aktionen**:
    1. Holt Airtable Record ID des MdB aus `Users`.
    2. Generiert einen 32-Byte hexadezimalen Token (`crypto.randomBytes`).
    3. Erstellt einen neuen Eintrag in `Touranfragen_Links` mit:
        - `UserID` (Link zur Airtable Record ID des MdB in `Users`).
        - `Token` (der generierte Hex-String).
        - `Created` (aktuelles Datum YYYY-MM-DD).
        - `Active` (gesetzt auf `true`).
    4. Gibt den vollständigen Link (`[Basis-URL]/tour-form/[token]`), den Token und die Record ID des Eintrags in `Touranfragen_Links` zurück.

## Verwendete Airtable-Tabellen und wichtige Felder:

- **`Touranfragen`**:
    - `UserID` (Link zur `Users`-Tabelle, kann mehrere Einträge haben)
    - `Created` (Airtable Erstellungsdatum)
    - `Kreisverband`, `Landesverband`, `Kandidat Name`
    - `Zeitraum Von`, `Zeitraum Bis`
    - `Themen`
    - `Video` (Checkbox)
    - `Ansprechpartner 1 Name`, `Ansprechpartner 1 Phone`
    - `Ansprechpartner 2 Name`, `Ansprechpartner 2 Phone copy`
    - `Programmvorschlag` (Checkbox)
    - `Status` (Single Select: 'Neu', 'Eingegangen', 'Terminiert', 'Abgeschlossen')
- **`Users`**:
    - `UserID` (Numerische ID aus dem Authentifizierungssystem)
    - *Airtable Record ID* (implizit für Verknüpfungen genutzt)
- **`Touranfragen_Links`**:
    - `UserID` (Link zur `Users`-Tabelle)
    - `Token` (Text, der generierte einmalige Token)
    - `Created` (Datum)
    - `Active` (Checkbox)

## Datenfluss für neue Anfragen (vermutet):
1. MdB generiert Link über `/touranfragen` (`POST /api/touranfragen/generate-link`). Eintrag in `Touranfragen_Links` entsteht.
2. MdB teilt Link (`.../tour-form/[token]`).
3. Externe Person füllt Formular auf `/tour-form/[token]` aus.
4. Das Absenden dieses Formulars erstellt einen neuen Eintrag in der `Touranfragen`-Tabelle, der mit dem MdB (dessen `UserID` im `Touranfragen_Links`-Eintrag gespeichert ist) verknüpft wird.
5. Die neue Anfrage erscheint dann auf der `/touranfragen`-Seite des MdB.

## Offene To-Dos / Beobachtungen:
- Die genaue Funktionsweise und Airtable-Interaktion der `/tour-form/[token]`-Seite und des zugehörigen Submit-API-Endpunkts (`/api/tour-form/submit`) ist hier nicht analysiert, aber wesentlich für den Gesamtprozess.
- Die Berechtigungsprüfung beim `PATCH`-Aufruf für Statusänderungen ist implizit (Nutzer sieht nur eigene Anfragen), könnte aber serverseitig expliziter gestaltet werden.

## Integrationen

- **Airtable**: Speicherung aller Touranfragen, deren Status, Teilnehmerdaten und zugehöriger Kommunikation.
- **Tour-Formular (`/tour-form/[token]`)**: Empfang der finalen Anmeldedaten von Teilnehmern.
- **Kalendersystem**: Blockierung von Terminen und Eintragung bestätigter Touren.
- **E-Mail-System**: Für die Kommunikation mit Anfragestellern.
- **Besucherdienst des Bundestages**: Ggf. Abgleich mit den Kapazitäten und Regeln des offiziellen Besucherdienstes.

## Offene To-Dos und Implementierungsideen

- Entwicklung eines Dashboards mit Statistiken zu Anfragen und durchgeführten Touren.
- Implementierung eines Systems zur (teil-)automatischen Zuweisung von Terminen basierend auf Präferenzen und Verfügbarkeiten.
- Vorlagen für Standard-E-Mails (Bestätigung, Absage, Erinnerung).
- Funktion zur Erstellung von Namensschildern oder Teilnehmerlisten für die Tour-Guides.
- Feedback-Mechanismus nach durchgeführten Touren.
- Anbindung an `/api/touranfragen/generate-link` und Logik für die Token-Erstellung. 