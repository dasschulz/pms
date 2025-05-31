# Mitarbeitende - Funktionsbeschreibung

## Überblick
Diese Seite ermöglicht die umfassende Verwaltung der Abgeordneten-Mitarbeiter. Nutzer können Mitarbeitende anlegen, ansehen, bearbeiten und verwalten.

## Hauptfunktionalitäten

### Mitarbeiter-Übersicht
- **Kartendarstellung**: Alle Mitarbeitenden werden in übersichtlichen Karten angezeigt
- **Filteroptionen**: Suche nach Name/E-Mail, Filter nach Eingruppierung und Einsatzort
- **Statistiken**: Übersicht über Gesamtanzahl und Verteilung nach Eingruppierungen
- **Skeleton Loading**: Beim Laden werden Platzhalter-Karten angezeigt

### Mitarbeiter-Erstellung und -Bearbeitung
- **Persönliche Daten**: Name, Adresse, Geburtsdatum, E-Mail (@bundestag.de), Büronummer, Mobilnummer
- **MdB-Zuordnung**: Eine Zuordnung mit Eingruppierung, Zuständigkeit, Einstellungsdatum, optionaler Befristung und Einsatzort
- **Automatische Mehrfach-Zuordnungen**: Beim Erstellen eines Mitarbeiters wird automatisch geprüft, ob bereits eine Person mit gleichem Namen und Geburtsdatum existiert. Falls ja, wird nur eine neue Zuordnung zum bestehenden Mitarbeiter erstellt
- **Einsatzorte**: Bundestag oder bestehende Wahlkreisbüros (dynamisch geladen)
- **Validierung**: Vollständige Formularvalidierung mit Fehlermeldungen

### Mitarbeiter-Details
- **Vollständige Ansicht**: Alle persönlichen Daten und Zuordnungen
- **Kontaktmöglichkeiten**: Direkte Links für E-Mail und Telefon
- **Metadaten**: Erstellungs- und Änderungsdatum

### Verwaltungsfunktionen
- **Bearbeiten**: Vollständige Bearbeitung aller Mitarbeiter-Daten
- **Löschen**: Sicheres Löschen mit Bestätigungsdialog
- **Mehrfach-Zuordnungen**: Unterstützung für Mitarbeiter, die mehreren MdBs zugeordnet sind

## API-Integration
- **GET /api/mitarbeitende**: Lädt alle Mitarbeitenden des aktuellen MdB
- **POST /api/mitarbeitende**: Erstellt neuen Mitarbeiter mit Zuordnungen
- **PUT /api/mitarbeitende/[id]**: Aktualisiert Mitarbeiter-Daten
- **DELETE /api/mitarbeitende/[id]**: Löscht Mitarbeiter oder nur MdB-Zuordnung
- **GET /api/wahlkreisbueros**: Lädt verfügbare Einsatzorte

## Datenbankoperationen
- Verwendung der Views `mitarbeiter_vollstaendig` für optimierte Abfragen
- Transaktionale Operationen für Mitarbeiter und Zuordnungen
- Berücksichtigung von Mehrfach-Zuordnungen beim Löschen

## Benutzerfreundlichkeit
- **Informelle Ansprache**: Verwendung von "du" statt "Sie"
- **Dark/Light Mode**: Vollständige Unterstützung beider Modi
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Toast-Nachrichten**: Feedback für alle Aktionen

## Integration mit Wahlkreisbüros
Mitarbeitende, die einem Wahlkreisbüro zugeordnet sind, erscheinen automatisch auf der entsprechenden Wahlkreisbüro-Karte (/wahlkreisbueros).

## **Mehrwert**
Diese Funktionalität ermöglicht dem MdB-Büro eine professionelle und effiziente Personalverwaltung, wodurch administrative Aufgaben deutlich reduziert und die Teamorganisation optimiert wird. 