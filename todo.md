### BPA-Fahrten ###

Bitte lies den nachfolgenden Text sorgsam und gehe dann die Aufgaben Schritt für Schritt durch. Pausiere nach jedem Schritt, um Feedback abzuwarten:

Die User unserer App sind Abgeordnete des Bundestages. Diese können zwei Mal im Jahr Besucherinnen aus dem Wahlkreis nach Berlin einladen, um den Bundestag und Ministerien zu besuchen. Die Kosten trägt das Bundespresseamt (BPA). Wir wollen eine Funktionalität implementieren, über die:

1.
- sich Personen aus dem Wahlkreis für BPA-Fahrten bei ihren Abgeordneten anmelden können (Name, Alter, email, Wohnort, Partei ja/nein)
- auswählen können, an welchem Punkt sie zusteigen
- Welches Essen sie mögen oder welche dietary restrictions sie haben

die Funktion unter 1 sollte ein offen zugängliches Formular sein.

2. im Backend wollen wir Usern (die MdB) die Möglichkeit geben, eigene Formulare einzurichten: wann sind die Zeiten der nächsten Fahrt, wie ist das Kontingent, Anmeldungen auf Cards ansehen und verfolgen, Zu- und Absagen versenden, Cards archivieren und auto updaten usw.


## Aufgabe 1: Erstelle eine Seite "BPA-Fahrten" und füge sie der Sidebar hinzu. Das wird die Seite für das Backend. Hier sollen die User die Möglichkeit haben, Anmeldungen zu sehen und zu bearbeiten, Stati festzulegen etc.

## Aufgabe 2: Erstelle eine Seite, die für nicht angemeldete User sichtbar ist, über die sich die Bürger anmelden können. Wichtig: hierbei muss klar ersichtlich sein, wer der/die Abgeordnete (der erstellende User) ist und der Wahlkreis muss kenntlich gemacht werden. Die Funktionalitäten bzw. erforderlichen Felder kannst du den Namen der Airtable-Felder entnehmen. Ansonsten schau in die Fußnoten.

## Aufgabe 3: Implementiere die entsprechenden Funktionalitäten (API Calls, Anlegen von Fahrten, Verwalten von Fahrten, Anmeldungen ansehen etc.). Schaue hierbei auf die konkrete Airtable-API-Implementierung auf der /touranfragen-Seite, um die Fehler zu beheben, die bei deiner Standardisierten Implementierung sonst immer wieder passieren. Wir haben das mehrfach durchgespielt, lass es uns abkürzen.

## Aufgabe 4: Hübsche das externe Formular für BPA-Fahrt-Anmeldungen auf. Vergleich hier mit Touranfragen-Form. Im Backend, ermögliche eine One-Click-Option, um das Formular als iFrame zu embedden.

## Aufgabe 5: Erstelle eine "Draußenwelt"-Kategorie für die Sidebar. Ordne darunter BPA-Fahrten und Touranfragen ein. Erstelle außerdem eine "Wahlkreisbüros"-Seite. Die bearbeiten wir später, Platzhalter reicht.

### Fußnoten.

Für die Fahrten erhalten die Teilnehmer einen Fahrtkostenzuschuss. 
In Sitzungswochen ist der Besuch einer Plenardebatte, in der sitzungsfreien Zeit ein Vortrag im Plenarsaal über die Aufgaben und Funktionen des Parlaments sowie ein Museums- oder Ministerienbesuch vorgesehen. Wenn terminlich möglich, wird ein Treffen mit mir organisiert.
Die Teilnehmer müssen in der Regel das 18. Lebensjahr vollendet haben. 

Eingeladen werden können deutsche Staatsangehörige und ausländische Teilnehmer aus den EU-Staaten. 

Nach den zurzeit geltenden Bestimmungen muss es sich bei den Teilnehmern um "politisch Interessierte" aus den jeweiligen Wahlkreisen handeln. 

Eine mehrmalige Teilnahme derselben Person innerhalb von 5 Jahren entspricht nicht den Richtlinien des BPA.

Ihre personenbezogenen
Angaben werden
ausschließlich im
Zusammenhang mit den
BPA-Fahrten genutzt. Für die
Sicherheitskontrollen zu
bestimmten Besuchsorten
(Bundestag, Ministerien etc.)
werden Vor- und Nachname
sowie das Geburtsdatum an
die jeweiligen Besucherdienste
übermittelt. Die Polizei beim
Deutschen Bundestag führt
zum Beispiel auf Grundlage
des § 2 Absatz 6c der
Hausordnung des Deutschen
Bundestages eine
Zuverlässigkeitsüberprüfung
insbesondere durch
Einsichtnahme in das
Informationssystem der Polizei
beim Deutschen Bundestag
und in das Informationssystem
der Polizei (INPOL) durch. Ihre
Daten (Vorname, Nachname,
Geburtsdatum) werden nach
Beendigung des Besuches
gelöscht. Das Hotel erhält nur
den Vor- und Nachnamen. Als
Abgeordnetenbüro bewahren
wir Ihre Daten nach erfolgter
Teilnahme lediglich auf, um
erneute Anmeldungen
ausschließen zu können.


Zudem besteht die Möglichkeit zu einem kostenlosen Mittagessen im Besucherrestaurant des Bundestags.