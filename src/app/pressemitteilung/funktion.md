# Funktionsweise Pressemitteilung

Diese Seite dient der Erstellung, Verwaltung, Freigabe und ggf. dem Versand von Pressemitteilungen.

## Kernfunktionen

- **Editor zur Erstellung**: Texteingabe und -formatierung für Titel, Untertitel, Haupttext, Zitate und Boilerplate (Standard-Absatz über die Fraktion).
- **Vorlagenmanagement**: Zugriff auf vordefinierte Vorlagen für verschiedene Anlässe oder PM-Typen.
- **Metadaten-Erfassung**: Eingabe von Datum, Autor/Herausgeber, Themenkategorien, Schlagworten.
- **Freigabeworkflow**: Interner Prozess zur Prüfung und Freigabe von Pressemitteilungen vor der Veröffentlichung.
- **Verteiler-Management**: Auswahl oder Erstellung von Presseverteilern (Anbindung an `/journalistenpool`).
- **Versandoptionen**: Ggf. direkter Versand per E-Mail oder Anbindung an Versandtools.
- **Archivierung und Suche**: Speicherung aller Pressemitteilungen in einem durchsuchbaren Archiv.
- **Website-Integration**: Automatische Veröffentlichung auf der Fraktionswebsite.

## Integrationen

- **Supabase**: Speicherung von Pressemitteilungsentwürfen, Metadaten, Freigabestatus und Verteilern.
- **Journalistenpool (`/journalistenpool`)**: Zugriff auf Journalistenkontakte und Verteilerlisten.
- **E-Mail-Versanddienste**: Anbindung an Tools wie SendGrid, Resend etc. für den Massenversand.
- **Fraktionswebsite/CMS**: Schnittstelle zur automatischen Übertragung und Veröffentlichung der PMs.
- **Social Media Management Tools**: Optionale Anbindung, um PMs oder Auszüge davon auf Social Media zu teilen.

## Offene To-Dos und Implementierungsideen

- Entwicklung eines WYSIWYG-Editors oder Markdown-Editors für die PM-Erstellung.
- Implementierung des Freigabeworkflows mit Benachrichtigungsfunktionen.
- Anbindung an E-Mail-Versanddienste und das Journalistenpool-Modul.
- Aufbau der Schnittstelle zum CMS der Fraktionswebsite.
- Versionierung von Pressemitteilungsentwürfen.
- Sperrfristenmanagement für Pressemitteilungen.
- Analyse der Reichweite/Clippings von veröffentlichten PMs (ggf. manuelle Erfassung oder Anbindung an Monitoring-Tools). 