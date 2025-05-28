# Funktionsweise Einstellungen

Diese Seite ermöglicht es Nutzern, ihre persönlichen Präferenzen und Einstellungen für die MdB-App anzupassen. Administratoren können hier ggf. auch globale Anwendungseinstellungen verwalten.

## Kernfunktionen (Nutzerperspektive)

- **Profilverwaltung**: Bearbeitung persönlicher Daten (Name, E-Mail, ggf. Passwortänderung).
- **Benachrichtigungseinstellungen**: Konfiguration, welche Benachrichtigungen (E-Mail, In-App) für welche Ereignisse erhalten werden sollen.
- **Interface-Anpassungen**: Ggf. Auswahl von Farbschemata (Hell-/Dunkelmodus), Schriftgrößen oder Layout-Präferenzen.
- **Datenschutzeinstellungen**: Verwaltung von Einwilligungen zur Datenverarbeitung (z.B. Tracking, Newsletter).
- **API-Schlüssel-Verwaltung**: Falls die App externe Dienste nutzt, die nutzerspezifische API-Schlüssel erfordern.
- **Abmeldung**: Sicherer Logout aus der Anwendung.

## Kernfunktionen (Adminperspektive, falls zutreffend)

- **Nutzerverwaltung**: Anlegen, Bearbeiten, Sperren oder Löschen von Nutzerkonten.
- **Rollen- und Rechtevergabe**: Zuweisung von Nutzerrollen und damit verbundenen Berechtigungen.
- **Globale Anwendungseinstellungen**: Konfiguration von Standardwerten, Integrationen mit Drittanbietern, Wartungsmodus etc.
- **Audit-Logs**: Einsicht in wichtige Systemereignisse oder Nutzeraktivitäten.

## Integrationen

- **Airtable**: Speicherung von Nutzerprofilen, Präferenzen und Rollen (`user_preferences_table.md` deutet auf eine solche Tabelle hin).
- **Authentifizierungssystem (NextAuth)**: Anbindung an das verwendete Authentifizierungssystem für Profil- und Passwortmanagement.
- **Datenbank**: Direkte Interaktion mit der Datenbank zur Speicherung der Einstellungen.
- `/api/user-preferences/route.ts` und `/api/user-details/route.ts`: API-Endpunkte zur Verwaltung von Nutzereinstellungen und -details.

## Offene To-Dos und Implementierungsideen

- Ausbau der konfigurierbaren Benachrichtigungseinstellungen.
- Implementierung von Optionen zur Interface-Anpassung (z.B. Dark Mode, falls noch nicht vorhanden).
- Detaillierte Ausgestaltung der Administrationsfunktionen für Nutzer- und Rechteverwaltung.
- Zwei-Faktor-Authentifizierung (2FA) für erhöhte Sicherheit.
- Export/Import von Nutzereinstellungen.
- Übersichtliche Darstellung der Audit-Logs für Administratoren. 