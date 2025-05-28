## Data (tblNHsQ4fq68oXD62)

| Field Name            | Field ID           | Type              |
|----------------------|-------------------|-------------------|
| ID                   | fldGHTu892q2HmXil | autoNumber        |
| Auswertung Einzelland| fldrKFnQMoPhPL7we | multipleAttachment|
| Buregtable           | fldaQYBOaMulNs7bK | multipleAttachment|
| Drucksache           | fld5bDGZnTlaINvLu | text              |
| Weitere MdB          | fldQFVCbTISBeOooP | text              |
| Users                | fld3MCQ8VlX7D7DZ7 | foreignKey        |
| Name (from Users)    | fldkiu9pJ6yuIqoqQ | lookup            |
| Created              | fldviOpgYgtkx1xGf | formula           |
| Thema                | fldMwXTTlKfh6R0vk | text              |
| Sent                 | flds6iNQs4oHF0lu0 | text              |

## Users (tblmRrA9DEFEuuYi1)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| UserID              | fldkoW4SDfO07oggz | autoNumber        |
| Name                | fldn4FHkZ4olSJPaB | text              |
| Profile Picture     | fldc0vsO5LAjEtTF5 | multipleAttachment|
| Wahlkreis           | fldFJKZ7JTaH2vS10 | text              |
| PLZ                 | fldhCzlBBtFZd6qea | text              |
| Heimatbahnhof       | fldp90g8q5YtwHYlx | text              |
| Landesverband       | fldjoGWQ8zePkVy8g | select            |
| Email               | fldKbCoBcUtKNV2oV | text              |
| Password            | fldpyLloKzydtaWEc | text              |
| Active              | fldp4Qp9cZl805L71 | checkbox          |
| Magic link          | fldazkEfAkENUynCw | text              |
| Role                | fld0bFiLCUjUDlIRq | select            |
| IsFraktionsvorstand | fldTkNfCk2uQo0uA5 | checkbox          |
| Geschlecht          | fld0123456789ABCD | select            |
| Tel Büroleitung     | fldCHiZ1FOe6lIAUj | phoneNumber       |
| Ausschuss 1         | fldJdSlVYZ4fZxxIh | text              |
| Ausschuss 2         | fldVWIo8WWq4iLZ3u | text              |
| Ausschuss 3         | fldkt1gor0PrbBUak | text              |
| Rolle Ausschuss 1   | fldJ3lYUcn941CKRR | multipleSelect    |
| Rolle Ausschuss 2   | fldH8nyh2YDW6IrAO | multipleSelect    |
| Rolle Ausschuss 3   | fldrEHoMZdfC2lB57 | multipleSelect    |
| Data                | fldF7liDq05X8jXKq | foreignKey        |
| Generierte Dokumente| fldVECnQ4WvYh7NGK | foreignKey        |
| Count (Generierte Dokumente) | fldAHzngElJwo1b4f | count         |
| Tweet-Generator     | fldhoW5aVGEW1iVZh | foreignKey        |
| KA-Generator        | fldF3hB2Jxy1Y3h4i | foreignKey        |
| KA-Generator 2      | fldQfRIYPdgXNKAk3 | text              |
| Bürgerbriefe        | fld3b3GRM8SAK8DzC | foreignKey        |
| Sprecherposten      | fldMeJWY0lG6z7qRo | foreignKey        |
| Sprecherposten Combined | fldCI1deopceTcHxf | lookup         |
| Parlament           | fldHhI3CqyetLw17g | text              |
| Stilanalyse         | fldzFkF4sbl6c6z5x | foreignKey        |
| PM-Generator        | fldBvjQcI5S6aA899 | text              |
| Skriptgenerator     | fldJhdQsY5k2nb9Rr | foreignKey        |
| PM-Generator 2      | fldnnEezOeMkyo7QC | foreignKey        |
| Bugs                | fldJGFcRnEZmv1ZYN | foreignKey        |

## User-Preferences (tblVzV5cyPa60sJNf)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| ID                  | fldBrQ8aqbTbZF6bS | autoNumber        |
| Name                | fldeVDfe0gUyFnH0l | foreignKey        |
| UserID (from Name)  | fldtlFfK9ihD4FA9t | lookup            |
| Name (from Name)    | fldJHPYvDe2qIjeo2 | lookup            |
| Email (from Name)   | fldpCfO6RUUCbStBU | lookup            |
| Widget Order        | fldeK5BNlLlB9n6gq | multilineText     |
| Active Widgets      | fldjyRe67IlOFercN | multilineText     |
| Theme Preference    | fldaKvqawmIhpo1ew | select            |
| Last Update         | fld9hDhwYbK2PdbrV | date              |

