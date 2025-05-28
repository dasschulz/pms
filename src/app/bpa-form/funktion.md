# Funktionsweise BPA-Formular (Anmeldung)

Diese Seite stellt spezifische Formulare zur Anmeldung von Teilnehmern für BPA-finanzierte Informationsfahrten bereit. Die Formulare sind oft personalisiert oder spezifisch für den einladenden Abgeordneten (erkennbar am `[lastName]` im Pfad).

## Kernfunktionen

- **Dynamische Formulargenerierung**: Anzeige des korrekten Anmeldeformulars basierend auf der jeweiligen BPA-Fahrt und/oder dem einladenden Abgeordneten.
- **Datenerfassung**: Sichere Erfassung der notwendigen Teilnehmerdaten (Name, Adresse, Geburtsdatum, Kontaktdaten, ggf. spezielle Anforderungen wie Diätwünsche oder Barrierefreiheit).
- **Datenschutzhinweise**: Klare Darstellung der Datenschutzbestimmungen und Einholung der notwendigen Einwilligungen.
- **Validierung**: Prüfung der eingegebenen Daten auf Vollständigkeit und Plausibilität.
- **Bestätigungsnachricht**: Anzeige einer Bestätigung nach erfolgreicher Übermittlung der Daten.
- **Datenübermittlung**: Sichere Weiterleitung der Anmeldedaten an die zuständige Stelle (z.B. an das BPA-Fahrten Management oder direkt in eine Airtable-Datenbank).

## Integrationen

- **Airtable**: Speicherung der über das Formular erfassten Teilnehmerdaten, oft in Verknüpfung mit einer spezifischen BPA-Fahrt.
- **BPA-Fahrten Management**: Enge Kopplung mit `/bpa-fahrten` zur Zuordnung der Anmeldungen zu konkreten Fahrten.
- **E-Mail-Benachrichtigung**: Optionale automatische Benachrichtigung an den Teilnehmer und/oder den Organisator nach erfolgreicher Anmeldung.

## Offene To-Dos und Implementierungsideen

- Implementierung der Logik zur dynamischen Auswahl und Anzeige des korrekten Formulars basierend auf `[lastName]` oder einer Fahrt-ID.
- Entwicklung der serverseitigen Validierungs- und Speicherlogik.
- Sicherstellung der Einhaltung aller Datenschutzanforderungen (DSGVO).
- Implementierung eines Systems zur Verwaltung von Wartelisten, falls die Teilnehmerzahl begrenzt ist.
- Möglichkeit für Teilnehmer, ihre Anmeldung zu einem späteren Zeitpunkt zu bearbeiten oder zu stornieren (mit entsprechenden Sicherheitsmaßnahmen).
- Erstellung von individualisierbaren Formularvorlagen. 