# Funktionsweise Tour-Formular (via Token)

Diese Seite stellt ein Formular zur Anmeldung für spezifische Besuchertouren oder Veranstaltungen bereit. Der Zugriff erfolgt typischerweise über einen eindeutigen Token (`[token]` im Pfad), der vorab an interessierte Personen oder Gruppen verteilt wurde.

## Kernfunktionen

- **Token-Validierung**: Überprüfung der Gültigkeit des Tokens, um sicherzustellen, dass das Formular nur für berechtigte Anmeldungen zugänglich ist.
- **Veranstaltungsinformationen**: Anzeige von Details zur spezifischen Tour/Veranstaltung, für die der Token gültig ist (Datum, Uhrzeit, Treffpunkt, Programmhinweise).
- **Teilnehmerdatenerfassung**: Erfassung der notwendigen Daten der sich anmeldenden Person(en) (Name, Kontakt, Anzahl der Personen, ggf. weitere für die Tour relevante Informationen).
- **Datenschutzhinweise und Einwilligung**: Klare Information über die Datenverwendung und Einholung der Zustimmung.
- **Validierung**: Prüfung der Eingaben auf Vollständigkeit und Korrektheit.
- **Bestätigungsseite/E-Mail**: Nach erfolgreicher Anmeldung Anzeige einer Bestätigung und/oder Versand einer Bestätigungs-E-Mail mit allen relevanten Informationen.
- **Kapazitätsprüfung**: Abgleich mit der maximalen Teilnehmerzahl für die Veranstaltung.

## Integrationen

- **Airtable**: Speicherung der Anmeldedaten, verknüpft mit der spezifischen Tour/Veranstaltung und dem verwendeten Token.
- **Touranfragen-Management**: Enge Kopplung mit `/touranfragen`, wo die Touren geplant und die Tokens generiert werden.
- **E-Mail-Versanddienst**: Für den Versand von Bestätigungs-E-Mails.
- **Kalendersystem**: Optionale Möglichkeit für Angemeldete, den Termin in ihren Kalender zu exportieren.

## Offene To-Dos und Implementierungsideen

- Implementierung der Token-Generierungs- und Validierungslogik im Zusammenspiel mit `/touranfragen/generate-link`.
- Entwicklung der serverseitigen Logik zur Verarbeitung und Speicherung der Anmeldungen.
- Gestaltung der Formulare und Bestätigungsseiten.
- System zur Verwaltung von Wartelisten, falls eine Tour überbucht ist.
- Automatische Erinnerungs-E-Mails vor dem Tourtermin.
- Möglichkeit für Angemeldete, ihre Anmeldung (begrenzt) zu ändern oder zu stornieren.
- Anbindung an `/api/tour-form/submit` für die Datenverarbeitung. 