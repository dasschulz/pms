# Funktionsweise Skriptgenerator

Diese Seite dient der (teil-)automatisierten Erstellung von Skripten für verschiedene Anwendungsfälle, z.B. Social-Media-Videos, kurze Statements oder Antworten auf Bürgeranfragen.

## Kernfunktionen

- **Vorlagenauswahl**: Auswahl aus verschiedenen Skriptvorlagen, die auf bestimmte Formate oder Themen zugeschnitten sind (z.B. "Kurzes Statement zu X", "Antwort auf Bürgeranfrage Y").
- **Eingabefelder für Kerninformationen**: Der Nutzer gibt Schlüsselinformationen, Kernaussagen oder Zitate ein.
- **Textgenerierung**: Basierend auf den Vorlagen und den Eingaben generiert das System einen ersten Skriptentwurf.
- **Anpassungsoptionen**: Der generierte Entwurf kann manuell überarbeitet und angepasst werden.
- **Längenvorgaben**: Berücksichtigung von typischen Längen für verschiedene Plattformen (z.B. TikTok-Video, Instagram Reel, Twitter-Antwort).
- **Export**: Speichern oder Exportieren des fertigen Skripts.

## Integrationen

- **Supabase**: Speicherung von Vorlagen, generierten Skripten und Nutzereingaben.
- **KI-Textgenerierungsmodelle (optional)**: Anbindung an APIs wie GPT (OpenAI) oder ähnliche Modelle zur Unterstützung der Textgenerierung, ggf. über einen zentralen AI-Service der App.
- **Videoplanung (`/videoplanung`)**: Direkte Übernahme von generierten Skripten in die Videoplanung.
- **Bürgerpost (`/buergerpost`)**: Nutzung für die Erstellung von Antwortentwürfen.

## Offene To-Dos und Implementierungsideen

- Entwicklung einer Vielzahl an nützlichen und flexiblen Skriptvorlagen.
- Implementierung oder Anbindung von KI-Modellen zur intelligenten Textgenerierung.
- Sicherstellung, dass die generierten Texte den politischen und sprachlichen Anforderungen der Fraktion entsprechen (Tone of Voice).
- Funktion zur Analyse und Optimierung der Skriptlänge für verschiedene Kanäle.
- Kollaborative Bearbeitung von Skriptentwürfen.
- Integration mit einer Sprechertext-Optimierung (z.B. Lesbarkeit, Sprechfluss). 