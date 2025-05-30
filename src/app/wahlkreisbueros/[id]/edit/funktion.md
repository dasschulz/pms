# Wahlkreisbüro Bearbeiten - Funktionalität

## Überblick
Diese Seite ermöglicht es MdB-Büros, alle Aspekte eines Wahlkreisbüros an einem zentralen Ort zu bearbeiten. Das System kombiniert Grunddaten-Bearbeitung mit erweiterten Verwaltungsfunktionen für Mitarbeiter und Öffnungszeiten.

## Hauptfunktionen

### Grundinformationen bearbeiten
- **Bürodaten**: Name, Adresse, Kontaktinformationen
- **Zusatzinformationen**: Barrierefreiheit-Status, Notizen, Website
- **Validierung**: Automatische Prüfung der Eingabedaten
- **Speicherung**: Sofortige Aktualisierung mit Erfolgsmeldung

### Mitarbeiterverwaltung
- **Vollständige CRUD-Operationen**: Erstellen, Lesen, Aktualisieren, Löschen
- **Mitarbeiterdetails**: Name, Funktion, Telefon, E-Mail
- **Funktionsauswahl**: Vordefinierte Rollen oder individuelle Eingabe
- **Sicherheitsdialoge**: Bestätigung bei Löschvorgängen

### Öffnungszeiten verwalten
- **Wochenplanung**: Separate Einstellungen für jeden Wochentag
- **Flexible Zeiten**: Öffnung/Schließung oder Geschlossen-Markierung
- **Konfliktprüfung**: Verhindert doppelte Einträge pro Wochentag
- **Zeitvalidierung**: Logikprüfung der Öffnungszeiten

### Navigation und Benutzerführung
- **Breadcrumb-Navigation**: Zurück zu Details oder Übersicht
- **Live-Updates**: Automatische Aktualisierung nach Änderungen
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Skeleton Loading**: Professionelle Ladezustände

## API-Operationen
- `GET /api/wahlkreisbueros/[id]` - Laden der Büro-Grunddaten
- `PUT /api/wahlkreisbueros/[id]` - Aktualisierung der Grunddaten
- `GET/POST /api/wahlkreisbueros/[id]/mitarbeiter` - Mitarbeiterverwaltung
- `PUT/DELETE /api/wahlkreisbueros/[id]/mitarbeiter/[mitarbeiterId]` - Einzelmitarbeiter
- `GET/POST /api/wahlkreisbueros/[id]/oeffnungszeiten` - Öffnungszeiten
- `PUT/DELETE /api/wahlkreisbueros/[id]/oeffnungszeiten/[zeitId]` - Einzelzeiten

## Benutzerinteraktion
Die Seite ist in thematische Bereiche unterteilt, die unabhängig voneinander bearbeitet werden können. Alle Änderungen werden sofort gespeichert und dem Nutzer bestätigt. Fehlermeldungen sind aussagekräftig und helfen bei der Problemlösung.

## Sicherheit
- **Authentifizierung**: Anmeldung über NextAuth erforderlich
- **Autorisierung**: Nur Eigentümer können ihre Büros bearbeiten
- **Validierung**: Umfassende Eingabeprüfung auf Client- und Server-Seite
- **Bestätigungsdialoge**: Schutz vor versehentlichen Löschungen

## Erweiterte Features
Platzhalter für zukünftige Funktionen wie MdB-Sprechstunden und Beratungsservices sind bereits implementiert und werden schrittweise aktiviert.

## **Mehrwert**
Die zentrale Bearbeitungsseite macht die Verwaltung von Wahlkreisbüros effizient und benutzerfreundlich, indem alle relevanten Funktionen an einem Ort verfügbar sind und die Büro-Organisation erheblich vereinfacht wird. 