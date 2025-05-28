# Funktionsweise Anmelden

Diese Seite dient dem sicheren Anmelden (Login) von Nutzern in die MdB-App.

## Kernfunktionen

- **Eingabefelder**: Formular zur Eingabe von Anmeldeinformationen (typischerweise E-Mail-Adresse und Passwort).
- **Authentifizierungsmethoden**: Unterstützung verschiedener Anmeldeverfahren:
    - **Credentials-Login**: Klassische Anmeldung mit Benutzername/E-Mail und Passwort.
    - **OAuth-Anbieter (optional)**: Anmeldung über Drittanbieter wie Google, Microsoft, etc. (falls konfiguriert).
- **Passwort vergessen/zurücksetzen**: Link zu einer Funktion, um das Passwort zurückzusetzen, falls der Nutzer es vergessen hat.
- **Fehlerbehandlung**: Anzeige verständlicher Fehlermeldungen bei falschen Anmeldedaten oder anderen Problemen.
- **Sicherheitsmaßnahmen**: Schutz vor Brute-Force-Angriffen (z.B. Rate Limiting, Captcha nach mehreren Fehlversuchen).
- **Session-Erstellung**: Bei erfolgreicher Anmeldung wird eine Nutzersession erstellt und der Nutzer auf die Startseite oder eine geschützte Seite weitergeleitet.

## Integrationen

- **Authentifizierungssystem (NextAuth)**: Nutzt die von NextAuth bereitgestellten Funktionen und Provider für die Anmeldung.
- **API-Endpunkt (`/api/auth/[...nextauth]/route.ts`)**: Hier wird die serverseitige Logik für Authentifizierungsvorgänge, einschließlich Login, gehandhabt.
- **Datenbank/Airtable**: Überprüfung der Anmeldeinformationen gegen die in der Nutzerdatenbank (z.B. Airtable `Users`-Tabelle) gespeicherten Daten.
- **Passwort-Hashing**: Sichere Speicherung von Passwörtern mittels Hashing-Algorithmen.

## Offene To-Dos und Implementierungsideen

- Implementierung der "Passwort vergessen"-Funktionalität.
- Einführung von Zwei-Faktor-Authentifizierung (2FA) für erhöhte Sicherheit.
- Option "Angemeldet bleiben" (Remember me).
- Anzeige von Sicherheitswarnungen bei verdächtigen Anmeldeversuchen.
- Anpassung des Designs der Anmeldeseite an das Corporate Design.
- Klare Verlinkung zur Datenschutzerklärung und ggf. zu Nutzungsbedingungen. 