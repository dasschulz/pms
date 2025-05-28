# Funktionsweise BPA (Bundespresseamt)

Diese Seite dient als zentraler Anlaufpunkt für alle Aktivitäten und Informationen im Zusammenhang mit dem Bundespresseamt (BPA), insbesondere im Kontext von Besuchergruppen und Informationsfahrten.

## Kernfunktionen

- **Dashboard/Übersicht**: Anzeige wichtiger Kennzahlen und aktueller Aktivitäten (z.B. anstehende BPA-Fahrten, Kontingente, Anmeldestatus).
- **Informationsmaterial**: Bereitstellung von Richtlinien, Antragsformularen und Informationsmaterialien des BPA.
- **Verwaltung von Kontingenten**: Übersicht und Verwaltung der dem Abgeordneten/der Fraktion zustehenden Kontingente für BPA-Maßnahmen.
- **Zugang zu BPA-Fahrten**: Verlinkung oder direkter Zugriff auf die Verwaltung von BPA-Fahrten (siehe `/bpa-fahrten`).
- **Anmeldeformulare**: Ggf. Bereitstellung oder Verlinkung zu Formularen für die Anmeldung zu BPA-finanzierten Fahrten (siehe `/bpa-form`).

## Integrationen

- **Airtable**: Zentrale Datenhaltung für Kontingente, allgemeine BPA-Informationen und Verknüpfungen zu spezifischen Fahrten.
- **BPA-Webseite**: Verlinkung zu relevanten Seiten und Ressourcen auf der offiziellen Webseite des BPA.
- **Interne Dokumentenablage**: Zugriff auf intern gespeicherte Dokumente und Vorlagen zum Thema BPA.

## Offene To-Dos und Implementierungsideen

- Konzeption und Gestaltung des Dashboards mit relevanten KPIs.
- Aufbau einer durchsuchbaren Datenbank für BPA-Richtlinien und -Materialien.
- Implementierung der Kontingentverwaltung.
- Enge Verzahnung mit den spezifischeren BPA-Modulen (`/bpa-fahrten`, `/bpa-form`).
- Klärung, welche spezifischen Formulare unter `/bpa-form/[lastName]` bereitgestellt werden und wie diese mit den hier verwalteten Informationen interagieren. 