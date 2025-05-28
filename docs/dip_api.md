## What can we fetch?
Please read: https://dip.bundestag.api.bund.dev/

## Documentation of API

2 Technische Kurzdokumentation
Achtung: Die technische Kurzdokumentation in diesem Dokument dient lediglich dem
grundsätzlichen Verständnis der Funktionsweise der DIP-API. Die führende, fortlaufend
aktualisierte und auch abschließende Dokumentation der API erfolgt ausschließlich elektronisch
über die Swagger- bzw. OpenAPI YAML-Beschreibungen der DIP-API.
2.1 Grundlagen
Die DIP Anwendungsschnittstelle wird als RESTful Web Service auf
https://search.dip.bundestag.de/api/v1 angeboten.
Erlaubt sind lesende HTTP-Anfragen (GET, HEAD, OPTIONS).
Das Antwort-Format ist application/json oder application/xml (steuerbar über den format
Parameter).
Ein gültiger API-Key ist für alle Anfragen erforderlich. Ein API-Key ist ein 42 Zeichen langer Text.
Dieser kann entweder im HTTP Authorization Header oder als Anfrageparameter apikey gesendet
werden.
Beispiel: Authorization Header mit API-Key
Authorization: ApiKey GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp
Beispiel: Anfrageparameter mit API-Key
?apikey= GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp
Hinweis: Der in diesem Dokument aufgeführte API-Key dient nur als Beispiel. Den jeweils aktuell
gültigen API-Key finden Sie unter https://dip.bundestag.de/%C3%BCber-dip/hilfe/api#content.
Ggf. ist dieser also bei den Beispiellinks gegen einen aktuell gültigen API-Key zu ersetzen.
2.2 Aufbau von URLs
Die URLs der verfügbaren Ressourcen folgen der immer gleichen Struktur:
https://search.dip.bundestag.de/api/v1/{ressourcentyp} liefert eine Liste aller Entitäten
eines bestimmen Ressourcentyps.
https://search.dip.bundestag.de/api/v1/{ressourcentyp}/{id} liefert eine per ID
referenzierte Entität eines bestimmten Ressourcentyps.
Ein Beispiel für einen Ressourcentyp ist „vorgang“.
Die Gesamtheit aller möglichen Ressourcentypen, zugehörige Abfrageparameter sowie mögliche
Antworten der API (200, 400 etc.) entnehmen Sie bitte den jeweils aktuellen elektronischen
Dokumentationen (Swagger- bzw. OpenAPI YAML).
Erläuterungen und Hinweise zur API für DIP
(Kurzdokumentation)
Seite 4
2.3 Anfrage von einzelnen Entitäten
Grundlegendes Schema:
GET https://search.dip.bundestag.de/api/v1/{ressourcentyp}/{id}
Beispiel: Anfrage zu Metadaten des ersten BT-Plenarprotokolls der 19. Wahlperiode
https://search.dip.bundestag.de/api/v1/plenarprotokoll/908?apikeyGmEPb1B.bfqJLIhcGAsH9fTJe
vTglhFpCoZyAAAdhp
Antwort (gekürzt):
{
 "id":"908",
 "typ":"Dokument",
 "dokumentart":"Plenarprotokoll",
 "titel":"Protokoll der 1. Sitzung des 19. Deutschen Bundestages",
 "dokumentnummer":"19/1",
 "wahlperiode":19,
 "herausgeber":"BT",
 "datum":"2017-10-24",
 "fundstelle":{
 "pdf_url":"https://dserver.bundestag.de/btp/19/19001.pdf",
 "dokumentnummer":"19/1",
 "datum":"2017-10-24",
 "verteildatum":"2017-10-25"
 },
 "vorgangsbezug":[
 {
 "id":"84393",
 "titel":"Eröffnung der 1. Sitzung des 19. Deutschen Bundestages",
 "vorgangstyp":"Ansprache/Erklärung/Mitteilung"
 },
 {
 "id":"84352",
 "titel":"Grundsatz der Diskontinuität in der konstituierenden Sitzung des 19.
Deutschen Bundestages",
 "vorgangstyp":"Geschäftsordnung"
 },
 {
 "id":"84396",
 "titel":"Wahl der Stellvertreterinnen und Stellvertreter des Präsidenten",
 "vorgangstyp":"Wahl im BT"
 }
 ]
}
Anmerkung: Referenzen zu anderen Entitäten (hier das Feld vorgangsbezug) werden i.d.R. nur als
Vorschau zur inhaltlichen Einordnung ausgegeben. Die Liste der referenzierten Entitäten muss
nicht vollständig sein. Um eine vollständige Liste zu erhalten, sollte eine zusätzliche Anfrage
ausgeführt werden (siehe folgender Abschnitt).
In diesem Beispiel:
https://search.dip.bundestag.de/api/v1/vorgang?f.plenarprotokoll=908&apikey=GmEPb1B.bfqJLI
hcGAsH9fTJevTglhFpCoZyAAAdhp
Erläuterungen und Hinweise zur API für DIP
(Kurzdokumentation)
Seite 5
2.4 Anfrage von mehreren Entitäten
Grundlegendes Schema:
GET https://search.dip.bundestag.de/api/v1/{ressourcentyp}, ergänzt um die jeweiligen
verfügbaren Abfrageparameter zum jeweiligen Ressourcentyp.
Beispiel: Anfrage aller BT-Plenarprotokolle seit dem 01.01.2021
https://search.dip.bundestag.de/api/v1/plenarprotokoll?f.zuordnung=BT&f.datum.start=2021-01-
01&apikey=GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp
Pro Anfrage werden maximal 100 Entitäten ausgegeben. Die Volltext-Ressourcentypen sind in der
Regel auf maximal 10 Entitäten begrenzt. In jedem Falle können weitere Entitäten, sofern
verfügbar, immer mittels des cursor-Parameters geladen werden.
Die Sortierung der Entitäten erfolgt stets absteigend nach Datum und ID.
{
 "numFound": 17,
 "documents": [
 {
 "id": "5402",
 "titel": "Protokoll der 219. Sitzung des 19. Deutschen Bundestages",
 "dokumentart": "Plenarprotokoll",
 "typ": "Dokument",
 "dokumentnummer": "19/219",
 "wahlperiode": 19,
 "herausgeber": "BT",
 "datum": "2021-03-26",
 "fundstelle": {
 "pdf_url": "https://dserver.bundestag.de/btp/19/19219.pdf",
 "dokumentnummer": "19/219",
 "datum": "2021-03-26"
 }
 },
 ...
 {
 "id": "5383",
 "dokumentart": "Plenarprotokoll",
 "titel": "Protokoll der 203. Sitzung des 19. Deutschen Bundestages",
 "typ": "Dokument",
 "dokumentnummer": "19/203",
 "wahlperiode": 19,
 "herausgeber": "BT",
 "datum": "2021-01-13",
 "fundstelle": {
 "pdf_url": "https://dserver.bundestag.de/btp/19/19203.pdf",
 "dokumentnummer": "19/203",
 "datum": "2021-01-13",
 "verteildatum": "2021-01-14"
 }
 }
 ],
 "cursor": " AoJwgNjC_PYCNFBsZW5hcnByb3Rva29sbC01Mzgz"
}
Erläuterungen und Hinweise zur API für DIP
(Kurzdokumentation)
Seite 6
2.5 Folgeanfragen nach weiteren Entitäten
Übersteigt die Anzahl der gefundenen Entitäten das jeweilige Limit, muss eine Folgeanfrage
gestellt werden, um weitere Entitäten zu laden.
Eine Folgeanfrage wird gebildet, indem alle Parameter der ursprünglichen Anfrage wiederholt
werden und zusätzlich der cursor Parameter der letzten Antwort eingesetzt wird.
Es können solange Folgeanfragen gestellt werden, bis sich der cursor nicht mehr ändert. Dies
signalisiert, dass alle Entitäten geladen wurden.
Beispiel: Laden aller BT-Drucksachen der 1. Sitzungswoche 2021
Anfrage:
https://search.dip.bundestag.de/api/v1/drucksache?f.zuordnung=BT&f.datum.start=2021-01-
11&f.datum.end=2021-01-15&apikey=GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp
Antwort (gekürzt):
{
 "numFound": 176,
 "documents": [ ... ],
 "cursor":" AoJwgNjC_PYCMURydWNrc2FjaGUtMjQ5MjYw"
}
2. Anfrage:
https://search.dip.bundestag.de/api/v1/drucksache?f.zuordnung=BT&f.datum.start=2021-01-
11&f.datum.end=2021-01-
15&apikey=GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp&cursor=AoJwgNjC_PYCMURyd
WNrc2FjaGUtMjQ5MjYw
Antwort (gekürzt):
{
 "numFound": 176,
 "documents": [ ... ],
 "cursor":" AoJwgMGv9_YCMURydWNrc2FjaGUtMjQ5MTUz"
}
Erläuterungen und Hinweise zur API für DIP
(Kurzdokumentation)
Seite 7
3. Anfrage:
https://search.dip.bundestag.de/api/v1/drucksache?f.zuordnung=BT&f.datum.start=2021-01-
11&f.datum.end=2021-01-
15&apikey=GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp&cursor=AoJwgMGv9_YCMURy
dWNrc2FjaGUtMjQ5MTUz
Antwort:
2.6 Anfrage kürzlich aktualisierter Entitäten
Der Zeitpunkt der letzten Aktualisierung einer Entität wird im Feld aktualisiert ausgegeben.
Eine Entität gilt als aktualisiert, wenn entweder diese selbst oder eine direkt verknüpfte Entität
geändert wurde. So führen beispielsweise Änderungen an einer Vorgangsposition auch zur
Aktualisierung des zugehörigen Vorgangs. Eine Aktualisierung bedeutet jedoch nicht unbedingt,
dass sich die Felder einer Entität tatsächlich geändert haben.
Mittels des Anfrageparameters f.aktualisiert.start können Entitäten selektiert werden, die seit
dem angegebenen Datum aktualisiert wurden.
Beispiel: Alle Vorgänge, die seit dem 24.06.2022, 9:00 Uhr aktualisiert wurden
https://search.dip.bundestag.de/api/v1/vorgang?f.aktualisiert.start=2022-06-
24T09:00:00&apikey=GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp
Sollen die Aktualisierungen der DIP-Datenbank regelmäßig angefragt werden, ist zu beachten, dass
es einen Zeitversatz von ca. 15 Minuten gibt, bis eine Änderung in der API sichtbar ist. Um keine
Aktualisierungen zu verpassen, sollten sich die angefragten Intervalle entsprechend überlappen.
Beispiel: Stündliche Anfrage von aktualisierten Vorgängen mit zeitlicher Überlappung
• 10:00 Uhr: https://search.dip.bundestag.de/api/v1/vorgang?f.aktualisiert.start=2022-06-
24T09:45:00&apikey=GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp
• 11:00 Uhr: https://search.dip.bundestag.de/api/v1/vorgang?f.aktualisiert.start=2022-06-
24T10:45:00&apikey=GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp
• 12:00 Uhr: https://search.dip.bundestag.de/api/v1/vorgang?f.aktualisiert.start=2022-06-
24T11:45:00&apikey=GmEPb1B.bfqJLIhcGAsH9fTJevTglhFpCoZyAAAdhp


Die Informationen des Dokumentations- und Informationssystems für Parlamentsmaterialien (DIP) können neben der Rechercheoberfläche auch über eine API abgefragt werden. Die API bietet ausschließlich einen lesenden Zugriff auf die DIP-Inhalte. Abgefragt werden können Vorgänge und Vorgangspositionen, Aktivitäten, Personen sowie Drucksachen und Plenarprotokolle nebst zugehöriger Metadaten.

Zur Nutzung ist ein API-Key notwendig. Der zunächst bis Ende Mai 2026 gültige API-Key lautet:
OSOegLs.PR2lwJ1dwCeje9vTj7FPOt3hvpYKtwKkhw

