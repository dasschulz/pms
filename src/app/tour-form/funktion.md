# Funktionsweise Tour-Formular (via Token)

Diese Seite stellt ein Formular zur Anmeldung für spezifische Besuchertouren oder Veranstaltungen bereit. Der Zugriff erfolgt typischerweise über einen eindeutigen Token (`[token]` im Pfad), der vorab an interessierte Personen oder Gruppen verteilt wurde.

## Kernfunktionen

### 1. Token-basierte Sicherheit
- **Token-Validierung**: Überprüfung der Gültigkeit des Tokens gegen `touranfragen_links` Tabelle
- **Einmaliger Zugriff**: Token werden nach erfolgreicher Anmeldung automatisch gelöscht
- **Zeitgesteuerte Gültigkeit**: Tokens können mit Ablaufzeiten versehen werden
- **Sicherheitslogs**: Tracking von Token-Verwendung für Audit-Zwecke

### 2. MdB-Datenaufruf für öffentliche Darstellung
- **Token-basierte MdB-Identifikation**: Automatische Zuordnung des MdB über den Token
- **RLS-Bypass für öffentliche Daten**: Service Role Key für Zugriff auf nicht-sensible MdB-Informationen
- **Dynamische Namensanzeige**: Anzeige des MdB-Namens im Formular ohne Authentifizierung
- **Fehlerbehandlung**: Graceful Fallback bei ungültigen Tokens oder fehlenden MdB-Daten

### 3. Veranstaltungsmanagement
- **Veranstaltungsinformationen**: Anzeige von Details zur spezifischen Tour/Veranstaltung, für die der Token gültig ist (Datum, Uhrzeit, Treffpunkt, Programmhinweise).
- **Dynamische Formulare**: Anpassung der Formularfelder basierend auf der spezifischen Tour
- **Kapazitätsprüfung**: Echtzeit-Abgleich mit der maximalen Teilnehmerzahl für die Veranstaltung
- **Status-Tracking**: Automatische Statusaktualisierung nach Anmeldung

### 4. Teilnehmerdatenerfassung mit Spam-Schutz
- **Vollständige Datenerfassung**: Erfassung der notwendigen Daten der sich anmeldenden Person(en) (Name, Kontakt, Anzahl der Personen, ggf. weitere für die Tour relevante Informationen)
- **Rate Limiting**: 5 Anfragen pro Stunde pro IP-Adresse zur Missbrauchsprävention
- **Honeypot-Felder**: Versteckte Formularfelder zur Bot-Erkennung
- **Content-Validierung**: Automatische Spam-Erkennung in Textfeldern
- **Timing-Analyse**: Prüfung der Ausfüllgeschwindigkeit zur Bot-Identifikation
- **Spam-Scoring**: 0-100 Bewertungssystem mit automatischer Blockierung bei hohen Werten

### 5. Validierung & Sicherheit
- **Multi-Level-Validierung**: Client- und serverseitige Eingabeprüfung
- **Datenschutzhinweise und Einwilligung**: Klare Information über die Datenverwendung und Einholung der Zustimmung
- **Input Sanitization**: Bereinigung aller Eingaben gegen Code-Injection
- **Error Handling**: Benutzerfreundliche deutsche Fehlermeldungen

### 6. Bestätigung & Follow-up
- **Bestätigungsseite/E-Mail**: Nach erfolgreicher Anmeldung Anzeige einer Bestätigung und/oder Versand einer Bestätigungs-E-Mail mit allen relevanten Informationen
- **Wartelisten-Management**: Automatische Wartelisten-Verwaltung bei Überbuchung
- **Erinnerungs-System**: Automatische Erinnerungs-E-Mails vor dem Tourtermin

### 7. Benutzeroberfläche & Design
- **Vollbreite-Layout**: Optimale Nutzung des Bildschirmplatzes ohne Container-Beschränkungen
- **Responsive Design**: Mobile-optimierte Darstellung für alle Geräte
- **Hochkontrast-Styling**: Weiße Radio-Buttons auf rotem Hintergrund für bessere Sichtbarkeit
- **Dark-Mode-Optimierung**: Kontrastreiche Gestaltung für verbesserte Benutzerfreundlichkeit
- **Glasmorphismus-Effekte**: Moderne backdrop-blur-Effekte für professionelle Optik
- **Progressive Formulare**: Schrittweise Darstellung mit visueller Führung

## API-Integration

### GET `/api/tour-form/mdb-details`
- **Token-Validierung**: Prüfung der Token-Gültigkeit aus `touranfragen_links`
- **MdB-Datenaufruf**: Service Role Key für RLS-Bypass und Zugriff auf `users` Tabelle
- **Öffentliche Daten**: Nur nicht-sensible Informationen (id, name, email, wahlkreis)
- **Fehlerbehandlung**: Strukturierte JSON-Antworten bei ungültigen Tokens
- **Parameter**: `?token=<token>` - Token aus URL-Pfad

### POST `/api/tour-form/submit`
- **Token-Validierung**: Prüfung der Token-Gültigkeit aus `touranfragen_links`
- **Spam-Schutz**: Umfassende Spam-Analyse vor Datenverarbeitung
- **Rate Limiting**: IP-basierte Anfragenbegrenzung
- **Datenverarbeitung**: Speicherung in `touranfragen` mit automatischer Token-Löschung
- **RLS-Bypass**: Service Role Key für öffentliche API-Zugriffe
- **Response-Handling**: Strukturierte JSON-Antworten mit deutschen Fehlermeldungen

