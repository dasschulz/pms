# Funktionsweise Besucheranmeldung

Diese Seite dient der Anmeldung von Besuchergruppen für den Deutschen Bundestag. Hier können Termine angefragt und die notwendigen Daten der teilnehmenden Personen erfasst werden.

## Kernfunktionen

- **Terminauswahl**: Auswahl möglicher Termine für den Besuch.
- **Gruppengröße**: Angabe der Anzahl der teilnehmenden Personen.
- **Kontaktdaten**: Erfassung der Daten des Ansprechpartners der Gruppe.
- **Teilnehmerliste**: Möglichkeit zum Hochladen oder manuellen Eingeben der Teilnehmerdaten (Name, Vorname, Geburtsdatum).
- **Bestätigung**: Nach Absenden des Formulars erhält der Ansprechpartner eine Bestätigung und weitere Informationen.

## Integrationen

- **Kalendersystem**: Mögliche Anbindung an ein internes Kalendersystem zur Prüfung der Terminverfügbarkeit.
- **Airtable**: Speicherung der Anmeldedaten in einer Airtable-Datenbank (z.B. Tabelle `Besuchergruppen`).

## Offene To-Dos und Implementierungsideen

- Implementierung der serverseitigen Logik zur Verarbeitung der Anmeldedaten.
- Anbindung an ein Benachrichtigungssystem für automatische Bestätigungs-E-Mails.
- Entwicklung einer Schnittstelle zum internen Kalendersystem.
- Validierung der eingegebenen Daten (z.B. Plausibilitätsprüfung der Geburtsdaten).
- Funktion zur Stornierung oder Änderung von Anmeldungen. 