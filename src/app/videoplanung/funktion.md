# Funktionsweise Videoplanung

Diese Seite ermöglicht es MdB-Nutzern, ihre Video-Projekte zu verwalten und von der Idee bis zur Veröffentlichung zu begleiten. Das System bietet zwei Ansichten für die Aufgabenverwaltung: eine Listen- und eine Kanban-Ansicht.

## Kernfunktionen (Nutzerperspektive)

### Aufgabenverwaltung
- **Aufgaben erstellen**: Neue Video-Projekte mit Titel, Beschreibung, Priorität und Fälligkeitsdatum anlegen
- **Status-Tracking**: Verfolgung des Produktionsfortschritts in fünf Phasen:
  - Brainstorming (grau)
  - Skript (dunkelrot)
  - Dreh (hellrot)
  - Schnitt (gelb)
  - Veröffentlichung (grün)
- **Prioritätsverwaltung**: Aufgaben nach Dringlichkeit (Dringend, Hoch, Normal, Niedrig) kategorisieren
- **Fälligkeitsdaten**: Deadline-Verwaltung mit visueller Hervorhebung überfälliger Aufgaben

### Ansichtsmodi
- **Listen-Ansicht**: Traditionelle Tabellenansicht mit allen Aufgabendetails
- **Kanban-Ansicht**: Visuelles Board mit Spalten für jeden Produktionsstatus
  - **Drag & Drop**: Aufgaben per Drag & Drop zwischen Spalten verschieben
  - **Placeholder-Karten**: Schnelle Aufgabenerstellung direkt in gewünschter Spalte
  - **Responsive Design**: Horizontales Scrollen bei begrenzter Bildschirmbreite
  - **Erledigt-Markierung**: Grüner Checkmark-Button bei "Veröffentlichung"-Aufgaben zum direkten Abschließen
- **Persistente Ansichtswahl**: Ausgewählte Ansicht wird automatisch gespeichert und bei Seitenwechseln/Sessions beibehalten

### Erweiterte Funktionen
- **Subtask-System**: Hauptaufgaben können Unteraufgaben enthalten
- **Aufgaben-Details**: Vollständige Bearbeitung aller Aufgabenattribute über Modal-Dialog
- **Filter und Suche**: Aufgaben nach verschiedenen Kriterien filtern

## Integrationen

### Datenbank (Supabase)
- **Haupttabelle**: `task_manager` für Aufgabendaten
  - Felder: `name`, `description`, `priority`, `next_job`, `deadline`, etc.
- **User Preferences**: `user_preferences.videoplanung_view_mode` für persistente Ansichtswahl
- **User-Zuordnung**: Alle Aufgaben sind nutzer-spezifisch über `user_id`

### API-Endpunkte
- **`/api/task-manager`**: 
  - `GET`: Abrufen aller Nutzer-Aufgaben
  - `POST`: Neue Aufgabe erstellen
  - `PUT`: Bestehende Aufgabe aktualisieren
  - `DELETE`: Aufgabe löschen
- **`/api/user-preferences`**: 
  - `GET`: Nutzer-Präferenzen abrufen (inkl. Ansichtsmodus)
  - `POST`: Präferenzen aktualisieren

### UI-Komponenten
- **TaskModal**: Modal-Dialog für Aufgabenerstellung/-bearbeitung
- **KanbanView**: Drag & Drop Board-Ansicht
- **TaskList**: Traditionelle Listen-Ansicht
- **VideoPlanningBoard**: Haupt-Container-Komponente

## Nutzungsabläufe

### Typischer Workflow
1. **Neue Aufgabe erstellen**: Über "Neue Aufgabe" Button oder Placeholder-Karte
2. **Brainstorming-Phase**: Ideen sammeln, Konzept entwickeln
3. **Skript-Erstellung**: Drehbuch/Skript ausarbeiten
4. **Dreh-Phase**: Video-Aufnahme durchführen
5. **Schnitt**: Post-Produktion und Bearbeitung
6. **Veröffentlichung**: Final publish und Distribution

### Drag & Drop Workflow (Kanban)
- Aufgabe aus aktueller Spalte greifen
- In Zielspalte ziehen
- Status wird automatisch aktualisiert
- Änderung sofort in Datenbank gespeichert

## Benutzerführung
- Informelle Ansprache ("du") für persönliche Arbeitsatmosphäre
- Skeleton Loading für optimale Nutzererfahrung
- Dark/Light Mode Unterstützung
- Responsive Design für verschiedene Bildschirmgrößen

## **Mehrwert**
Das Videoplanung-Tool bringt strukturierte Professionalität in die Video-Content-Erstellung und hilft MdB-Büros dabei, ihre digitale Kommunikationsstrategie systematisch zu planen und umzusetzen, was die öffentliche Wahrnehmung und Reichweite erheblich verbessert. 