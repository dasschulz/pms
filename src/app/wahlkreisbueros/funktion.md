# Wahlkreisbüros - Funktionalität

## Übersicht
Die Wahlkreisbüro-Verwaltung ermöglicht die umfassende Organisation und Darstellung von Wahlkreisbüros einschließlich Personal und Öffnungszeiten in einer erweiterten Kartenansicht.

## Hauptfunktionen

### Erweiterte Kartenansicht
- **Vollständige Darstellung**: Alle Informationen werden direkt auf erweiterten Karten angezeigt
- **Büro-Details**: Name, Adresse, Kontaktdaten und Barrierefreiheit
- **Personal-Übersicht**: Alle Mitarbeiter mit Funktionen und Kontaktdaten
- **Öffnungszeiten**: Vollständige Wochenübersicht mit Uhrzeiten
- **Foto-Integration**: Bürofotos werden prominent angezeigt

### Büro-Verwaltung
- **Erstellung**: Neue Wahlkreisbüros über zentralen Dialog erstellen
- **Bearbeitung**: Vollständige Bearbeitung über tabbasierte Modalansicht
  - Grunddaten-Tab: Büro-Informationen und Bildupload
  - Personal-Tab: Mitarbeiterverwaltung mit CRUD-Operationen
  - Öffnungszeiten-Tab: Wochenplanung der Bürozeiten
- **Löschung**: Sichere Löschung mit Bestätigungsdialog

### Zugriffskontrolle
- **Eigentümer-Rechte**: Nur Ersteller können Büros bearbeiten und löschen
- **Sichtbarkeit**: Alle angemeldeten Nutzer sehen alle Büros
- **Edit-Button**: Erscheint nur für Büro-Eigentümer

### Responsive Design
- **Desktop**: Erweiterte Einzelkarten-Ansicht für maximale Informationsdichte
- **Tablet**: Zwei-spaltige Kartenansicht
- **Mobile**: Gestapelte Einzelkarten-Ansicht
- **Dark/Light Mode**: Vollständige Unterstützung beider Modi

## Technische Implementierung

### APIs
- `GET /api/wahlkreisbueros`: Lädt alle Büros mit erweiterten Details
- `GET /api/wahlkreisbueros/[id]/mitarbeiter`: Mitarbeiterdaten
- `GET /api/wahlkreisbueros/[id]/oeffnungszeiten`: Öffnungszeiten
- `POST/PUT/DELETE /api/wahlkreisbueros`: CRUD-Operationen für Büros

### Datenstruktur
- **Basis-Bürodaten**: Name, Adresse, Kontakt, Barrierefreiheit
- **Personal-Zuordnung**: Mitarbeiter mit Funktionen und Kontaktdaten
- **Öffnungszeiten**: Wochentagsbasierte Zeitplanung
- **Foto-Upload**: Cloudinary-Integration für Bürofotos

### UI-Komponenten
- **WahlkreisbueroForm**: Kompakte Grunddaten-Bearbeitung
- **MitarbeiterManager**: Personal-CRUD mit kompakter Ansicht
- **OeffnungszeitenManager**: Wochenplanung-Interface
- **Skeleton Loading**: Professionelle Ladezustände

## Benutzerführung
- **Übersicht**: Zentrale Kartenansicht mit allen Informationen auf einen Blick
- **Erstellen**: Plus-Button führt zu Erstellungsdialog
- **Bearbeiten**: Edit-Button öffnet tabbbasierte Modalansicht
- **Navigation**: Keine separaten Detail-Seiten, alles in der Übersicht

## **Mehrwert**
Die erweiterte Kartenansicht ermöglicht dem MdB-Büro eine effiziente Übersicht und Verwaltung aller Wahlkreisbüros mit Personal und Öffnungszeiten ohne zusätzliche Navigation. 