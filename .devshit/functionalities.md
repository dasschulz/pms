1. Kleine Anfragen generieren

1.1 When input is sent, create Supabase records in table "kleine_anfragen":
Titel (input from user)
Beteiligte MdB (input from user)
Signatur ("Berlin, den $date <br> Heidi Reichinnek, Sören Pellmann und Fraktion")
Vorblatt_Heading ("Vorblatt zur internen Verwendung")
Hintergrundinfos (Input from user)
Prompt (Input from user)
User-ID (User ID)
Created ("DD.MM.YYY")
Picture Records ("KA")

1.2. We then want to message the OpenAI Assistant "KA-Generator" (asst_XEV37rNc1eRJeHZMHjgihpll)
.
User Message is Bitte schreibe eine Anfrage der Fraktion Die Linke im Bundestag.

Das Thema ist {{Titel}}.

Bitte lege in den Fragen einen Schwerpunkt auf {{Prompt}}.
--
It should auto call code interpreter to look into Themen_Fraktion.txt and programm_der_partei_die_linke_erfurt2011.pdf. And it should use File Search for it's vector store KA-Store.

1.3 We then want to call openai, just for a regular completion, cheap agent.
Role Developer System:
Du bist ein LLM, das die Öffentlichkeitsarbeit für ein Abgeordnetenbüro der Linken im Bundestag unterstützt.

Du definierst Maßnahmen zur Öffentlichkeitsarbeit für ein gegebenes Dokument. Maßnahmen können inkludieren: Pressemitteilung, Verarbeitung über Landesverbände der Partei, Kurzvideos, Plakatkampagne, Antrag, Nachricht auf Website der Gruppe.

Bitte nenne in ein bis zwei kurzen Sätzen die politische Zielsetzung des Dokumentes. Dann in einem Satz die öffentliche Botschaft. Und zuletzt definiere die Maßnahmen.

Bitte nutze für deinen gesamten Output nicht mehr als 700 Zeichen.

--

Role User
Bitte definiere die politische Zielsetzung, öffentliche Botschaft und Maßnahmen der Öffentlichkeitsarbeit für folgende Anfrage der LINKEN zu {{Titel}}:

{{result}}.
--
Herein, {{result}} should be the output generated from the call on 1.2.

1.4. we call a regular agent again to parse {{result}}.
Prompt: Deine Aufgabe ist es, eine kleine Anfrage der Fraktion Die Linke im Bundestag auf bestimmte Datenblöcke zu prüfen. 

Bitte extrahiere aus dem gegebenen Text nur die Teile "Vorbemerkung der Fragesteller" und "Fragen".

---

Parameters for output:
Vorbemerkung | Der Teil, in dem erklärt wird, warum diese Anfrage gestellt wird bzw. kontextualisiert wird. | Array (text)
Fragenteil | Der Teil des Textes, in dem in Listenform die an die Bundesregierung formulierten Fragen stehen. | Array (text)


---

2. Generierte Elemente anzeigen

So in order to display the generated KA on the page, we want to create a preview card and a full Kleine Anfrage. All displayed content should be derived from the kleine_anfragen table. A user should only see KAs associated with their User-ID.

The preview card should contain:
The top of the card should contain the image from {{Status (from Picture-Records)}}, on that image a status chip containing {{Politikfeld}}. Below: a heading containing {{Titel}}, and in regular text we want  and a "Zur Anfrage" button. Clicking "Zur Anfrage" should open the Kleine Anfrage in a modal. 

Here, we want to display it like so:
Top right, right aligned, regular text: Berlin, den {{Created}}

after this, all left aligned

subheading: {{Rubrum}} <br>
heading: {{Titel}} <br>

<b>Vorbemerkung der Fragesteller:</b><br>
{{Vorbemerkung}}<br><br>

<b>Wir fragen die Bundesregierung:</b><br>
{{Fragenteil}}<br>

{{Signatur}}

Divider

heading: {{Vorblatt_Heading}}<br><br>
Politische Zielsetzung:<br> {{Politische Zielsetzung}}<br><br>
Öffentliche Botschaft:<br> {{Öffentliche Botschaft}}<br><br>
Maßnahmen:<br> {{Maßnahmen}}<br>