### Spam-Schutz Details
- **Honeypot-Felder**: website, phone_number, company, fax (automatisch ausgeblendet)
- **Content-Analyse**: RegEx-Pattern für Spam-Keywords und verdächtige Links
- **Timing-Validierung**: Mindest-Ausfüllzeit von 3 Sekunden
- **Score-Berechnung**: Kombination aus Honeypot-, Content- und Timing-Scores
- **Logging**: Verdächtige Submissions werden zur Analyse protokolliert

## Supabase-Integration

### RLS & Service Role Key
- **Service Role Client**: Bypassed RLS für öffentliche APIs mit `SUPABASE_SERVICE_ROLE_KEY`
- **Sicherheitsgrenzen**: Nur nicht-sensible Daten werden exponiert (id, name, email, wahlkreis)
- **Token-basierte Berechtigung**: Zugriff nur über gültige Tokens aus `touranfragen_links`

### Tabellen & Felder
- **`touranfragen_links`**: Token-Verwaltung mit Gültigkeitsstatus und `user_id` Verknüpfung
- **`touranfragen`**: Anmeldungsdaten mit Spam-Score-Tracking
- **`users`**: Verknüpfung zu MdB für Berechtigung und öffentliche Darstellung

### Datenfluss
1. **Token-Validierung**: Abfrage gegen `touranfragen_links.token` mit `active=true`
2. **MdB-Datenaufruf**: Service Role Key für Zugriff auf `users` via `user_id`
3. **Formular-Rendering**: Anzeige mit MdB-Namen basierend auf Token-verknüpften Daten
4. **Submission**: Validierung, Spam-Check, Insert in `touranfragen` mit Service Role Key
5. **Token-Cleanup**: Automatische Löschung des verwendeten Tokens
6. **Benachrichtigung**: Optional E-Mail-Versand an MdB und Teilnehmer

## Sicherheitsmerkmale

### Middleware-Integration
- **Öffentliche Routen**: `/tour-form/[token]` ohne Authentifizierung verfügbar
- **API-Schutz**: Alle `/api/tour-form/*` Routen mit Spam-Schutz
- **CORS-Konfiguration**: Sichere Cross-Origin-Request-Behandlung

### Datenschutz
- **DSGVO-Konformität**: Minimale Datenerhebung und transparente Verwendung
- **Service Role Beschränkung**: Nur notwendige, nicht-sensible Daten exponiert
- **Data Retention**: Automatische Löschung nach Veranstaltungsende
- **Audit-Trail**: Vollständige Nachverfolgung aller Datenzugriffe

## Monitoring & Analytics

### Performance-Tracking
- **API-Response-Zeiten**: Überwachung der Formular-Performance
- **Token-Verwendung**: Analyse der Token-Conversion-Rates
- **Spam-Statistiken**: Monitoring der Spam-Score-Verteilung

### Error-Monitoring
- **Failed-Submissions**: Tracking fehlgeschlagener Anmeldungen
- **Rate-Limit-Hits**: Überwachung von IP-Blockierungen
- **Invalid-Tokens**: Analyse ungültiger Token-Zugriffe

## Technische Implementation

### Frontend
- **React/Next.js**: Moderne UI mit TypeScript
- **Server-Side Rendering**: MdB-Daten werden serverseitig geladen für SEO
- **Responsive Design**: Mobile-optimierte Darstellung
- **Real-time Validation**: Sofortige Eingabevalidierung
- **Progressive Enhancement**: Funktionsfähigkeit auch ohne JavaScript
- **Vollbreite-Layout**: Optimierte Platznutzung ohne Container-Beschränkungen
- **Hochkontrast-UI**: Weiße Radio-Buttons für bessere Sichtbarkeit auf dunklem Hintergrund

### Backend
- **Next.js API Routes**: Serverless-optimierte Verarbeitung
- **Service Role Pattern**: RLS-Bypass für öffentliche APIs wie bei BPA-Implementierung
- **Rate Limiting**: limiter-Library für IP-basierte Beschränkungen
- **Spam Detection**: Multi-kriterielle Spam-Analyse
- **Error Handling**: Strukturierte Fehlerbehandlung mit Logging

## Benutzerfluss

1. **Token-Zugriff**: Aufruf via `/tour-form/[token]`
2. **MdB-Datenaufruf**: Server-seitige Abfrage der MdB-Details via Token
3. **Token-Validierung**: Server-seitige Prüfung der Gültigkeit mit Service Role Key
4. **Formular-Anzeige**: Dynamische Generierung mit MdB-Namen in vollbreiter Darstellung
5. **Dateneingabe**: Schrittweise Ausfüllung mit Echtzeit-Validierung und optimierter Sichtbarkeit
6. **Spam-Analyse**: Client- und serverseitige Prüfung
7. **Submission**: Anmeldung verarbeiten und Token invalidieren mit Service Role Key
8. **Bestätigung**: Erfolgsseite mit Veranstaltungsdetails in vollbreiter Darstellung

**Mehrwert**: Ermöglicht sichere, spam-geschützte Anmeldungen zu Touren und Veranstaltungen über personalisierte Links mit automatischer MdB-Identifikation und optimaler Benutzerfreundlichkeit durch vollbreite Darstellung und hochkontrastreiche Radio-Buttons, während gleichzeitig die administrative Belastung des MdB-Büros minimiert wird. 