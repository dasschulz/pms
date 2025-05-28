# Funktionsweise Kleine Anfragen

Diese Seite dient der Erstellung, Verwaltung, Analyse und Nachverfolgung von Kleinen Anfragen, die von Abgeordneten oder der Fraktion an die Bundesregierung gerichtet werden.

## Kernfunktionen

- **Themenfindung und Recherche**: Unterstützung bei der Identifizierung relevanter Themen für Kleine Anfragen (ggf. Anbindung an `/anfragenplanung`).
- **Fragenerstellung und -formulierung**: Editor zur Ausarbeitung der Fragenkataloge, inklusive Begründung.
- **Einreichungsmanagement**: Verwaltung des Einreichungsprozesses und der Fristen.
- **Antworten-Management**: Erfassung und Darstellung der Antworten der Bundesregierung.
- **Analyse-Tools (`/kleine-anfragen/analyze`)**: Funktionen zur inhaltlichen und quantitativen Analyse der Antworten (z.B. Identifizierung von Mustern, Ausweichantworten, statistische Auswertungen).
- **Generierungs-Unterstützung (`/kleine-anfragen/generate`)**: KI-basierte Hilfe bei der Formulierung von Fragen oder der Strukturierung von Anfragen.
- **Archiv und Suche**: Durchsuchbares Archiv aller Kleinen Anfragen und Antworten.

## Integrationen

- **DIP (Dokumentations- und Informationssystem für Parlamentarische Vorgänge)**: Abgleich mit den offiziellen Daten im DIP.
- **Airtable**: Speicherung der Anfragen, Antworten, Analysen und interner Notizen.
- **Anfragenplanung (`/anfragenplanung`)**: Enge Verzahnung für den gesamten Prozess von der Idee bis zur Anfrage.
- **KI-Dienste**: Nutzung der Endpunkte unter `/api/kleine-anfragen/generate` und `/api/ai/...` für Analyse und Generierung.

## Offene To-Dos und Implementierungsideen

- Vertiefte Implementierung der Analysefunktionen unter `/kleine-anfragen/analyze`.
- Ausbau der KI-gestützten Generierungs- und Formulierhilfen unter `/kleine-anfragen/generate`.
- Entwicklung von Visualisierungen für die Analyseergebnisse.
- Workflow für die interne Abstimmung und Freigabe von Kleinen Anfragen.
- Automatisierte Benachrichtigungen über eingegangene Antworten oder nahende Fristen.
- Exportfunktionen für Anfragen, Antworten und Analyseberichte.
- Vergleichsfunktion für Antworten auf ähnliche Anfragen über die Zeit. 