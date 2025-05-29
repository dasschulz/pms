# Funktionsweise Tagesordnung

Die Seite `/tagesordnung` zeigt die aktuelle und zukünftige Tagesordnung des Deutschen Bundestages in einer Kalenderansicht. Sie ermöglicht es Nutzern, sich einen Überblick über geplante Sitzungen, Debatten und andere parlamentarische Aktivitäten zu verschaffen.

## Kernfunktionen

- **Kalenderansicht**: Stellt Tagesordnungspunkte (TOPs) in einer interaktiven Kalenderdarstellung dar.
    - **Wochenansicht (`WeekView.tsx`)**: Zeigt eine 7-Tage-Übersicht. Tage der Woche sind klickbar, um zur Tagesansicht des gewählten Tages zu wechseln oder diesen für andere Aktionen auszuwählen.
    - **Tagesansicht (`DayView.tsx`)**: Zeigt eine detaillierte Zeitachse für einen ausgewählten Tag. Ereignisse werden entsprechend ihrer Dauer und Startzeit visualisiert, wobei versucht wird, Überlappungen durch nebeneinander oder untereinander Anordnen zu lösen. Enthält eine "Jetzt"-Linie, die die aktuelle Uhrzeit anzeigt.
- **Navigation**:
    - Wechsel zwischen Wochen- und Tagesansicht.
    - Blättern zum vorherigen/nächsten Tag oder zur vorherigen/nächsten Woche.
    - "Heute"-Button, um direkt zum aktuellen Datum zu springen.
    - Auswahl eines spezifischen Datums über ein Kalender-Popup in der Tagesansicht.
- **Datenquelle**: Die Tagesordnungsdaten werden von einer externen API bezogen (`https://api.hutt.io/bt-to/json`) über den serverseitigen Endpunkt `/api/bundestag`.
- **Detailansicht**: Durch Klick auf einen Tagesordnungspunkt öffnet sich ein Modal (`AgendaDetailsModal`) mit weiteren Informationen zum Termin (z.B. Beschreibung, TOP-Nummer, Status, URL).
- **Visuelle Hervorhebungen**:
    - **"Die Linke"-Termine**: Tagesordnungspunkte, deren Titel oder Beschreibung "Die Linke" enthalten, werden in der Wochen- und Tagesansicht mit einem roten Rahmen besonders hervorgehoben. Vergangene Termine der Linken erhalten einen spezifischen Rotton (`hsl(326 100% 22%)`).
    - **Status-Badges**: Bestimmte Status von Terminen (z.B. "angenommen", "abgelehnt", "überwiesen") werden mit farbigen Badges in der Wochenansicht angezeigt.
    - Aktueller Tag wird visuell betont.

## API-Endpunkte und Datenfluss

### 1. Client-Seite (`TagesordnungCalendar.tsx`)
- Ruft `loadAgendaData()` auf, welche die Methode `fetchAgenda()` der Klasse `BundestagAPI` (`@/lib/bundestag-api.ts`) nutzt.
- `BundestagAPI.fetchAgenda()` macht einen internen Fetch-Aufruf an den Next.js API-Endpunkt `/api/bundestag`.

### 2. `GET /api/bundestag` (`src/app/api/bundestag/route.ts`)
- **Zweck**: Dient als Proxy-Endpunkt zum Abrufen von Tagesordnungsdaten.
- **Aktion**: Sendet eine GET-Anfrage an die externe API `https://api.hutt.io/bt-to/json`.
- **Antwort**: Leitet die JSON-Antwort der externen API an den Client weiter.
- **Datenmapping in `BundestagAPI`**: Die `fetchAgenda()` Methode mappt die Felder der `hutt.io`-API auf das `BundestagAgendaItem`-Interface:
    - `id` ← `uid`
    - `title` ← `thema`
    - `description` ← `beschreibung`
    - `start` ← `start` (ISO-Datumsstring)
    - `end` ← `end` (ISO-Datumsstring)
    - `top` ← `top` (Tagesordnungspunkt-Nummer)
    - `type` ← Hardcoded auf `'agenda'`
    - `status` ← `status`
    - `url` ← `url`
    - `namentliche_abstimmung` ← `namentliche_abstimmung` (Info zur namentlichen Abstimmung)

### 3. `GET /api/tagesordnung/next-linke` (`src/app/api/tagesordnung/next-linke/route.ts`)
- **Zweck**: Findet den nächsten bevorstehenden Tagesordnungspunkt, der für "Die Linke" relevant ist.
- **Authentifizierung**: Erfordert eine aktive Benutzersitzung.
- **Ablauf**:
    1. Ruft alle Tagesordnungsdaten über `BundestagAPI.fetchAgenda()` ab.
    2. Filtert die Daten nach Terminen, die in der Zukunft liegen UND deren Titel "linke" oder "die linke" (case-insensitive) enthält.
    3. Sortiert die gefilterten Termine chronologisch nach ihrem Startdatum.
    4. Gibt den ersten Termin dieser sortierten Liste (den nächstgelegenen) oder `null` zurück.
- **Verwendung**: Dieser Endpunkt wird wahrscheinlich an anderer Stelle in der Anwendung genutzt (z.B. Dashboard), um auf den nächsten Termin der Linksfraktion hinzuweisen.

## Supabase-Interaktion

- **Keine.** Diese Funktion ist vollständig von der externen `hutt.io`-API abhängig und nutzt keine Supabase-Tabellen für die Tagesordnungsdaten.

## Integrationen

- **Externe API**: `https://api.hutt.io/bt-to/json` (primäre Datenquelle für Tagesordnungspunkte).

## Offene To-Dos / Beobachtungen

- Die Komponente `AgendaDetailsModal` wurde nicht im Detail analysiert, ihre Funktion (Anzeige von Details zu einem Tagesordnungspunkt) ist jedoch klar.
- Die Logik zur Berechnung der Kartenpositionen und -höhen in `DayView.tsx` ist relativ komplex, um eine ansprechende Visualisierung auch bei vielen oder überlappenden Terminen zu gewährleisten. 