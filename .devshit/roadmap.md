## FragDenStaat API anbindung und /IFG page
    # Übersicht gestellte Anfragen

    # Anfragefunktion

## Videos durchsuchen - andere Abgeordnete



## Autogramm-Anfragen als embeddable cards


## Wahlkreisbüro-Finder
    --> Linke-hilft-Angebote
    --> Sprechstunden
    --> Kontakte
        https://www.react-simple-maps.io/
        https://hackernoon.com/how-to-convert-and-prepare-topojson-files-for-interactive-mapping-with-d3-499cf0ced5f
    --> 

## Implementierung Social Media Plattformen
    # BlueSky
    # TikTok
    # Instagram
    # Facebook
        # Posten sollte möglich sein (auch cross-platform)
        # Dahsboard/Statistiken sollten einsehbar sein (auch cross-platform)

## Fraktionsruf
    # Implementierung von SMS-Funktion
    # Implementierung von Mail-Funktion
    # Implementierung von WebApp-Reminder-Funktion

## Kontaktdatenbanken

    # Referentenpool

    # Journalistendatenbank

    # Karl-Liebknecht-Haus

    # Verbände & Lobbykontakte


## Kommunikationslinien

    Bitte erstelle zwei Seiten:
        /kommunikationslinien (unter Kommunikation)
        /agendasetting (unter Fraktionsvorstand) (wie alle Seiten in der Fraktionsvorstand Kategorie, bitte nur für User mit IsFraktionsvorstand = TRUE anzeigen)
        --> diese sollten im Tandem funktionieren:

        - Agendasetting
        Hier können Mitglieder des Fraktionsvorstandes Themen plus Argumentationshilfen setzen, die kommuniziert werden sollen, sogenannte Kommunikationslinien. Diese werden dann für den vordefinierten Zeitraum prominent unter /kommunikationslinien allen Abgeordneten angezeigt. Wir wollen eine Uploadfunktion für PDFs einbauen, die als Anhänge angezeigt werden. 

        Hierbei wollen wir folgende Felder setzen:
        
        Card 1
        Hauptthema: Single Line Text
        Beschreibung: MultiLine Text

        Argument 1 | Argument 2 | Argument 3
        --> alle 3 als MultiLineText

        Zahl der Woche: Single Line text
        Beschreibung: Multiline Text

        Zuständiges MdB
        (für Rückfragen) --> user select field (role: mdb)

        Further reading (Hier sollten Links hineinkopiert werden können)
        Anhänge: Hier werden PDFs hochgeladen

        --> in allen Beschreibungsfeldern wollen wir die Möglichkeit haben, 
        1. Bilder hochzuladen
        2. Code-Blöcke einzufügen, um zB. iFrames von Datawrapper zu embedden

        - Kommunikationslinien
        Hier werden die aktuellen Kommunikationslinien Themen aus /agendasetting angezeigt. 
        Wir wollen außerdem eine Suchfunktion für vergangene Kommunikationslinien einbauen.

        wir wollen in einem schönen Grid Hauptthema in einer Spalte, Zahl der Woche in einer Spalte & Further Reading+Anhänge in einer Spalte. Unter Further reading bitte eine Card, die das Profilbild von Zuständiges MdB zeigt (links), daneben den Namen und unter dem Namen die eMail Adresse (als Mailto) und Büro-Telefonnummer.

        Darunter einen Button, der uns die Möglichkeit gibt, die aktuellen Linien als PDF herunterzuladen.

        Und ein kleines Grid der letzten Linien + Pagination.


        Bevor du anfängst, die Seiten zu erstellen, schlage eine adäquate Datenbankstruktur vor. Wenn ich einwillige, lege sie an und erstelle danach die Seiten (plus funktion.md files).

## Bürgerpostbeantworter



## Räume buchen
    Eine Hälfte: BT-Verwaltung
    Eine Hälfte: Fraktionsräume


## Redaktionsplan-Funktionalität (Kalender?)



## Unteraccounts
    - für MdB-MA?
    - für die Verwaltung?


## Anfragenplanung
    - Gleiche Funktionalität wie Videoplanung
    - Counter für SEFs der mit /schriftliche-fragen geshared werden kann

## Feinddossier
    - MD to PDF cleanup, lines overlap, still no sources at end of document
    - Save generated document


## Besucheranmeldung



## Implementierung Outlook-Calendar

## Implementierung Outlook-Mails


## Presseerklärungen versenden

## Presseverteiler anlegen (Thematisch)
    - Überschrift und Text angeben
    - vorher Testmail an $self
    - 