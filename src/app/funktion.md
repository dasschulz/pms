# Dashboard - Übersicht und Widget-Management

## Hauptfunktionalität

Das Dashboard bildet die zentrale Schaltstelle der MdB-App und zeigt wichtige Informationen auf einen Blick. Nutzer können ihre Widgets individuell konfigurieren, per Drag & Drop anordnen und bei Bedarf ein- oder ausblenden.

## Verfügbare Widgets

### Informations-Widgets
- **Wetter**: Zeigt aktuelle Wetterdaten für Berlin und den Wahlkreis
- **Zugverbindungen**: Bahnverbindungen zwischen wichtigen Orten
- **Letzte Rede**: Die neueste Parlamentsrede des eingeloggten MdBs mit Abspielmöglichkeit
- **Videodreh**: Nächster anstehender Videotermin aus der Videoplanung
- **Kommunikationslinien**: Aktuelle Argumentationshilfen mit Hauptthema und Zahl der Woche

### Aktivitäts-Widgets
- **Letzte Aktivitäten**: Übersicht über kürzlich generierte Dokumente

## Benutzerinteraktion

### Widget-Konfiguration
1. Klick auf das Einstellungen-Symbol (Zahnrad) oben rechts
2. Dropdown-Menü öffnet sich mit allen verfügbaren Widgets
3. Haken setzen/entfernen um Widgets ein-/auszublenden
4. Änderungen werden automatisch gespeichert

### Widget-Anordnung
1. Mit der Maus über ein Widget hovern
2. Grip-Symbol (≡) erscheint oben rechts
3. Widget per Drag & Drop an gewünschte Position ziehen
4. Neue Reihenfolge wird automatisch gespeichert

## API-Aufrufe

Das Dashboard nutzt folgende APIs:
- **Benutzereinstellungen**: `/api/user-preferences` (GET/POST) für Widget-Konfiguration
- **Wetterdaten**: Externe Wetter-API für aktuelle Daten
- **Bahnverbindungen**: Deutsche Bahn API für Zugverbindungen  
- **Reden**: `/api/reden` für die neueste Rede des MdBs
- **Videoplanung**: Task-Manager API für anstehende Videodrehs
- **Kommunikationslinien**: Supabase RPC `get_communication_lines_with_details` für aktuelle Argumentationshilfen

## Datenpersistierung

Alle Widget-Einstellungen (aktive Widgets, Reihenfolge) werden in der `user_preferences` Tabelle gespeichert und bei jedem Laden der Seite wiederhergestellt.

## Mehrwert

Das Dashboard verschafft MdBs einen schnellen und personalisierbaren Überblick über alle relevanten Informationen und anstehende Termine, wodurch der Büroalltag effizienter organisiert werden kann. 