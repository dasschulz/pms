# Funktionsweise Kleine Anfragen

Diese Seite dient der Erstellung, Verwaltung und Nachverfolgung von Kleinen Anfragen, die von Abgeordneten an die Bundesregierung gerichtet werden.

## Kernfunktionen

- **Fragenerstellung**: Eingabe und Formatierung von Fragen (häufig in nummerierter Form).
- **Themenrecherche**: Zugriff auf Hintergrundinformationen und relevante Daten zu den Themen der Anfrage.
- **Einreichungsmanagement**: Unterstützung beim ordnungsgemäßen Einreichen der Anfrage beim Bundestag.
- **Antworten-Tracking**: Erfassung und Analyse der Antworten der Bundesregierung.
- **Archiv und Verlinkung**: Speicherung und Verlinkung zu den offiziellen Veröffentlichungen auf bundestag.de oder im DIP.

## Integrationen

- **Supabase**: Speicherung der Anfragen, Antworten, Analysen und interner Notizen.
- **DIP (Dokumentations- und Informationssystem für Parlamentarische Vorgänge)**: Abruf und Verlinkung von offiziellen Daten und Drucksachen.
- **KI-Generierung** (`/api/kleine-anfragen/generate`): Nutzung KI-gestützter Tools zur Unterstützung bei der Formulierung von Fragen.

## Offene To-Dos und Implementierungsideen

- Implementierung der Schnittstelle zum DIP für automatisierte Datenabfragen.
- Entwicklung von Analysewerkzeugen für die Auswertung der Regierungsantworten.
- Aufbau einer Datenbank mit thematischen Vorlagen und häufig genutzten Formulierungen.
- Verbindung zu `/dokumentensuche` für umfassende Recherche.
- Exportfunktionen für fertige Anfragen (z.B. als DOCX oder PDF).
- Kollaborative Funktionen für die gemeinsame Erarbeitung von Anfragen im Team. 