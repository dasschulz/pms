# Funktionsweise Journalistenpool

Diese Seite dient der Verwaltung einer umfassenden Datenbank von Journalist:innen für die Pressearbeit und Medienbeziehungen eines Bundestagsabgeordneten.

## Kernfunktionen

- **Journalist:innen-Verwaltung**: Vollständige Kontaktverwaltung mit allen relevanten Informationen (Titel, Name, Medium, Ressort, Kontaktdaten)
- **Kategorisierung**: Systematische Einordnung nach Medium (Presse, Radio, Fernsehen, Podcast, Video, Social Media)
- **Zuständigkeitsbereiche**: Differenzierung zwischen Bundes-, Landes- und Lokalpolitik mit entsprechenden Land/Region-Zuordnungen
- **Themenschwerpunkte**: Flexible Zuordnung von Themen und Partei- oder Themenschwerpunkten
- **Bewertungssystem**: 4-Kategorien-Bewertung (1-5 Sterne) für Zuverlässigkeit, Gewogenheit gegenüber der Linken, Textannahme und Freundlichkeit
- **Kommentarsystem**: Persönliche Notizen zu Journalist:innen (max. 600 Zeichen)
- **Such- und Filterfunktionen**: Umfassende Suche nach Namen, Medium, Ressort und Themen
- **Statistik-Dashboard**: Übersichtliche Darstellung der Verteilung nach Medientypen

## Benutzeroberfläche

- **Responsive Design**: Optimiert für Desktop und mobile Geräte
- **Dark/Light Mode**: Anpassung der Sternen-Bewertungen (weiß im Dark Mode, rot im Light Mode)
- **Card-Layout**: Übersichtliche Darstellung aller Journalist:innen mit wichtigsten Informationen
- **Modal-Dialoge**: Benutzerfreundliche Formulare für Erstellung und Bearbeitung
- **Skeleton Loading**: Professionelle Ladezustände während Datenabfragen

## Datenstruktur

- **Journalist:innen-Stammdaten**: Titel, Vor-/Nachname, Haus, Funktion, E-Mail, Telefon
- **Klassifizierung**: Medium, Ressort, Zuständigkeitsbereich, Schwerpunkt
- **Dynamische Felder**: Erweiterbare Ressort- und Themenlisten
- **Bewertungen**: Benutzerspezifische Ratings mit Durchschnittsberechnung
- **Metadaten**: Erfasser, Erstellungsdatum, Datenschutzzustimmung

## Integrationen

- **Supabase**: Vollständige Datenspeicherung mit Row Level Security
- **NextAuth**: Benutzerauthentifizierung und Autorisierung  
- **API-Endpunkte**: RESTful APIs für alle CRUD-Operationen
- **Dynamische Daten**: Erweiterbare Ressort- und Themenlisten über eigene APIs

## Sicherheit und Datenschutz

- **Zugriffskontrolle**: Nur authentifizierte Benutzer können auf die Datenbank zugreifen
- **Eigentumsrechte**: Benutzer können nur ihre eigenen Einträge bearbeiten/löschen
- **Datenschutzzustimmung**: Explizite Einverständniserklärung für Datenspeicherung erforderlich
- **Sichere API**: Alle Endpunkte durch Session-basierte Authentifizierung geschützt

## Mehrwert

Diese Anwendung ermöglicht eine professionelle und systematische Verwaltung der Pressekontakte, wodurch die Medienarbeit des Bundestagsbüros erheblich effizienter und zielgerichteter gestaltet werden kann. 