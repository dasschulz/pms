# Funktionsweise Redenschreiber

Diese Seite unterstützt Abgeordnete und ihre Mitarbeiter beim Verfassen, Überarbeiten und Verwalten von Redemanuskripten.

## Kernfunktionen

- **Texteditor mit Redefunktionen**: Spezieller Editor, der auf die Bedürfnisse beim Redenschreiben zugeschnitten ist (z.B. Markierung von Sprechpausen, Zeitkalkulation, Notizen für den Vortrag).
- **Baustein-Management**: Zugriff auf eine Bibliothek von Textbausteinen, Zitaten, Argumentationslinien oder Standardformulierungen.
- **Kollaboration**: Möglichkeit zur gemeinsamen Bearbeitung von Reden im Team.
- **Recherche-Integration**: Direkter Zugriff auf relevante Informationsquellen (z.B. `/dokumentensuche`, DIP, interne Argumentationspapiere).
- **KI-Unterstützung (optional)**: Anbindung an `/api/ai/rede-feedback` oder ähnliche Tools zur Analyse von Textverständlichkeit, Stil, Argumentationsstruktur oder für Formulierungsvorschläge.
- **Versionierung**: Speicherung verschiedener Versionen eines Redemanuskripts.
- **Export**: Ausgabe der Rede in verschiedenen Formaten (PDF, DOCX, reiner Text) für den Vortrag oder die Archivierung.

## Integrationen

- **Supabase**: Speicherung von Redenentwürfen, Metadaten, Status und Feedback.
- **Meine Reden (`/meine-reden`)**: Enge Verknüpfung zur Archivierung und Verwaltung der fertigen Reden.
- **Dokumentensuche (`/dokumentensuche`)**: Zur Recherche von Hintergrundinformationen.
- **Cloud-Speicher**: Für die Ablage von umfangreichen Recherchematerialien.
- **KI-Dienste**: Anbindung an die API unter `/api/ai/rede-feedback` für Feedback und Unterstützung.

## Offene To-Dos und Implementierungsideen

- Entwicklung eines spezialisierten Texteditors mit Fokus auf Reden.
- Aufbau einer durchsuchbaren Baustein-Bibliothek.
- Implementierung der Kollaborations- und Versionierungsfunktionen.
- Vertiefte Integration von KI-Tools zur Unterstützung des Schreibprozesses.
- Funktion zur Simulation der Rededauer basierend auf Textlänge und Sprechgeschwindigkeit.
- Integration von Tools zur Überprüfung auf Plagiate (optional).
- Checklisten für wichtige Redeelemente oder rhetorische Mittel. 