## Statistiken (tblsDN92Tq2azaRdP)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Name                | fldCxckdncUNE5T4f  | text              |
| Notes               | fld516rdNawX4Mech  | multilineText     |
| Assignee            | fldsJHHaVdUqvAuR0  | collaborator      |
| Status              | fld52is4LCzX0aa9o  | select            |

## Sprecherposten (tbl5V2SrfX7PrNORm)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Name                | fldYEjQ4K5bhM9mXq  | text              |
| Sprecherrolle       | fldp9RdipTNiAAfa8  | multilineText     |
| Name (from Zugeordneter MdB) | fldEQpDlBqVntUcnS | lookup      |
| Zugeordneter MdB    | fldRC4TGLZJ0GK8gi  | foreignKey        |

## Skriptgenerator (tblU2smPZxA7RhCx2)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Autonumber          | fldCysFv5fk37ZPaB  | autoNumber        |
| Thema               | fldsa3Kwi8EhDgWcM  | text              |
| Kontext             | fldvsnjk8dAq4IwvJ  | multilineText     |
| Preproduction       | fld6WciLS1CPlqdhh  | multilineText     |
| Production          | fldNPaZYtOflHLCBi  | multilineText     |
| Postproduction      | fldWXiVGjdNo3cb4H  | multilineText     |
| Select              | fldOVURVTpp8NtpVL  | select            |

## Bugs (tblTBuL9MSUCNR6Eb)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Autonumber          | fldtOtF73jcCKkYNE  | autoNumber        |
| Bug Report          | fldea1TtvsMRSj23z  | multilineText     |
| Machine             | fldgFI2sibana7LnJ  | text              |
| Browser             | fldR25bgi8xNHfUAP  | text              |
| Status              | fldRwucQy2DG5knoz  | select            |
| Users               | fldx5yS9oON9O6Ziu  | foreignKey        |
| UserID (from Users) | fldILDZTC9DGKPtEu  | lookup            |
| Name (from Users)   | fldGqMTKDBpU9Egsl  | lookup            |

## Stilanalyse (tbl9BUepkI70sbVj4)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Name                | fldzM8k2P0N4TS0zt  | autoNumber        |
| Users               | flduUIL9MzlNRCwom  | foreignKey        |
| UserID (from Users) | flderrkuflWR2poOY  | lookup            |
| Content             | fldnCXLTYwYtNvGcv  | select            |
| Notes               | fldsbU0K8uOl4qqBq  | multilineText     |
| Optionen Step 2     | fldUgzeYCHLVEO0l8  | select            |

## PM-Generator (tblhKIw30IWdFmyHj)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Autonumber          | fldxcL0I5Akc5EaHm  | autoNumber        |
| PM-Inhalt           | fldJIAsznjg8D7oG7  | multilineText     |
| Hintergrundinfos    | fldZciaGXKgIu1EFj  | text (url)        |
| PM-Response         | fld5FuJQc3ZfmM0GF  | multilineText     |
| PM-Titel            | fldhwX2lv2OnmbFib  | text              |
| Status              | fldHa9R3JMborGHdT  | select            |
| Erstellt            | fldyDnaefui13wEXR  | formula           |
| Picture-Records     | fldwrtlb1yB34jsNA  | foreignKey        |
| Status (from Picture-Records) | fldqNITmYvekmPaRZ | lookup      |
| Users               | fld3xmkVUX3LZ57Ta  | foreignKey        |

## KA-Generator (tblKZYvm5n5QNXeBI)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| KA-ID               | fldoDq3UBs35vOZWI  | autoNumber        |
| Titel               | fldBiRvWjto2Q6uha  | text              |
| Prompt              | fld9lewSJhxZkC3e9  | multilineText     |
| Result final        | fldm5pOQpuskyXNKl  | multilineText     |
| Beteiligte MdB      | fldnlyRRaaNQyC7QI  | text              |
| Rubrum              | fldpjkD1neSDlpli3  | text              |
| Signatur            | fldRqob86hO27Wxwk  | multilineText     |
| Hintergrundinfos    | fldsmFjxHqVqWtOHE  | text (url)        |
| Politikfeld         | fldMjesdNrT9vijAa  | text              |
| Vorblatt_Heading    | fldDcjS0PemICKKD4  | text              |
| Vorblatt            | fldCSIDpbGyZmhI8j  | multilineText     |
| Politische Zielsetzung | fldIHh7y0QGbScXux | multilineText   |
| Öffentliche Botschaft | fldPHOF1FZjMD0sLE | multilineText    |
| Maßnahmen           | fldt3NkmrNSouTgCU  | multilineText     |
| Vorbemerkung        | fld1lg7ypkOXTMmHh  | multilineText     |
| Fragenteil          | fldeM9cHokimztWfq  | multilineText     |
| Created             | fldPc1odMVQBnw9Yr  | formula           |
| User-ID             | fldikdDuVq5OjjH89  | foreignKey        |

