# Referent:innen-Pool Funktionalität

## Überblick
Der Referent:innen-Pool ist ein System zur Verwaltung von Expert:innen und Referent:innen für parlamentarische Arbeit. Das System ermöglicht die strukturierte Erfassung, Verwaltung und Suche von Fachleuten aus verschiedenen Bereichen.

## Kernfunktionalitäten

### Referent:innen verwalten
- **Hinzufügen**: Neue Referent:innen mit vollständigen Profildaten anlegen
- **Bearbeiten**: Bestehende Referent:innen-Profile aktualisieren
- **Löschen**: Referent:innen mit Bestätigungsdialog entfernen
- **Anzeigen**: Responsive Grid-Layout mit kompakten Karten (3 Spalten auf Desktop)

### Datenfelder pro Referent:in
- **Persönliche Daten**: Titel (optional), Vorname, Nachname
- **Fachliche Zuordnung**: Fachbereiche (Mehrfachauswahl), Institution, Ort
- **Kontaktdaten**: E-Mail, Telefonnummer
- **Verfügbarkeit**: Anhörungen, Veranstaltungen, Beratung
- **Politische Zuordnung**: Parteimitgliedschaft (Die Linke)
- **Datenschutz**: Zustimmung zur Datenspeicherung, Kontakt durch andere MdB

### Such- und Filterfunktionen
- **Volltext-Suche**: Namen, Fachbereiche, Institutionen, Orte
- **Fachbereich-Filter**: Dropdown zur gezielten Filterung
- **Echtzeit-Filterung**: Sofortige Ergebnisse beim Tippen

### Statistiken und Übersicht
- **Dashboard-Karten**: Gesamtanzahl, Verfügbarkeit nach Typ
- **Visuelle Indikatoren**: Icons und Farben für verschiedene Kategorien
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile

### Privacy-Features
- **Sichtbarkeitssteuerung**: Referent:innen nur für bestimmte MdB sichtbar
- **Einverständniserklärungen**: Explizite Zustimmung für Datenspeicherung
- **Datenschutz-konforme Verwaltung**: DSGVO-konforme Datenhandhabung

### Benutzerinteraktion
- **Intuitive Bedienung**: Informelle Ansprache ("du")
- **Skeleton Loading**: Saubere Ladezustände
- **Responsive Modals**: Mobile-optimierte Dialoge
- **Dark/Light Mode**: Vollständige Theme-Unterstützung

## API-Endpunkte
- `GET /api/referentenpool`: Abrufen aller Referent:innen (mit Privacy-Filter)
- `POST /api/referentenpool`: Neue:n Referent:in erstellen
- `PUT /api/referentenpool/[id]`: Referent:in aktualisieren
- `DELETE /api/referentenpool/[id]`: Referent:in löschen

## Datenbankoperationen
- **Tabelle**: `referenten` mit vollständiger Supabase-Integration
- **Row Level Security**: Implementiert für Datenschutz
- **Foreign Key Constraints**: Verknüpfung mit `users` Tabelle
- **Array-Felder**: PostgreSQL Arrays für Fachbereiche und Verfügbarkeit

## Benutzererwartungen
- Schnelle Suche und Filterung von Expert:innen
- Einfache Verwaltung von Kontaktdaten
- Übersichtliche Darstellung in kompakten Karten
- Datenschutz-konforme Handhabung von Kontaktdaten
- Responsive Nutzung auf allen Geräten

## Mehrwert für das MdB-Büro
**Professionelle Vernetzung mit Expert:innen ermöglicht qualifiziertere parlamentarische Arbeit durch strukturierten Zugang zu Fachwissen für Anhörungen, Veranstaltungen und Beratungsgespräche.** 