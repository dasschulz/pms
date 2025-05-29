# Funktionsweise BPA-Formular (via Nachname)

Diese Seite stellt ein Anmeldeformular für spezifische BPA-Fahrten (Bundespresseamt-Informationsfahrten) bereit. Der Zugriff erfolgt über den Nachnamen des jeweiligen Abgeordneten (`[lastName]` im Pfad).

## Kernfunktionen

- **Auswahl verfügbarer Fahrten**: Anzeige der für Anmeldungen offenen BPA-Fahrten des jeweiligen Abgeordneten.
- **Teilnehmerdatenerfassung**: Erfassung der Daten der sich anmeldenden Person (Personalien, Kontakt, ggf. spezielle Anforderungen).
- **Kapazitätsprüfung**: Überprüfung der Verfügbarkeit von Plätzen auf der gewählten Fahrt.
- **Bestätigung**: Nach erfolgreicher Anmeldung wird eine Bestätigung gezeigt (und ggf. eine Bestätigungs-E-Mail versendet).
- **Weiterleitung der Daten**: Die Anmeldung wird an das interne BPA-Fahrten Management oder direkt in eine Supabase-Datenbank übertragen.

## Integrationen

- **Supabase**: Speicherung der über das Formular erfassten Teilnehmerdaten, oft in Verknüpfung mit einer spezifischen BPA-Fahrt.
- **BPA-Fahrten Management (`/bpa-fahrten`)**: Enge Kopplung zur Verwaltung der BPA-Fahrten und deren Anmeldungen.
- **E-Mail-Versanddienst**: Für den Versand von Bestätigungs-E-Mails.

## Offene To-Dos und Implementierungsideen

- Implementierung der Logik zur Zuordnung des `[lastName]` zu einem spezifischen Abgeordneten.
- Entwicklung der serverseitigen Anmeldungsverarbeitung.
- Kapazitätsverwaltung und Wartelistensystem.
- Automatische Bestätigungs-E-Mails und Erinnerungen vor der Fahrt.
- Anbindung an `/api/tour-form/submit` oder einen speziellen BPA-Endpunkt für die Datenverarbeitung. 