## Picture-Records (tbljAqCaOIBjtP3YZ)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Name                | fldtDQatFQjal8QLN  | text              |
| Status              | fldscGy1a9JfbKWpt  | multipleAttachment|
| PM-Generator        | fldBUk9bGcXVjXNw0  | foreignKey        |
| Bürgerbriefe        | fld2AF6W345lsl7qe  | foreignKey        |
| Skriptgenerator     | fld0VgYg8KlBWwuRD  | text              |
| Skriptgenerator 2   | fldgLwLS1cYdorAqk  | foreignKey        |
| Tweet-Generator     | fldBUn9FAIA1P1chp  | foreignKey        |

## Tweet-Generator (tblHl42n0DVColA7f)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Autonumber          | fldssaZBuRtMCyrAk  | autoNumber        |
| Tweetinhalt         | fldgQkcycEequnWzc  | multilineText     |
| Stilart             | fldq2MtvjMgqyF6OE  | select            |
| Erstellt            | fldVNTUk4qtkqhVcE  | formula           |
| Users               | fldftB2mO99LKm68G  | foreignKey        |
| UserID (from Users) | fldSvPemwVszUBB9b  | lookup            |
| Name (from Users)   | fldn2LociRdNcNemw  | lookup            |

## Generiert (tblw782QCxaXeEmsq)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Name                | fldQ7zGzMZ3BrOhMx  | autoNumber        |
| Thema               | fldVBBqXDZwiD2LrF  | text              |
| Users               | fldW1sJ4KZ6DPHXw5  | foreignKey        |
| Name (from Users)   | fld7L5jnlSIr8XJ1T  | lookup            |
| Profile Picture     | fldP8eBcH4GaWZy4P  | text              |
| Profile Picture (from Users 2) | fld9DvDjbsIFJ2ORQ | lookup      |
| AW Bawue            | fldG6tI7zJ5SepUho  | multipleAttachment|
| AW Bayern           | fldja6w35VUtL63eT  | multipleAttachment|
| AW Berlin           | fldBHm9oUExrn0Avr  | multipleAttachment|
| AW Brandenburg      | fldKlZTeie3uQyzMK  | multipleAttachment|
| AW Bremen           | fldAEBRcEdosxjuEC  | multipleAttachment|
| AW Hamburg          | fldFfIldRqj0XdtzZ  | multipleAttachment|
| AW Hessen           | fldOhgS82oYXdB5hD  | multipleAttachment|
| AW MV               | fldxtCuRsFyd735jU  | multipleAttachment|

## Feinddossier (tblEnUsrZekSFiOUx)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Name                | fldSyg0UonTZ02G08  | autoNumber        |
| Notes               | fldEuC8DXovmJHkPa  | multilineText     |
| User-ID             | fldKC3zwRAgLUaWjv  | collaborator      |
| Gegner              | fldzzro62bWdYNPbA  | text              |
| Attachments         | fldTBQN0hQi2NO5aK  | multipleAttachment|
| Date                | fldhzIEIMtrdXs0fz  | date              |

## Touranfragen_Links (tbll0t9kKKVETKdEf)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| ID                  | fldeQP7iFNuCRj8Ag  | autoNumber        |
| UserID              | fldfrSragMq11rvIK  | foreignKey        |
| UserID (from UserID)| fldqekKuSY7yNKKjm  | lookup            |
| Name (from UserID)  | fldQw2LVGWy55Vx0f  | lookup            |
| Token               | fldhDLsm7Almp93rG  | text              |
| Created             | fldPzZDOU6oYOyyy2  | date              |
| Active              | fldYlGa9IvadIq4fa  | checkbox          |
| Usage Count         | fldJCCENTDGpIx9E3  | number            |

