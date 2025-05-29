# Funktionsweise BPA (Bundespresseamt)

Diese Seite dient als zentraler Anlaufpunkt für alle Aktivitäten und Informationen im Zusammenhang mit dem Bundespresseamt (BPA), insbesondere im Kontext von Besuchergruppen und Informationsfahrten.

## Kernfunktionen

- **Dashboard/Übersicht**: Anzeige wichtiger Kennzahlen und aktueller Aktivitäten (z.B. anstehende BPA-Fahrten, Kontingente, Anmeldestatus).
- **Informationsmaterial**: Bereitstellung von Richtlinien, Antragsformularen und Informationsmaterialien des BPA.
- **Verwaltung von Kontingenten**: Übersicht und Verwaltung der dem Abgeordneten/der Fraktion zustehenden Kontingente für BPA-Maßnahmen.
- **Zugang zu BPA-Fahrten**: Verlinkung oder direkter Zugriff auf die Verwaltung von BPA-Fahrten (siehe `/bpa-fahrten`).
- **Anmeldeformulare**: Ggf. Bereitstellung oder Verlinkung zu Formularen für die Anmeldung zu BPA-finanzierten Fahrten (siehe `/bpa-form`).

## Integrationen

- **Supabase**: Zentrale Datenhaltung für Kontingente, allgemeine BPA-Informationen und Verknüpfungen zu spezifischen Fahrten.
- **BPA-Webseite**: Verlinkung zu relevanten Seiten und Ressourcen auf der offiziellen Webseite des BPA.
- **Interne Dokumentenablage**: Zugriff auf intern gespeicherte Dokumente und Vorlagen zum Thema BPA.

## Offene To-Dos und Implementierungsideen

- Konzeption und Gestaltung des Dashboards mit relevanten KPIs.
- Aufbau einer durchsuchbaren Datenbank für BPA-Richtlinien und -Materialien.
- Implementierung der Kontingentverwaltung.
- Enge Verzahnung mit den spezifischeren BPA-Modulen (`/bpa-fahrten`, `/bpa-form`).
- Klärung, welche spezifischen Formulare unter `/bpa-form/[lastName]` bereitgestellt werden und wie diese mit den hier verwalteten Informationen interagieren.

# Funktionsweise BPA Öffentliche Anmeldeformulare (`/bpa/[lastName]`)

Öffentlich zugängliche BPA-Fahrt-Anmeldeformulare für Bürger ohne Authentifizierung. Diese personalisierten Formulare ermöglichen es Bürgern, sich direkt für BPA-Fahrten des jeweiligen MdB anzumelden.

## Kernfunktionen

### 1. Dynamische MdB-Erkennung
- **URL-Parameter**: Automatische Zuordnung des MdB über lastName aus der URL
- **Supabase-Integration**: Sucht MdB in der users-Tabelle über Service Role Key (RLS-Bypass)
- **Fehlerbehandlung**: Nutzerfreundliche Fehlermeldungen bei ungültigen Namen

### 2. Fahrtauswahl & -anzeige
- **Verfügbare Fahrten**: Zeigt nur Fahrten mit Status='Anmeldung offen' und aktiv=true
- **Fahrtdetails**: Datum, Anmeldefrist, Zielort mit automatischer Formatierung
- **Responsive Design**: Mobile-optimierte Darstellung mit DIE LINKE Corporate Design
- **Single/Multi-Trip**: Automatische Auswahl bei einer verfügbaren Fahrt

### 3. Vollständiges Anmeldeformular
- **Persönliche Daten**: Vor-/Nachname, Geburtsdatum, E-Mail, Telefon mit Validierung
- **Anschrift**: Straße, PLZ, Ort mit PLZ-Pattern-Validierung
- **Fahrtspezifische Optionen**: 
  - Zustiegspunkt (Osnabrück, Hannover, Berlin)
  - Essenspräferenzen (Vegetarisch, Vegan, Kosher, Halal, etc.)
  - Einzelzimmer-Wunsch mit Kostenhinweis
  - Parteimitgliedschaft (informativ)
- **5-Jahres-Regel**: Automatische Validierung gegen BPA-Richtlinien

### 4. Umfassender Spam-Schutz
- **Rate Limiting**: 5 Anfragen pro Stunde pro IP-Adresse mit limiter-Library
- **Honeypot-Felder**: Versteckte Felder (website, phone_number, company, fax) für Bot-Erkennung
- **Content-Analyse**: 
  - Spam-Keyword-Erkennung (Casino, Poker, Loans, etc.)
  - Link-Count-Validierung
  - Email-Domain-Prüfung gegen bekannte Spam-Provider
  - Großbuchstaben-Ratio-Analyse
- **Timing-Validierung**: Blockierung zu schneller Submissions (<3 Sekunden)
- **Spam-Scoring**: 0-100 Bewertungsskala (≥70 blockiert, ≥40 geloggt als verdächtig)

### 5. Benutzerführung & UX
- **Progressive Disclosure**: Informationen werden schrittweise enthüllt
- **Hilfe-Popovers**: Kontextuelle Erklärungen zu BPA-Richtlinien
- **Echtzeit-Validierung**: Client-seitige Checks vor Server-Submission
- **Success-State**: Bestätigungsseite nach erfolgreicher Anmeldung
- **Skeleton Loading**: Optimierte Loading-States während Datenabfrage

## API-Interaktionen

