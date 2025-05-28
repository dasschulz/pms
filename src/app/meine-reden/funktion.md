# Funktionsweise Meine Reden

Diese Seite dient Abgeordneten zur Verwaltung, Archivierung und Vorbereitung ihrer Reden im Plenum, bei Veranstaltungen oder anderen Anlässen.

## Kernfunktionen

- **Redenarchiv**: Sammlung aller gehaltenen und geplanten Reden des Abgeordneten.
- **Redentext-Management**: Hochladen, Bearbeiten und Versionieren von Redemanuskripten.
- **Metadaten**: Erfassung von Informationen zu jeder Rede (Datum, Ort, Anlass, Thema, Stichworte, Dauer).
- **Recherchefunktion**: Durchsuchen des eigenen Redenarchivs nach Stichworten, Themen oder Zeiträumen.
- **Veröffentlichungsstatus**: Kennzeichnung, ob und wo eine Rede veröffentlicht wurde (z.B. Plenarprotokoll, Webseite, Social Media).
- **Vorbereitungstools**: Ggf. Integration von Tools zur Stichwortmarkierung, Zeitplanung oder Notizerstellung innerhalb des Manuskripts.
- **Export/Download**: Möglichkeit, Redetexte in verschiedenen Formaten (PDF, DOCX) herunterzuladen.

## Integrationen

- **Airtable**: Speicherung der Redemetadaten und Verlinkung zu den Manuskripten.
- **Bundestags-Plenarprotokolle (DIP)**: Mögliche Verlinkung oder Abgleich mit den offiziellen Protokollen und Videoaufzeichnungen.
- **Redenschreiber-Modul (`/redenschreiber`)**: Enge Verknüpfung, falls Reden hierüber erstellt oder überarbeitet werden.
- **Cloud-Speicher**: Ablage der Redemanuskripte (z.B. in PDF- oder Word-Format).
- **Website des Abgeordneten**: Schnittstelle zur Veröffentlichung von Redetexten oder -auszügen auf der persönlichen Webseite.

## Offene To-Dos und Implementierungsideen

- Entwicklung der Upload- und Bearbeitungsfunktionen für Redemanuskripte.
- Implementierung einer robusten Such- und Filterfunktion.
- Schnittstelle zu den Plenarprotokollen des Bundestages (z.B. zur automatischen Verlinkung).
- Integration von KI-basierten Tools zur Redeanalyse oder -unterstützung (siehe `/api/ai/rede-feedback`).
- Teilen-Funktion für die interne Weitergabe von Redemanuskripten.
- Möglichkeit, Audio- oder Videoaufzeichnungen der Rede zu verknüpfen. 