## Touranfragen (tblinZK7BIS1mcVEY)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| ID                  | fldvCfh11crOQlAlK  | autoNumber        |
| UserID              | fld8uUcxvNXhDK7LH  | foreignKey        |
| Name (from UserID)  | fld8fubtqrbDfZ0wQ  | lookup            |
| UserID (from UserID)| flduGoQoVorVQT31z  | lookup            |
| Created             | fldWrdBxZaji8kolJ  | date              |
| Kreisverband        | fld8NImGR6qwjBhAk  | text              |
| Landesverband       | fldiZn3zPwVkmWWY4  | select            |
| Kandidat Name       | fld0IS6U6m43olPfi  | text              |
| Zeitraum Von        | fld2zy6eMwGTQ7HH1  | date              |
| Zeitraum Bis        | fldlEKjvIarwHi2pv  | date              |
| Zeitraum Alle       | fldl2gXZmtHgUcEBL  | multilineText     |
| Themen              | fldnOaf9I682TU25B  | multilineText     |
| Video               | fldgTYsteEfqMJHsq  | checkbox          |
| Ansprechpartner 1 Name | fld5p4hepIrQZ7CHj | text            |
| Ansprechpartner 2 Name | fldie0gsNnkswywAZ | text            |
| Ansprechpartner 1 Phone | fldFI0WMTeivA8DpL | phoneNumber     |
| Ansprechpartner 2 Phone copy | fld94M1AyKOF3JMWz | phoneNumber  |
| Programmvorschlag   | fldRXXQQRKG1smGSe  | checkbox          |
| Status              | fldyhLlNNth3FeHYK  | select            |
| Token Used          | fldCzYmjZyZ7TXqJy  | text              |

## TaskManager (tblEMB2W3pf8cNwje)

| Field Name           | Field ID           | Type              |
|---------------------|-------------------|-------------------|
| Task-ID             | fldy8obVawyjCBKoB  | autoNumber        |
| Name                | fldDYccEsBdMmNlXq  | text              |
| Detailview          | fldEdYT8XIt8mU1gU  | multilineText     |
| IsSubtask           | fldt08fbbWXuGwfnm  | foreignKey        |
| ParentTaskID        | fldETvcRu8TRjn6cp  | lookup            |
| Fälligkeitsdatum    | fldkf3xLee04ZH70V  | date              |
| NextJob             | fldOesgUzwRwFkWkR  | select            |
| Priority            | fldrc9mhALCs3yvob  | select            |
| PublishDate         | fldKHcSkUnu6t76Ez  | date              |
| SortOrder           | fldedV7iTeOSWtgU4  | number            |
| UserID              | fldKB5HNJAal59uQd  | foreignKey        |
| UserID (from UserID)| fldirhqhpcbGphbdD  | lookup            |
| CreatedDate         | fldgjJE30BLbDrojS  | date              |
| ModifiedDate        | fldTZGAGPQwdXcMrt  | date              |
| From field: IsSubtask | fldKtWzT0fRi94p3S | foreignKey       |

## BPA_Formular (tblk78Ya1EpEMUpxW)

| Field Name           | Field ID           | Type                   |
|----------------------|--------------------|------------------------|
| ID                   | fldxmov4r8Yrg34eI  | autoNumber             |
| UserID               | fldae3qAVJuU3sBEF  | foreignKey             |
| FahrtID_ForeignKey   | fldA0WyW6TwjVDqGV  | foreignKey             |
| FahrtID (from FahrtID_Foreignkey) | fldM694KJ19tDCnLl | lookup            |
| Name (from UserID)   | fldaZDpwQnIgFHupO  | lookup                 |
| UserID (from UserID) | fldwqx4rlkYygBxUx  | lookup                 |
| Created              | fldYbmPAp6QVy2SeH  | date                   |
| Anschrift            | fldaxRAJh2X9JjLti  | text                   |
| Postleitzahl         | fldkJwhCfssXMEqR2  | number                 |
| Geburtsdatum         | fldtvFU1d4qjBAtd4  | date                   |
| Geburtsort           | fldrHVxstGXs1U4N8  | text                   |
| Ort                  | fldUSoYUtZpCmgUeI  | text                   |
| Vorname              | fld2s1kXwiBGO3j8g  | text                   |
| Nachname             | fldgnycvXVJOQ2pSt  | text                   |
| Zeitraum Von         | fld4jHkhcsdwgPbAZ  | date                   |
| Zeitraum Bis         | fldnoTxy86Y970wit  | date                   |
| Zeitraum Alle        | fldnMpb2MpeTkU8uJ  | multilineText          |
| Themen               | fldpyjtc82FFjCwYz  | multilineText          |
| Essenspräferenzen    | fldiD7GwEAM3crblo  | select                 |
| Email                | fld79dvhPEYtpP6Ah  | email                  |
| Telefonnummer        | fldHs9aPjaP80Q7iJ  | phoneNumber            |
| Zustieg              | fldkY9uvdjR5Wg0tX  | select                 |
| Status_Teilnahme     | fldTH64ThGdES4aLc  | select                 |
| Status               | fldA1UzQdpOG5WbRI  | select                 |
| Teilnahme_5J         | fldEj7AmpuwKjFUCw  | checkbox               |
| Parteimitglied       | fldCP2cnNvk87uiMM  | checkbox               |
| Einzelzimmer         | fldMYpaDorVPUd965  | checkbox               |

