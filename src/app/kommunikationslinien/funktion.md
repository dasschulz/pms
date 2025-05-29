# Funktionalität: Kommunikationslinien (`/kommunikationslinien`)

Diese Seite dient allen angemeldeten Benutzern zur Ansicht der vom Fraktionsvorstand festgelegten Kommunikationslinien.

## Funktionen im Detail:

1.  **Anzeige aktueller Kommunikationslinien**:
    *   Zeigt prominent die aktuell gültige Kommunikationslinie(n) an. Der Titel des Abschnitts zeigt den Gültigkeitszeitraum der Linie (z.B. "Aktiver Zeitraum: TT.MM.JJJJ - TT.MM.JJJJ" oder "Aktiv seit: TT.MM.JJJJ (Unbegrenzt)"). Die Farbe des Kalender-Icons im Titel ist an das globale Design angepasst (`text-primary`).
    *   Die Darstellung der aktuellen Linie ist in drei separate Karten aufgeteilt, die nebeneinander angeordnet sind:
        *   **Karte 1: Hauptthema (ca. 35% Breite)**
            *   Titel: Der Inhalt des Feldes `hauptthema` der Kommunikationslinie (kein Icon).
            *   Beschreibung des Hauptthemas (Markdown unterstützt).
            *   Argumente 1, 2 und 3 (falls vorhanden) werden jeweils als eigener, individuell einklappbarer Bereich (Accordion-Item) untereinander dargestellt. Argumentüberschriften sind z.B. "Argument 1". (Markdown unterstützt).
        *   **Karte 2: Zahl der Woche (ca. 35% Breite)**
            *   Titel: "Zahl der Woche: [Die Zahl]" (kein Icon).
            *   Inhalt: Beschreibung der Zahl der Woche (Markdown unterstützt).
        *   **Karte 3: Zuständiges MdB & Materialien (ca. 30% Breite)**
            *   **Zuständiges MdB (falls hinterlegt):**
                *   Oben: Profilbild des MdB (nimmt die volle Breite der Kopfzeile der Karte ein).
                *   Darunter: Name des MdB.
                *   Darunter: E-Mail-Adresse (als `mailto:` Link).
                *   Darunter: Büro-Telefonnummer.
            *   Falls kein MdB hinterlegt ist, wird "Zuständiges MdB" als Titel ohne Icon angezeigt, mit einem Hinweis.
            *   **Weiterführende Links (Further Reading):** Eine Liste von anklickbaren Links.
            *   **PDF-Anhänge:** Eine Liste von PDF-Dateien mit Download-Funktionalität.
    *   Accordion-Elemente werden nur noch für die einzelnen Argumente innerhalb der Hauptthema-Karte verwendet.

2.  **Anzeige und Suche vergangener Kommunikationslinien**:
    *   Zeigt Kommunikationslinien an, deren `end_date` in der Vergangenheit liegt oder die keine Datumsangaben haben.
    *   Ein Suchfeld ermöglicht die Volltextsuche innerhalb der vergangenen Linien (Hauptthema, Beschreibung, Zahl der Woche).
    *   Die Ergebnisse werden paginiert dargestellt.
    *   Die Darstellung pro Kachel für vergangene Linien bleibt im ursprünglichen Format (eine Karte pro Linie) und nutzt Accordions für Beschreibung, Argumente und Zahl der Woche.

3.  **Skeleton Loading**:
    *   Während die Daten geladen werden, zeigen Skeleton-Elemente eine Vorschau der kompletten Seitenstruktur an, um die wahrgenommene Ladezeit zu verbessern und ein "Aufflackern" der Inhalte zu verhindern. 
    *   Für aktuelle Linien wird ein Skeleton angezeigt, das die neue Drei-Karten-Struktur exakt widerspiegelt, einschließlich der MdB-Profilbild-Bereiche.
    *   Für vergangene Linien werden Skeleton-Karten im Grid-Layout angezeigt.
    *   Die Skeleton-Anzeige erfolgt durch Early Return, sodass keine andere Inhalte sichtbar werden, bevor die Daten vollständig geladen sind.

4.  **Download aktueller Linien als PDF (TODO)**:
    *   Ein Button ist vorhanden, um potenziell alle aktuellen Kommunikationslinien gesammelt als PDF herunterzuladen. Diese Funktionalität ist aktuell noch nicht implementiert.

## Datenspeicherung und APIs:

*   **Supabase RPC-Funktion**: `get_communication_lines_with_details()`
    *   Diese Funktion wird aufgerufen, um alle Kommunikationslinien inklusive der Details zum zuständigen MdB (aus der `users`-Tabelle) und den zugehörigen Anhängen (aus `communication_line_attachments`) zu laden.
    *   Die Trennung in "aktuelle" und "vergangene" Linien erfolgt client-seitig basierend auf den Datumsfeldern.
    *   Die öffentlichen URLs für PDF-Anhänge werden beim Laden der Kommunikationslinien abgerufen und im State gespeichert, um die Download-Links zu generieren.
*   **Datenbanktabellen (indirekt über RPC)**:
    *   `public.communication_lines`: Enthält die Kerndaten der Kommunikationslinien.
    *   `public.communication_line_attachments`: Enthält Informationen zu den PDF-Anhängen.
    *   `public.users`: Liefert Details zum zuständigen MdB (Name, E-Mail, Profilbild-URL, Telefonnummer).
*   **Supabase Storage**:
    *   Bucket `communicationattachments`: Von hier werden die öffentlichen URLs für die PDF-Anhänge geholt, um den Download zu ermöglichen.
*   **API-Aufrufe (Client-seitig via Supabase JS SDK)**:
    *   Aufruf der RPC-Funktion `get_communication_lines_with_details()`.
    *   Abruf der öffentlichen URLs für jeden Anhang über `supabase.storage.from('communicationattachments').getPublicUrl()` beim Laden der Daten.

## Erwartete Benutzerinteraktion:

*   Du kannst aktuelle Kommunikationslinien in der neuen Drei-Karten-Ansicht einsehen.
*   Du kannst jedes Argument in der Hauptthema-Karte individuell auf- und zuklappen.
*   Du kannst in vergangenen Kommunikationslinien suchen und die Ergebnisse durchblättern.
*   Du kannst auf weiterführende Links klicken und PDF-Anhänge herunterladen.

## Mehrwert für das Büro eines MdB:

Diese Seite bietet allen Mitarbeitern und Abgeordneten einen zentralen und stets aktuellen Überblick über die offiziellen Kommunikationsleitlinien der Fraktion. Die überarbeitete Darstellung der aktuellen Linie sorgt für eine noch schnellere Erfassbarkeit der Kernbotschaften. Sie erleichtert den Zugriff auf wichtige Argumente, Zahlen und Dokumente, was die Kohärenz und Effizienz der politischen Kommunikation nach außen und innen stärkt. 