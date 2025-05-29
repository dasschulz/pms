# Funktionalität: Agendasetting (`/agendasetting`)

Diese Seite dient Mitgliedern des Fraktionsvorstands dazu, neue Kommunikationslinien zentral zu definieren und zu verwalten.

## Funktionen im Detail:

1.  **Layout und Design**:
    *   Vollbildschirm-Layout mit angemessenen Abständen.
    *   Moderne PageLayout-Komponente mit Titel und Beschreibung.
    *   Die Formular-Elemente sind in einer übergeordneten Struktur angeordnet, die primär aus einem zweispaltigen Grid für die oberen Sektionen besteht, gefolgt von einem weiteren zweispaltigen Grid für "Anhänge" und "Start-/End-Datum", und abschließend dem "Erstellen"-Button.
        *   **Obere Sektion - Spalte 1**: Hauptthema, Beschreibung, Argumente (1-3, `rows={7}`).
        *   **Obere Sektion - Spalte 2**: Zahl der Woche, Beschreibung (Zahl der Woche), Zuständiges MdB, Weiterführende Links.
        *   **Untere Sektion (Sub-Grid) - Spalte 1**: Anhänge.
        *   **Untere Sektion (Sub-Grid) - Spalte 2**: Start-/End-Datum (horizontal ausgerichtet mit Anhänge).
        *   **Abschließende Sektion**: Erstellen-Button (unterhalb des Sub-Grids, im visuellen Fluss der ersten Spalte).
    *   Responsive Grid-Layouts, die auf kleineren Bildschirmen zu einer Spalte wechseln.

2.  **Skeleton Loading**:
    *   Die Skeleton-Ansicht spiegelt diese neue verschachtelte Grid-Struktur wider.

3.  **Zugriffskontrolle**:
    *   Die Seite ist ausschließlich für Benutzer zugänglich, bei denen das Feld `is_fraktionsvorstand` in der `users`-Tabelle auf `true` gesetzt ist.
    *   Nicht autorisierte Benutzer erhalten eine Fehlermeldung und können nicht auf die Inhalte zugreifen.

4.  **Formular zur Erstellung einer neuen Kommunikationslinie**:
    *   **Hauptthema**: (Obere Sektion, Spalte 1)
    *   **Beschreibung**: (Obere Sektion, Spalte 1)
    *   **Argument 1, Argument 2, Argument 3**: (Obere Sektion, Spalte 1, `rows={7}`)
    *   **Zahl der Woche**: (Obere Sektion, Spalte 2)
    *   **Beschreibung (Zahl der Woche)**: (Obere Sektion, Spalte 2)
    *   **Zuständiges MdB**: (Obere Sektion, Spalte 2)
    *   **Weiterführende Links**: (Obere Sektion, Spalte 2)
    *   **Anhänge**: (Untere Sektion/Sub-Grid, Spalte 1)
    *   **Start-Datum / End-Datum**: (Untere Sektion/Sub-Grid, Spalte 2)
    *   **Erstellen-Button**: (Unterhalb des Sub-Grids)

5.  **Speichervorgang**:
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
*   **API-Aufrufe**:
    *   Abruf der Benutzerinformationen (insbesondere `is_fraktionsvorstand`).
    *   Abruf der Liste aller MdB (Namen und IDs) für das Dropdown-Menü über `/api/users/mdb-list`, gefiltert nach `role='MdB'`.
    *   Speichern der Formulardaten in `communication_lines`.
    *   Hochladen von Dateien in den `communicationattachments` Bucket.
    *   Speichern der Anhang-Metadaten in `communication_line_attachments`.

## Erwartete Benutzerinteraktion:

*   Der Benutzer füllt das Formular in der neu strukturierten Anordnung aus.
*   "Anhänge" und "Start-/End-Datum" sollten nun klar auf derselben horizontalen Ebene erscheinen.

## Mehrwert für das Büro eines MdB:

Die überarbeitete Struktur zielt darauf ab, eine endgültig korrekte und intuitive horizontale Ausrichtung der zusammengehörigen Elemente ("Anhänge" und "Daten") zu erreichen und gleichzeitig eine klare Gliederung der verschiedenen Eingabebereiche beizubehalten. Dies stellt sicher, dass alle Abgeordneten Zugriff auf konsistente und aktuelle Informationen für ihre Öffentlichkeitsarbeit und politische Kommunikation haben. 