## BPA_Fahrten (tblJsAQS7w10LdFDA)

| Field Name        | Field ID                  | Type         |
|-------------------|---------------------------|--------------|
| FahrtID           | fldKxhde00p2pkeWy         | autoNumber   |
| UserID            | fldNHxKrcJ0Hv4x1s         | foreignKey   |
| Name (from UserID)| fldUrE2P2bflgLksn         | lookup       |
| UserID (from UserID)| fldbsPoWGjn66L2sn        | lookup       |
| Fahrt_Datum_von   | fldGlnKXyP0ZXHHnS         | date         |
| Fahrt_Datum_Bis   | fldbLztHtK10egwXi         | date         |
| Zielort           | fldYeSaE6cwbISABo         | text         |
| Hotel_Name        | fldMvXiBSgwFHvlol         | text         |
| Hotel_Adresse     | fldvqyWww479h1puM         | multilineText|
| Kontingent_Max    | fldQCo3STAQq8KQE4         | number       |
| Aktuelle_Anmeldungen | fld6W7sv170nAMrpd       | count        |
| Bestaetigte_Anmeldungen | fldidhgaWtBLX5qcX    | count        |
| Status_Fahrt      | fldZ3rgzzeSQH480j         | select       |
| Anmeldefrist      | fldhF4hfoR6qbueGp         | date         |
| Beschreibung      | fld5hxmjYaP09yIRq         | multilineText|
| Zustiegsorte_Config | fldGB1VWpMkjdMrRc       | multilineText|
| BPA_Formular      | fldiBsdxxtFR8OJkk         | foreignKey   |
| Aktiv             | fldTr7lN3yYikDsaF         | checkbox     |

## FraktionsrufCounter (tblMfoWD86aQnZ9Ll)

| Field Name             | Field ID            | Type                     | Description                                                                 | Example Values                                                              |
|------------------------|---------------------|--------------------------|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| FraktionsrufID         | fldIgWXTXU6ONbCDy   | autoNumber               | Automatically incremented unique counter for each record.                   | 1, 2, 3                                                                     |
| Created                | fld4quiu0bLCc1enY   | date                     | UTC date, e.g. "2014-09-05".                                                | "2014-09-05"                                                                |
| Assignee               | fldxxWcCDEXOUeGUQ   | link to another record   | Array of linked records IDs from the Users table.                           | ["rec8116cdd76088af", "rec245db9343f55e8", "rec4f3bade67ff565"]           |
| UserID (from Assignee) | fldju5zwoJ3hinFbv   | lookup                   | Array of UserID fields in linked Users records.                             | To see example values, try adding some data to FraktionsrufCounter.         |
| Month                  | fldLS863jcYhdjtuk   | number                   | An integer (whole number, e.g. 1, 32, 99). This field only allows positive numbers. | 42                                                                          |
| Year                   | fldiDGx4ZsIPcAauV   | number                   | An integer (whole number, e.g. 1, 32, 99). This field only allows positive numbers. | 42                                                                          |
| Count                  | fld3oujENuuPtzMB1   | count                    | Number of linked Users records.                                             |                                                                             |

## Field Options Documentation

### Users Table Select Field Options

#### Geschlecht (fld0123456789ABCD)
**Type:** Single Select  
**Options:**
- M
- W
- D

#### Rolle Ausschuss 1 (fldJ3lYUcn941CKRR)
**Type:** Multiple Select  
**Options:**
- Mitglied
- Stellv. Mitglied
- Vorsitz
- Obmann/Obfrau

#### Rolle Ausschuss 2 (fldH8nyh2YDW6IrAO)
**Type:** Multiple Select  
**Options:**
- Mitglied
- Stellv. Mitglied
- Vorsitz
- Obmann/Obfrau

#### Rolle Ausschuss 3 (fldrEHoMZdfC2lB57)
**Type:** Multiple Select  
**Options:**
- Mitglied
- Stellv. Mitglied
- Vorsitz
- Obmann/Obfrau

#### Tel Büroleitung (fldCHiZ1FOe6lIAUj)
**Type:** Phone Number  
**Format:** International phone number format (e.g., "(415) 555-9876")

**Note:** When creating or updating records with select fields, if the choice string does not exactly match an existing option, the request will fail with an INVALID_MULTIPLE_CHOICE_OPTIONS error unless the typecast parameter is enabled. If typecast is enabled, a new choice will be created if one does not exactly match.