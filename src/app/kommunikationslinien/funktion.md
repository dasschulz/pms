# Funktionalität: Kommunikationslinien (`/kommunikationslinien`)

Diese Seite dient allen angemeldeten Benutzern zur Ansicht der vom Fraktionsvorstand festgelegten Kommunikationslinien.

## Funktionen im Detail:

1.  **Anzeige aktueller Kommunikationslinien**:
    *   Zeigt prominent die Kommunikationslinien an, deren `start_date` erreicht und deren `end_date` noch nicht überschritten ist (oder wenn kein `end_date` gesetzt ist).
    *   Die Darstellung erfolgt in einem Grid-Layout (Kachelansicht).
    *   Jede Kachel zeigt:
        *   Hauptthema
        *   Gültigkeitszeitraum (Start- und Enddatum)
        *   Beschreibung (einklappbar/Accordion)
        *   Argumente 1-3 (einklappbar/Accordion)
        *   Zahl der Woche mit Beschreibung (einklappbar/Accordion)
        *   Informationen zum zuständigen MdB (falls hinterlegt):
            *   Profilbild
            *   Name
            *   E-Mail-Adresse (als `mailto:` Link)
            *   Büro-Telefonnummer
        *   Weiterführende Links (Further Reading)
        *   PDF-Anhänge (als Download-Links)

2.  **Anzeige und Suche vergangener Kommunikationslinien**:
    *   Zeigt Kommunikationslinien an, deren `end_date` in der Vergangenheit liegt oder die keine Datumsangaben haben.
    *   Ein Suchfeld ermöglicht die Volltextsuche innerhalb der vergangenen Linien (Hauptthema, Beschreibung, Zahl der Woche).
    *   Die Ergebnisse werden paginiert dargestellt.
    *   Die Darstellung pro Kachel ist identisch zu den aktuellen Linien.

3.  **Skeleton Loading**:
    *   Während die Daten geladen werden, zeigen Skeleton-Elemente eine Vorschau der Seitenstruktur an, um die wahrgenommene Ladezeit zu verbessern.

4.  **Download aktueller Linien als PDF (TODO)**:
    *   Ein Button ist vorhanden, um potenziell alle aktuellen Kommunikationslinien gesammelt als PDF herunterzuladen. Diese Funktionalität ist aktuell noch nicht implementiert.

## Datenspeicherung und APIs:

*   **Supabase RPC-Funktion**: `get_communication_lines_with_details()`
    *   Diese Funktion wird aufgerufen, um alle Kommunikationslinien inklusive der Details zum zuständigen MdB (aus der `users`-Tabelle) und den zugehörigen Anhängen (aus `communication_line_attachments`) zu laden.
    *   Die Trennung in "aktuelle" und "vergangene" Linien erfolgt client-seitig basierend auf den Datumsfeldern.
*   **Datenbanktabellen (indirekt über RPC)**:
    *   `public.communication_lines`: Enthält die Kerndaten der Kommunikationslinien.
    *   `public.communication_line_attachments`: Enthält Informationen zu den PDF-Anhängen.
    *   `public.users`: Liefert Details zum zuständigen MdB.
*   **Supabase Storage**:
    *   Bucket `communicationattachments`: Von hier werden die öffentlichen URLs für die PDF-Anhänge geholt, um den Download zu ermöglichen.
*   **API-Aufrufe (Client-seitig via Supabase JS SDK)**:
    *   Aufruf der RPC-Funktion `get_communication_lines_with_details()`.
    *   Abruf der öffentlichen URLs für jeden Anhang über `supabase.storage.from('communicationattachments').getPublicUrl()`.

## Erwartete Benutzerinteraktion:

*   Benutzer können aktuelle Kommunikationslinien einsehen und deren Details (Argumente, Beschreibungen, Anhänge) öffnen.
*   Benutzer können in vergangenen Kommunikationslinien suchen und die Ergebnisse durchblättern.
*   Benutzer können auf weiterführende Links klicken und PDF-Anhänge herunterladen.

## Mehrwert für das Büro eines MdB:

Diese Seite bietet allen Mitarbeitern und Abgeordneten einen zentralen und stets aktuellen Überblick über die offiziellen Kommunikationsleitlinien der Fraktion. Sie erleichtert den Zugriff auf wichtige Argumente, Zahlen und Dokumente, was die Kohärenz und Effizienz der politischen Kommunikation nach außen und innen stärkt. 