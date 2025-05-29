# Funktionsweise Touranfragen (Verwaltung & Linkgenerierung)

Diese Seite ermöglicht es Abgeordneten (MdBs), Anfragen für Wahlkampftouren oder Besuche zu verwalten. Kernstück ist die Generierung eines einzigartigen Formularlinks, der an anfragende Stellen (z.B. Kreisverbände) weitergegeben wird. Über diesen Link können dann konkrete Touranfragen für den MdB eingereicht werden, die anschließend auf dieser Seite erscheinen und verwaltet werden können.

## Kernfunktionen der Seite `/touranfragen`:

- **Formularlink Generieren**:
    - Ein MdB kann einen neuen, einzigartigen Link generieren lassen.
    - Dieser Vorgang ruft `POST /api/touranfragen/generate-link` auf.
    - Der generierte Link (Format: `[Basis-URL]/tour-form/[token]`) wird angezeigt und kann kopiert werden.
- **Anzeigen von Touranfragen**:
    - Listet alle Touranfragen auf, die für den eingeloggten MdB eingegangen sind (vermutlich über das oben genannte Formular).
    - Jede Anfrage wird als Karte dargestellt mit Details wie:
        - Kreisverband, Landesverband, Name des Kandidaten/Anfragenden.
        - Gewünschter Zeitraum (Von/Bis).
        - Themenvorschläge.
        - Angabe, ob Videoaufnahmen gewünscht sind.
        - Kontaktdaten der Ansprechpartner.
        - Status der Anfrage (z.B. 'Neu', 'Eingegangen', 'Terminiert', 'Abgeschlossen').
    - Die Anfragen werden von `GET /api/touranfragen` geladen.
- **Status von Anfragen ändern**:
    - Der Status jeder Anfrage kann direkt auf der Seite über ein Dropdown-Menü geändert werden.
    - Eine Statusänderung ruft `PATCH /api/touranfragen` auf.
    - Anfragen mit dem Status 'Neu' werden beim ersten Laden automatisch auf 'Eingegangen' gesetzt.

## API-Endpunkte und Supabase-Interaktion:

### 1. `GET /api/touranfragen`
- **Zweck**: Abrufen aller Touranfragen für den eingeloggten MdB.
- **Supabase-Tabelle**: `touranfragen`.
- **Authentifizierung**: Erfordert angemeldeten MdB.
- **Filterung**: Filtert Einträge in `touranfragen` basierend auf der `user_id` des MdB unter Verwendung der Supabase UUID aus der Authentifizierungssession.
- **Sortierung**: Nach `created_at` (Erstellungsdatum der Anfrage), absteigend.
- **Datenmapping (Supabase-Felder zu UI-Daten)**:
    - `id` (UUID), `created_at` (`createdAt`), `kreisverband`, `landesverband`, `kandidat_name`, `zeitraum_von`, `zeitraum_bis`, `themen`, `video` (Boolean zu 'Ja'/'Nein'), `ansprechpartner_1_name`, `ansprechpartner_1_phone`, `ansprechpartner_2_name`, `ansprechpartner_2_phone`, `programmvorschlag` (Boolean zu Text), `status`.

### 2. `PATCH /api/touranfragen`
- **Zweck**: Aktualisieren des `status`-Feldes einer spezifischen Touranfrage.
- **Supabase-Tabelle**: `touranfragen`.
- **Authentifizierung**: Erfordert angemeldeten MdB.
- **Parameter**: Benötigt `id` (UUID der Anfrage) und neuen `status`.
- **Aktion**: Aktualisiert das Feld `status` für den gegebenen Eintrag mit Besitzervalidierung.

### 3. `POST /api/touranfragen/generate-link`
- **Zweck**: Generiert einen einmaligen Token und speichert diesen mit der MdB-UserID, um ein öffentliches Formular (`/tour-form/[token]`) für Touranfragen zu ermöglichen.
- **Supabase-Tabellen**:
    - `users`: Für die Authentifizierungsvalidierung des MdB basierend auf der Supabase UUID aus dem Auth-Token.
    - `touranfragen_links`: Zum Speichern des generierten Links/Tokens.
