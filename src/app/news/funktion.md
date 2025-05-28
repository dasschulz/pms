# Funktionsweise News

Diese Seite dient der Anzeige von Nachrichtenartikeln. Sie unterscheidet zwischen allgemeinen Themen-News und personalisierten News, die auf den Namen des eingeloggten Nutzers zugeschnitten sind.

## Kernfunktionen

- **Nachrichtenanzeige**: Stellt Nachrichten in einem Kartenlayout dar, inklusive Titel, Quelle, Snippet, Bild und Link zum Originalartikel.
- **Detailansicht**: Ein Klick auf eine Nachricht öffnet einen Modal (Dialog) mit dem vollständigen Inhalt (`fullContent`).
- **Inhaltstypen-Umschaltung**: Nutzer können mittels eines Toggles zwischen zwei Arten von News wechseln:
    - **"Themen-News"**: Zeigt aktuell eine statische Liste von Nachrichten an, die direkt in der Frontend-Komponente (`placeholderNews` in `page.tsx`) definiert sind. Diese dienen vermutlich als Fallback oder zur Demonstration. Die Artikel sind Themen wie "Wohnen", "Umwelt", "Arbeit & Soziales" zugeordnet.
    - **"Personen-News"**: Zeigt Nachrichten an, die dynamisch basierend auf dem Namen des eingeloggten Benutzers (`session.user.name`) gesucht werden. Die Suchanfrage lautet typischerweise "[Nutzername] Die Linke".
- **Pagination für Personen-News**: Für die Personen-News wird eine Paginierungsfunktion verwendet, um Artikel nachzuladen, wenn der Nutzer weitere Seiten anfordert.
- **Ladezustände**: Während des Ladens von Personen-News werden Skeleton-Cards angezeigt.

## Datenquellen und API-Nutzung

- **Themen-News**:
    - Quelle: Statische Daten (`placeholderNews`) in `src/app/news/page.tsx`.
    - Keine externe API-Anfrage für diese Kategorie.
- **Personen-News**:
    - Quelle: Externe Nachrichten-API **NewsData.io**.
    - API-Endpunkt: Der Frontend-Code ruft den internen API-Endpunkt `/api/news` auf.
    - `/api/news` (`src/app/api/news/route.ts`):
        - Nimmt einen `query` (z.B. "Max Mustermann Die Linke") und optional einen `nextPageCursor` entgegen.
        - Verwendet den `NEWSDATA_API_KEY` aus den Umgebungsvariablen für die Authentifizierung bei NewsData.io.
        - Ruft die URL `https://newsdata.io/api/1/news` auf.
        - Mappt die Antwortfelder von NewsData.io auf die `NewsItem`-Struktur:
            - `id`: `article.article_id`
            - `title`: `article.title`
            - `link`: `article.link`
            - `source`: `article.source_id` / `article.source_url`
            - `source_icon`: `article.source_icon`
            - `imageUrl`: `article.image_url`
            - `snippet`: `article.description`
            - `fullContent`: `article.content` oder `article.description`
            - `date`: `article.pubDate`
            - `politicalArea`: Wird im API-Mapping für Personen-News leer gelassen.
            - `type`: Wird im API-Mapping als `"person"` gesetzt.
        - Gibt die gemappten Artikel (`items`), die Gesamtanzahl (`totalItems`) und den nächsten Cursor (`nextPageCursor`) zurück.

## Airtable Integration

- **Keine direkte Airtable-Nutzung** ist in der aktuellen Implementierung der News-Seite oder des zugehörigen API-Endpunkts ersichtlich. Die Daten stammen entweder aus statischen Platzhaltern oder von der externen NewsData.io API.

## Offene To-Dos und Implementierungsideen (basierend auf Analyse)

- **Themen-News dynamisch gestalten**: Aktuell sind Themen-News statisch. Es könnte überlegt werden, diese ebenfalls aus einer externen Quelle oder einer internen Datenbank (z.B. Airtable, falls gewünscht) zu laden.
- **Fehlerbehandlung erweitern**: Detailliertere Fehlermeldungen für den Nutzer, falls NewsData.io nicht erreichbar ist oder keine Ergebnisse liefert.
- **Quellen-Management für Themen-News**: Wenn Themen-News dynamisch werden, ist eine Verwaltung der Quellen und Inhalte notwendig.
- **Caching**: Implementierung von Caching-Strategien für die API-Antworten von NewsData.io, um API-Limits zu schonen und die Ladezeiten zu verbessern.
- **Political Area für Personen-News**: Das Feld `politicalArea` wird für Personen-News aktuell nicht befüllt. Es könnte überlegt werden, ob hier eine Logik zur thematischen Zuordnung implementiert werden soll.
- **Konsistenz der Datumsformate**: Sicherstellen, dass Datumsangaben einheitlich verarbeitet und angezeigt werden. 