### GET `/api/bpa-public/mdb-details?lastName=[lastName]`
- **Zweck**: MdB-Suche über lastName-Parameter
- **Sicherheit**: Service Role Key für RLS-Bypass
- **Response**: Nur öffentliche Daten (id, name, wahlkreis)
- **Fehlerbehandlung**: 404 bei ungültigen Namen

### GET `/api/bpa-public/active-trips?userId=[userId]`
- **Zweck**: Verfügbare Fahrten für spezifischen MdB
- **Filter**: status_fahrt='Anmeldung offen' AND aktiv=true
- **Response**: Fahrt-Array mit Daten, Namen, Fristen
- **Auto-Selection**: Bei einer verfügbaren Fahrt

### POST `/api/bpa-public/submit-application`
- **Zweck**: Anmeldung verarbeiten mit Spam-Schutz
- **Rate Limiting**: IP-basierte Anfragenbegrenzung
- **Spam-Checks**: Mehrstufige Validierung vor DB-Insert
- **Response**: Erfolgs-/Fehlermeldungen in deutscher Sprache
- **Logging**: Verdächtige Submissions für Analyse

## Supabase-Integration

### Tabellen & Felder
- **`users`**: MdB-Lookup über lastName, Service Role Access
- **`bpa_fahrten`**: Fahrt-Verfügbarkeit und Details
- **`bpa_formular`**: Anmeldungsdaten mit spam_score

### Sicherheitsmodell
- **RLS-Bypass**: Service Role für öffentliche MdB-Daten
- **Data Minimization**: Nur notwendige Felder werden exponiert
- **Input Validation**: Server-seitige Validierung aller Eingaben

## Spam-Schutz Details

### Client-seitige Maßnahmen
- **Honeypot CSS**: position: absolute, left: -9999px, opacity: 0
- **Timing-Tracking**: formStartTime für Server-Validierung
- **Field Validation**: Email-RegEx und PLZ-Pattern

### Server-seitige Validierung
- **Rate Limiter**: 5 tokens per hour mit automatischer Bereinigung
- **Content Analysis**: RegEx-Pattern für Spam-Indikatoren
- **IP-Detection**: X-Forwarded-For, X-Real-IP, CF-Connecting-IP Headers
- **Suspicious Logging**: Submissions mit Score 40-69 werden geloggt

### Spam-Score-Berechnung
- **Honeypot**: 95 Punkte (sofort blockiert)
- **Timing**: 90 Punkte (<3s), 60 Punkte (<10s)
- **Content**: 30 Punkte pro Spam-Pattern, 40 für viele Links, 25 für CAPS
- **Email**: 50 für ungültiges Format, 60 für verdächtige Domains

## Technische Implementation

### Frontend (React/Next.js)
- **State Management**: useState für Formulardaten und UI-States
- **Form Handling**: Controlled Components mit onChange-Handlers
- **Error Handling**: Benutzerfreundliche deutsche Fehlermeldungen
- **Responsive**: Tailwind CSS mit Mobile-First-Ansatz

### Backend (Next.js API Routes)
- **Middleware**: middleware.ts für öffentliche Routen-Freischaltung
- **Error Handling**: Try-catch mit strukturierten Responses
- **Logging**: Console.log für Debugging und Monitoring

### Styling & Design
- **Corporate Design**: DIE LINKE Rot-Farbschema mit Verläufen
- **Typography**: Work Sans Font für moderne Optik
- **Components**: Shadcn/ui für konsistente UI-Elemente
- **Accessibility**: Aria-Labels und Keyboard-Navigation

## Integrationen

### Middleware-Konfiguration
- **Öffentliche Routen**: `/bpa/[lastName]` ohne Authentifizierung
- **API-Schutz**: Spam-Schutz für alle öffentlichen Endpoints
- **CORS**: Konfiguration für Cross-Origin-Requests

### Bundestag-Integration
- **Externe Links**: Verlinkung zur offiziellen BPA-Dokumentation
- **Richtlinien**: Integration der BPA-Bestimmungen in UI-Texte
- **Branding**: Bundestag-Logo und offizielle Informationen

## Benutzerfluss

1. **URL-Aufruf**: `/bpa/[lastName]` öffnen
2. **MdB-Erkennung**: Automatische Suche und Validierung
3. **Fahrt-Laden**: Verfügbare Fahrten abrufen und anzeigen
4. **Formular-Ausfüllen**: Schrittweise Dateneingabe mit Validierung
5. **Spam-Check**: Client- und serverseitige Prüfung
6. **Submission**: Anmeldung in Datenbank speichern
7. **Bestätigung**: Erfolgsseite mit E-Mail-Bestätigungshinweis

## Monitoring & Analytics

### Spam-Analyse
- **Score-Tracking**: Verteilung der Spam-Scores in bpa_formular.spam_score
- **Rate-Limiting**: Logs für IP-Adressen mit häufigen Anfragen
- **Content-Patterns**: Analyse häufiger Spam-Indikatoren

### Performance-Monitoring
- **API-Response-Zeiten**: Überwachung der Endpunkt-Performance
- **Error-Rates**: Tracking von 4xx/5xx Responses
- **User-Journey**: Analyse der Conversion-Rate

**Mehrwert**: Ermöglicht Bürgern eine einfache, sichere und barrierefreie Anmeldung zu BPA-Fahrten direkt über personalisierte Links, während gleichzeitig das MdB-Büro vor Spam und Missbrauch geschützt wird. 