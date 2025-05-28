# Funktionsweise Schriftliche Fragen

Diese Seite dient der Erstellung, Verwaltung und Nachverfolgung von Schriftlichen Fragen, die von Abgeordneten an die Bundesregierung gerichtet werden.

## Kernfunktionen

- **Fragenerstellung**: Formular zur Eingabe des Fragetextes, ggf. mit Begründung und Zuordnung zu einem Themenbereich/Ressort.
- **Einreichungsmanagement**: Unterstützung beim Einreichungsprozess (Fristenkontrolle, Weiterleitung an die Bundestagsverwaltung).
- **Antworten-Tracking**: Erfassung und Anzeige der Antworten der Bundesregierung auf die gestellten Fragen.
- **Archiv und Recherche**: Durchsuchbares Archiv aller gestellten Schriftlichen Fragen und deren Antworten.
- **Vorlagenmanagement**: Ggf. Zugriff auf Vorlagen oder Formulierungshilfen.
- **Statusübersicht**: Anzeige des aktuellen Status jeder Frage (in Vorbereitung, eingereicht, beantwortet, überfällig).

## Integrationen

- **DIP (Dokumentations- und Informationssystem für Parlamentarische Vorgänge)**: Abgleich und Verlinkung mit den offiziellen Daten im DIP (Fragen, Antworten, Drucksachennummern).
- **Airtable**: Speicherung der Fragen, Antworten, Fristen und interner Bearbeitungsnotizen.
- **Textverarbeitung/Kollaborationstools**: Mögliche Integration zur gemeinsamen Erarbeitung von Fragen.
- `/api/schriftliche-fragen/generate`: API-Endpunkt zur potenziellen (KI-gestützten) Generierung von Fragenentwürfen.

## Offene To-Dos und Implementierungsideen

- Implementierung der Schnittstelle zum DIP für einen automatisierten Datenabgleich.
- Entwicklung eines robusten Fristenmanagement-Systems mit Benachrichtigungen.
- KI-Unterstützung bei der Themenfindung oder Formulierung von Fragen (Nutzung von `/api/schriftliche-fragen/generate`).
- Analysefunktionen zur Auswertung der Antwortqualität oder -häufigkeit zu bestimmten Themen.
- Exportfunktionen für Fragen und Antworten (z.B. für Berichte).
- Interne Freigabeworkflows vor der offiziellen Einreichung. 