- **Authentifizierung**: Erfordert angemeldeten MdB.
- **Aktionen**:
    1. Validiert MdB-Authentifizierung über Supabase UUID aus der Session.
    2. Generiert einen 32-Byte hexadezimalen Token (`crypto.randomBytes`).
    3. Erstellt einen neuen Eintrag in `touranfragen_links` mit:
        - `user_id` (Supabase UUID des MdB aus `users`).
        - `token` (der generierte Hex-String).
        - `created_at` (automatisches Supabase Timestamp).
        - `active` (gesetzt auf `true`).
    4. Gibt den vollständigen Link (`[Basis-URL]/tour-form/[token]`), den Token und die UUID des Eintrags in `touranfragen_links` zurück.

## Verwendete Supabase-Tabellen und wichtige Felder:

- **`touranfragen`**:
    - `user_id` (UUID Foreign Key zur `users`-Tabelle)
    - `created_at` (Supabase Timestamp)
    - `kreisverband`, `landesverband`, `kandidat_name`
    - `zeitraum_von`, `zeitraum_bis`
    - `themen`
    - `video` (Boolean)
    - `ansprechpartner_1_name`, `ansprechpartner_1_phone`
    - `ansprechpartner_2_name`, `ansprechpartner_2_phone`
    - `programmvorschlag` (Boolean)
    - `status` (Text mit Enum-Validierung: 'Neu', 'Eingegangen', 'Terminiert', 'Abgeschlossen')
- **`users`**:
    - `id` (Supabase UUID - Primärschlüssel)
    - Weitere Benutzerfelder für Authentifizierung und Profildaten
- **`touranfragen_links`**:
    - `user_id` (UUID Foreign Key zur `users`-Tabelle)
    - `token` (Text, der generierte einmalige Token)
    - `created_at` (Supabase Timestamp)
    - `active` (Boolean)

## Datenfluss für neue Anfragen (vermutet):
1. MdB generiert Link über `/touranfragen` (`POST /api/touranfragen/generate-link`). Eintrag in `touranfragen_links` entsteht.
2. MdB teilt Link (`.../tour-form/[token]`).
3. Externe Person füllt Formular auf `/tour-form/[token]` aus.
4. Das Absenden dieses Formulars erstellt einen neuen Eintrag in der `touranfragen`-Tabelle, der mit dem MdB (dessen `user_id` im `touranfragen_links`-Eintrag gespeichert ist) verknüpft wird.
5. Die neue Anfrage erscheint dann auf der `/touranfragen`-Seite des MdB.

## Offene To-Dos / Beobachtungen:
- Die genaue Funktionsweise und Supabase-Interaktion der `/tour-form/[token]`-Seite und des zugehörigen Submit-API-Endpunkts (`/api/tour-form/submit`) ist hier nicht analysiert, aber wesentlich für den Gesamtprozess.
- Die Berechtigungsprüfung beim `PATCH`-Aufruf für Statusänderungen erfolgt über Row Level Security (RLS) in Supabase und explizite Besitzervalidierung.

## Integrationen

- **Supabase**: Speicherung aller Touranfragen, deren Status, Teilnehmerdaten und zugehöriger Kommunikation in PostgreSQL-Datenbank.
- **Tour-Formular (`/tour-form/[token]`)**: Empfang der finalen Anmeldedaten von Teilnehmern.
- **Kalendersystem**: Blockierung von Terminen und Eintragung bestätigter Touren.
- **E-Mail-System**: Für die Kommunikation mit Anfragestellern.
- **Besucherdienst des Bundestages**: Ggf. Abgleich mit den Kapazitäten und Regeln des offiziellen Besucherdienstes.

## Offene To-Dos und Implementierungsideen

- Entwicklung eines Dashboards mit Statistiken zu Anfragen und durchgeführten Touren.
- Implementierung eines Systems zur (teil-)automatischen Zuweisung von Terminen basierend auf Präferenzen und Verfügbarkeiten.
- Vorlagen für Standard-E-Mails (Bestätigung, Absage, Erinnerung).
- Funktion zur Erstellung von Namensschildern oder Teilnehmerlisten für die Tour-Guides.
- Feedback-Mechanismus nach durchgeführten Touren.
- Anbindung an `/api/touranfragen/generate-link` und Logik für die Token-Erstellung. 