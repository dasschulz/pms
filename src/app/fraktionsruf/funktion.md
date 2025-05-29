# Funktionsweise Fraktionsruf

Hier können Mitglieder des Fraktionsvorstandes (Check in Supabase: users -> is_fraktionsvorstand: true) einen Fraktionsruf versenden, wenn zu wenige Abgeordnete im Plenum sind. 

Aus Kostengründen sind SMS auf 6 pro Monat limitiert (eine typische SMS-Kampagne an den Fraktionsvorstand kostet ca. 6 USD für 64 SMS). Hierzu läuft ein Counter, der die versendeten SMS pro Monat zählt (gespeichert in Supabase: `fraktionsruf_counter`).

Die Seite bietet folgende Kommunikationsformen:
- **Mail**: Versendet eine E-Mail an alle Hauptaccounts der Fraktionsmitglieder.
- **SMS**: Versendet eine SMS an die hinterlegten Nummern (limitiert auf 6 pro Monat).
- **WebApp-Reminder**: Schickt eine sichtbare Benachrichtigung (Toast) mit Ton an alle aktuell im MdB-App Studio eingeloggten Nutzer.

**Wichtiger Hinweis:** Die konkreten Sendefunktionen (Mailversand, SMS-Versand, WebApp-Toast-Logik) für diese Kommunikationsformen müssen noch implementiert werden. Aktuell wird bei Auswahl von "SMS" nur der Zähler in der Supabase-Datenbank (`fraktionsruf_counter`) erhöht bzw. ein neuer Eintrag für den aktuellen Monat erstellt.

## Integration Tagesordnung (BT-TO-API)

Über die BT-TO-API (Bundestags-Tagesordnungs-API) wird der nächste Tagesordnungspunkt (TOP) angezeigt, der spezifisch als Aufsetzungspunkt für die Fraktion DIE LINKE gekennzeichnet ist. 

Durch einen Klick auf diesen angezeigten Termin können die relevanten Informationen (z.B. Thema des TOPs, geplante Zeit) direkt in die entsprechenden Felder des Fraktionsruf-Formulars übernommen werden, um die Dateneingabe zu beschleunigen. 

## Offene To-Dos und Implementierungsideen

Folgende Kernfunktionen müssen im API-Endpunkt `/api/fraktionsruf/submit/route.ts` noch implementiert werden:

1.  **E-Mail-Versand (`sendMail`):
    *   **Logik**: Beim Auswählen dieser Option soll eine E-Mail an eine vordefinierte Gruppe von Empfängern (z.B. alle Nutzer mit `is_fraktionsvorstand = true` oder eine spezifische Mailingliste) gesendet werden.
    *   **Inhalt der E-Mail**: Die E-Mail sollte die im Formular eingegebenen Informationen enthalten (MdB im Plenum, Thema, TOP-Zeit).
    *   **Technische Umsetzungsideen**:
        *   Nutzung eines E-Mail-Services wie SendGrid, AWS SES, Resend oder eines eigenen SMTP-Servers.
        *   Erstellung einer HTML-Vorlage für die E-Mails für ein ansprechendes Design.
        *   Abruf der Empfängerliste aus Supabase (z.B. alle Nutzer der `users`-Tabelle, die als `is_fraktionsvorstand` markiert sind und eine E-Mail-Adresse haben).

2.  **SMS-Versand (`sendSMS`):
    *   **Logik**: Beim Auswählen dieser Option soll eine SMS an eine vordefinierte Gruppe von Telefonnummern gesendet werden, nachdem der Zähler in `fraktionsruf_counter` erfolgreich geprüft und ggf. ein Eintrag erstellt wurde.
    *   **Inhalt der SMS**: Die SMS sollte eine kurze, prägnante Nachricht enthalten, die auf den dringenden Fraktionsruf hinweist und die wichtigsten Informationen (z.B. Thema) beinhaltet. Aufgrund der Längenbeschränkung von SMS muss der Inhalt ggf. gekürzt werden.
    *   **Technische Umsetzungsideen**:
        *   Nutzung eines SMS-Gateway-Anbieters wie Twilio, Vonage (Nexmo) oder Sipgate.
        *   Abruf der Telefonnummern aus Supabase (z.B. aus einem speziellen Feld in der `users`-Tabelle für Fraktionsvorstandsmitglieder oder einer separaten Tabelle für Notfallkontakte).
        *   Sicherstellen, dass die Kostenkontrolle (6 SMS/Monat) serverseitig robust ist.

3.  **WebApp-Reminder (`webappReminder`):
    *   **Logik**: Beim Auswählen dieser Option soll eine sofortige Benachrichtigung (Toast-Nachricht mit Ton) an alle aktuell in der MdB-App eingeloggten und aktiven Nutzer gesendet werden.
    *   **Inhalt des Reminders**: Ähnlich wie bei der SMS, eine kurze Information über den Fraktionsruf.
    *   **Technische Umsetzungsideen**:
        *   **WebSockets**: Implementierung eines WebSocket-Servers (z.B. mit `ws` oder Socket.IO) und entsprechender Client-Logik, um Nachrichten in Echtzeit an alle verbundenen Clients zu pushen.
        *   **Server-Sent Events (SSE)**: Eine einfachere Alternative zu WebSockets für unidirektionale Server-zu-Client-Kommunikation.
        *   **Push-Services Dritter**: Nutzung von Diensten wie Pusher, Ably oder Firebase Cloud Messaging (FCM), um die Komplexität der Echtzeitkommunikation zu reduzieren.
        *   Die Benachrichtigung auf Client-Seite könnte über die `sonner`-Bibliothek (oder eine ähnliche Toast-Bibliothek) realisiert werden, die bereits im Projekt verwendet wird.

**Allgemeine Überlegungen für die Implementierung:**
*   **Fehlerbehandlung**: Robuste Fehlerbehandlung für alle externen API-Aufrufe (Mail, SMS, Push-Dienste).
*   **Konfiguration**: Speicherung von API-Schlüsseln und anderen sensiblen Konfigurationsdaten sicher in Umgebungsvariablen.
*   **Logging**: Erweitertes Logging der Sendeversuche und -ergebnisse für Debugging und Nachvollziehbarkeit. 