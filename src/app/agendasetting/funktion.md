# Funktionalität: Agendasetting (`/agendasetting`)

Diese Seite dient Mitgliedern des Fraktionsvorstands dazu, neue Kommunikationslinien zentral zu definieren und zu verwalten.

## Funktionen im Detail:

1.  **Zugriffskontrolle**:
    *   Die Seite ist ausschließlich für Benutzer zugänglich, bei denen das Feld `is_fraktionsvorstand` in der `users`-Tabelle auf `true` gesetzt ist.
    *   Nicht autorisierte Benutzer erhalten eine Fehlermeldung und können nicht auf die Inhalte zugreifen.

2.  **Formular zur Erstellung einer neuen Kommunikationslinie**:
    *   **Hauptthema**: Einzeiliges Textfeld für den Titel oder das Kernthema der Kommunikationslinie.
    *   **Beschreibung**: Mehrzeiliges Textfeld für eine ausführliche Beschreibung. Zukünftig soll hier Markdown mit Bild-Uploads und iFrame-Einbettung (z.B. Datawrapper) unterstützt werden.
    *   **Argument 1, Argument 2, Argument 3**: Drei separate mehrzeilige Textfelder für die Kernargumente.
    *   **Zahl der Woche**: Einzeiliges Textfeld für eine prägnante Zahl oder Statistik.
    *   **Beschreibung (Zahl der Woche)**: Mehrzeiliges Textfeld zur Erläuterung der Zahl der Woche.
    *   **Zuständiges MdB**: Dropdown-Menü zur Auswahl eines MdB aus der `users`-Tabelle. Dieses MdB wird als Ansprechpartner für Rückfragen zur Kommunikationslinie angezeigt.
    *   **Weiterführende Links (Further Reading)**: Dynamische Liste von Eingabefeldern, um URLs zu relevanten Artikeln oder Quellen hinzuzufügen. Es können beliebig viele Links hinzugefügt und entfernt werden.
    *   **Start-Datum**: Datumsauswahl, ab wann die Kommunikationslinie als aktiv gilt.
    *   **End-Datum**: Datumsauswahl, bis wann die Kommunikationslinie als aktuell gilt.
    *   **Anhänge (PDFs)**: Dateiauswahlfeld, um mehrere PDF-Dateien hochzuladen. Die hochgeladenen Dateien werden im Supabase Storage Bucket `communicationattachments` gespeichert und mit der Kommunikationslinie verknüpft.

3.  **Speichervorgang**:
    *   Beim Absenden des Formulars werden die Daten in der Supabase-Datenbank gespeichert:
        *   Die Hauptinformationen der Kommunikationslinie werden in die Tabelle `communication_lines` geschrieben.
        *   Hochgeladene PDF-Anhänge werden in den Storage Bucket `communicationattachments` geladen. Die Metadaten der Anhänge (Dateiname, Storage-Pfad) werden in der Tabelle `communication_line_attachments` gespeichert und mit dem entsprechenden Eintrag in `communication_lines` verknüpft.
    *   Nach erfolgreicher Erstellung wird eine Erfolgsmeldung angezeigt und das Formular zurückgesetzt.
    *   Fehler während des Prozesses werden dem Benutzer angezeigt.

## Datenspeicherung und APIs:

*   **Datenbanktabellen**:
    *   `public.communication_lines`: Speichert die Kerndaten jeder Kommunikationslinie.
    *   `public.communication_line_attachments`: Speichert Informationen zu den PDF-Anhängen.
    *   `public.users`: Dient zur Überprüfung der `is_fraktionsvorstand`-Berechtigung und zur Auswahl des zuständigen MdB.
*   **Supabase Storage**:
    *   Bucket `communicationattachments`: Dient zur Speicherung der hochgeladenen PDF-Dateien.
*   **API-Aufrufe (Client-seitig via Supabase JS SDK)**:
    *   Abruf der Benutzerinformationen (insbesondere `is_fraktionsvorstand`).
    *   Abruf der Liste aller MdB (Namen und IDs) für das Dropdown-Menü.
    *   Speichern der Formulardaten in `communication_lines`.
    *   Hochladen von Dateien in den `communicationattachments` Bucket.
    *   Speichern der Anhang-Metadaten in `communication_line_attachments`.

## Erwartete Benutzerinteraktion:

*   Der Benutzer (Mitglied des Fraktionsvorstands) füllt die Felder des Formulars aus.
*   Der Benutzer lädt optional PDF-Dateien als Anhänge hoch.
*   Der Benutzer wählt optional ein Start- und Enddatum für die Gültigkeit der Kommunikationslinie.
*   Der Benutzer sendet das Formular ab, um die Kommunikationslinie zu erstellen.

## Mehrwert für das Büro eines MdB:

Diese Seite ermöglicht es dem Fraktionsvorstand, schnell und effizient zentrale Kommunikationsleitlinien festzulegen und mit relevanten Informationen (Argumenten, Zahlen, weiterführenden Links, Dokumenten) anzureichern. Dies stellt sicher, dass alle Abgeordneten Zugriff auf konsistente und aktuelle Informationen für ihre Öffentlichkeitsarbeit und politische Kommunikation haben. 