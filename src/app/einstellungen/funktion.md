# Funktionsweise Einstellungen

Diese Seite ermöglicht es Nutzern, ihre persönlichen Einstellungen und Präferenzen für die MdB-App zu verwalten. Administratoren können hier ggf. auch globale Anwendungseinstellungen verwalten.

## Kernfunktionen (Nutzerperspektive)

- **Profilbearbeitung**: Aktualisierung persönlicher Informationen (Name, E-Mail, Kontaktdaten).
- **Passwort ändern**: Sichere Möglichkeit zur Änderung des Benutzerpassworts.
- **Benachrichtigungseinstellungen**: Konfiguration von E-Mail- und In-App-Benachrichtigungen.
- **Design/Theme-Einstellungen**: Auswahl zwischen verschiedenen Farbschemata oder Dark/Light Mode.
- **Datenschutzoptionen**: Verwaltung der Datenschutzeinstellungen und Einwilligungen.
- **App-spezifische Präferenzen**: Konfiguration app-spezifischer Einstellungen (z.B. Standard-Ansichten, Filter-Voreinstellungen).
- **Account-Verwaltung**: Optionen zur Deaktivierung oder Löschung des Accounts (falls implementiert).

## Kernfunktionen (Adminperspektive, falls zutreffend)

- **Nutzerverwaltung**: Anlegen, Bearbeiten, Sperren oder Löschen von Nutzerkonten.
- **Rollen- und Rechtevergabe**: Zuweisung von Nutzerrollen und damit verbundenen Berechtigungen.
- **Globale Anwendungseinstellungen**: Konfiguration von Standardwerten, Integrationen mit Drittanbietern, Wartungsmodus etc.
- **Audit-Logs**: Einsicht in wichtige Systemereignisse oder Nutzeraktivitäten.

## Integrationen

- **Supabase**: Speicherung von Nutzerprofilen, Präferenzen und Rollen (`user_preferences_table.md` deutet auf eine solche Tabelle hin).
- **Authentifizierungssystem**: Anbindung für Passwort-Änderungen und Sicherheitseinstellungen.
- **E-Mail-Service**: Für die Verwaltung von E-Mail-Benachrichtigungen.
- **Theme-Management**: System zur Handhabung verschiedener UI-Themes.
- `/api/user-preferences/route.ts` und `/api/user-details/route.ts`: API-Endpunkte zur Verwaltung von Nutzereinstellungen und -details.

## Offene To-Dos und Implementierungsideen

- Implementierung der Profilbearbeitungsfunktionen mit entsprechender Validierung.
- Entwicklung sicherer Passwort-Änderungsprozesse.
- Aufbau des Benachrichtigungsmanagements.
- Integration verschiedener UI-Themes und Dark/Light Mode.
- Datenschutz-Dashboard mit granularen Einstellungsmöglichkeiten.
- Export-Funktion für persönliche Daten (DSGVO-Konformität).
- Backup und Wiederherstellung von Einstellungen.
- Ausbau der konfigurierbaren Benachrichtigungseinstellungen.
- Detaillierte Ausgestaltung der Administrationsfunktionen für Nutzer- und Rechteverwaltung.
- Zwei-Faktor-Authentifizierung (2FA) für erhöhte Sicherheit.
- Übersichtliche Darstellung der Audit-Logs für Administratoren. 