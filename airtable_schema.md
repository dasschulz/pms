Airtable Schema Overview

Table: Data (tblNHsQ4fq68oXD62)

Field Name

Field ID

Type

ID

fldGHTu892q2HmXil

autoNumber

Auswertung Einzelland

fldrKFnQMoPhPL7we

multipleAttachment

Buregtable

fldaQYBOaMulNs7bK

multipleAttachment

Drucksache

fld5bDGZnTlaINvLu

text

Weitere MdB

fldQFVCbTISBeOooP

text

Users

fld3MCQ8VlX7D7DZ7

foreignKey

Name (from Users)

fldkiu9pJ6yuIqoqQ

lookup

Created

fldviOpgYgtkx1xGf

formula

Thema

fldMwXTTlKfh6R0vk

text

Sent

flds6iNQs4oHF0lu0

text

Table: Users (tblmRrA9DEFEuuYi1)

Field Name

Field ID

Type

UserID

fldkoW4SDfO07oggz

autoNumber

Name

fldn4FHkZ4olSJPaB

text

Profile Picture

fldc0vsO5LAjEtTF5

multipleAttachment

Wahlkreis

fldFJKZ7JTaH2vS10

text

PLZ

fldhCzlBBtFZd6qea

text

Landesverband

fldjoGWQ8zePkVy8g

select

Email

fldKbCoBcUtKNV2oV

text

Password

fldpyLloKzydtaWEc

text

Active

fldp4Qp9cZl805L71

checkbox

Magic link

fldazkEfAkENUynCw

text

Role

fld0bFiLCUjUDlIRq

select

Data

fldF7liDq05X8jXKq

foreignKey

Generierte Dokumente

fldVECnQ4WvYh7NGK

foreignKey

Count (Generierte Dokumente)

fldAHzngElJwo1b4f

count

Tweet-Generator

fldhoW5aVGEW1iVZh

foreignKey

KA-Generator

fldF3hB2Jxy1Y3h4i

foreignKey

KA-Generator 2

fldQfRIYPdgXNKAk3

text

Bürgerbriefe

fld3b3GRM8SAK8DzC

foreignKey

Sprecherposten

fldMeJWY0lG6z7qRo

foreignKey

Sprecherposten Combined

fldCI1deopceTcHxf

lookup

Parlament

fldHhI3CqyetLw17g

text

Stilanalyse

fldzFkF4sbl6c6z5x

foreignKey

PM-Generator

fldBvjQcI5S6aA899

text

Skriptgenerator

fldJhdQsY5k2nb9Rr

foreignKey

PM-Generator 2

fldnnEezOeMkyo7QC

foreignKey

Bugs

fldJGFcRnEZmv1ZYN

foreignKey

Table: Statistiken (tblsDN92Tq2azaRdP)

Field Name

Field ID

Type

Name

fldCxckdncUNE5T4f

text

Notes

fld516rdNawX4Mech

multilineText

Assignee

fldsJHHaVdUqvAuR0

collaborator

Status

fld52is4LCzX0aa9o

select

Table: Sprecherposten (tbl5V2SrfX7PrNORm)

Field Name

Field ID

Type

Name

fldYEjQ4K5bhM9mXq

text

Sprecherrolle

fldp9RdipTNiAAfa8

multilineText

Name (from Zugeordneter MdB)

fldEQpDlBqVntUcnS

lookup

Zugeordneter MdB

fldRC4TGLZJ0GK8gi

foreignKey

Table: Skriptgenerator (tblU2smPZxA7RhCx2)

Field Name

Field ID

Type

Autonumber

fldCysFv5fk37ZPaB

autoNumber

Thema

fldsa3Kwi8EhDgWcM

text

Kontext

fldvsnjk8dAq4IwvJ

multilineText

Preproduction

fld6WciLS1CPlqdhh

multilineText

Production

fldNPaZYtOflHLCBi

multilineText

Postproduction

fldWXiVGjdNo3cb4H

multilineText

Select

fldOVURVTpp8NtpVL

select

Table: Bugs (tblTBuL9MSUCNR6Eb)

Field Name

Field ID

Type

Autonumber

fldtOtF73jcCKkYNE

autoNumber

Bug Report

fldea1TtvsMRSj23z

multilineText

Machine

fldgFI2sibana7LnJ

text

Browser

fldR25bgi8xNHfUAP

text

Status

fldRwucQy2DG5knoz

select

Users

fldx5yS9oON9O6Ziu

foreignKey

UserID (from Users)

fldILDZTC9DGKPtEu

lookup

Name (from Users)

fldGqMTKDBpU9Egsl

lookup

Table: Stilanalyse (tbl9BUepkI70sbVj4)

Field Name

Field ID

Type

Name

fldzM8k2P0N4TS0zt

autoNumber

Users

flduUIL9MzlNRCwom

foreignKey

UserID (from Users)

flderrkuflWR2poOY

lookup

Content

fldnCXLTYwYtNvGcv

select

Notes

fldsbU0K8uOl4qqBq

multilineText

Optionen Step 2

fldUgzeYCHLVEO0l8

select

Table: PM-Generator (tblhKIw30IWdFmyHj)

Field Name

Field ID

Type

Autonumber

fldxcL0I5Akc5EaHm

autoNumber

PM-Inhalt

fldJIAsznjg8D7oG7

multilineText

Hintergrundinfos

fldZciaGXKgIu1EFj

text (url)

PM-Response

fld5FuJQc3ZfmM0GF

multilineText

PM-Titel

fldhwX2lv2OnmbFib

text

Status

fldHa9R3JMborGHdT

select

Erstellt

fldyDnaefui13wEXR

formula

Picture-Records

fldwrtlb1yB34jsNA

foreignKey

Status (from Picture-Records)

fldqNITmYvekmPaRZ

lookup

Users

fld3xmkVUX3LZ57Ta

foreignKey

Table: KA-Generator (tblKZYvm5n5QNXeBI)

Field Name

Field ID

Type

KA-ID

fldoDq3UBs35vOZWI

autoNumber

Titel

fldBiRvWjto2Q6uha

text

Prompt

fld9lewSJhxZkC3e9

multilineText

Result final

fldm5pOQpuskyXNKl

multilineText

Beteiligte MdB

fldnlyRRaaNQyC7QI

text

Rubrum

fldpjkD1neSDlpli3

text

Signatur

fldRqob86hO27Wxwk

multilineText

Hintergrundinfos

fldsmFjxHqVqWtOHE

text (url)

Politikfeld

fldMjesdNrT9vijAa

text

Vorblatt_Heading

fldDcjS0PemICKKD4

text

Vorblatt

fldCSIDpbGyZmhI8j

multilineText

Politische Zielsetzung

fldIHh7y0QGbScXux

multilineText

Öffentliche Botschaft

fldPHOF1FZjMD0sLE

multilineText

Maßnahmen

fldt3NkmrNSouTgCU

multilineText

Vorbemerkung

fld1lg7ypkOXTMmHh

multilineText

Fragenteil

fldeM9cHokimztWfq

multilineText

Created

fldPc1odMVQBnw9Yr

formula

User-ID

fldikdDuVq5OjjH89

foreignKey

Table: Picture-Records (tbljAqCaOIBjtP3YZ)

Field Name

Field ID

Type

Name

fldtDQatFQjal8QLN

text

Status

fldscGy1a9JfbKWpt

multipleAttachment

PM-Generator

fldBUk9bGcXVjXNw0

foreignKey

Bürgerbriefe

fld2AF6W345lsl7qe

foreignKey

Skriptgenerator

fld0VgYg8KlBWwuRD

text

Skriptgenerator 2

fldgLwLS1cYdorAqk

foreignKey

Tweet-Generator

fldBUn9FAIA1P1chp

foreignKey

Table: Tweet-Generator (tblHl42n0DVColA7f)

Field Name

Field ID

Type

Autonumber

fldssaZBuRtMCyrAk

autoNumber

Tweetinhalt

fldgQkcycEequnWzc

multilineText

Stilart

fldq2MtvjMgqyF6OE

select

Erstellt

fldVNTUk4qtkqhVcE

formula

Users

fldftB2mO99LKm68G

foreignKey

UserID (from Users)

fldSvPemwVszUBB9b

lookup

Name (from Users)

fldn2LociRdNcNemw

lookup

Table: Generiert (tblw782QCxaXeEmsq)

Field Name

Field ID

Type

Name

fldQ7zGzMZ3BrOhMx

autoNumber

Thema

fldVBBqXDZwiD2LrF

text

Users

fldW1sJ4KZ6DPHXw5

foreignKey

Name (from Users)

fld7L5jnlSIr8XJ1T

lookup

Profile Picture

fldP8eBcH4GaWZy4P

text

Profile Picture (from Users 2)

fld9DvDjbsIFJ2ORQ

lookup

AW Bawue

fldG6tI7zJ5SepUho

multipleAttachment

AW Bayern

fldja6w35VUtL63eT

multipleAttachment

AW Berlin

fldBHm9oUExrn0Avr

multipleAttachment

AW Brandenburg

fldKlZTeie3uQyzMK

multipleAttachment

AW Bremen

fldAEBRcEdosxjuEC

multipleAttachment

AW Hamburg

fldFfIldRqj0XdtzZ

multipleAttachment

AW Hessen

fldOhgS82oYXdB5hD

multipleAttachment

AW MV

fldxtCuRsFyd735jU

multipleAttachment

Table: Feinddossier (tblEnUsrZekSFiOUx)

Field Name                Field ID                Type

Name                      fldSyg0UonTZ02G08       autoNumber

Notes                     fldEuC8DXovmJHkPa       multilineText

User-ID                   fldKC3zwRAgLUaWjv       collaborator

Gegner                    fldzzro62bWdYNPbA       text

Attachments               fldTBQN0hQi2NO5aK       multipleAttachment

Date                      fldhzIEIMtrdXs0fz       date

Table: Touranfragen_Links (tbll0t9kKKVETKdEf)

Field Name

Field ID

Type

ID

fldeQP7iFNuCRj8Ag

autoNumber

UserID

fldfrSragMq11rvIK

foreignKey

UserID (from UserID)

fldqekKuSY7yNKKjm

lookup

Name (from UserID)

fldQw2LVGWy55Vx0f

lookup

Token

fldhDLsm7Almp93rG

text

Created

fldPzZDOU6oYOyyy2

date

Active

fldYlGa9IvadIq4fa

checkbox

Usage Count

fldJCCENTDGpIx9E3

number

Table: Touranfragen (tblinZK7BIS1mcVEY)

Field Name

Field ID

Type

ID

fldvCfh11crOQlAlK

autoNumber

UserID

fld8uUcxvNXhDK7LH

foreignKey

Name (from UserID)

fld8fubtqrbDfZ0wQ

lookup

UserID (from UserID)

flduGoQoVorVQT31z

lookup

Created

fldWrdBxZaji8kolJ

date

Kreisverband

fld8NImGR6qwjBhAk

text

Landesverband

fldiZn3zPwVkmWWY4

select

Kandidat Name

fld0IS6U6m43olPfi

text

Zeitraum Von

fld2zy6eMwGTQ7HH1

date

Zeitraum Bis

fldlEKjvIarwHi2pv

date

Zeitraum Alle

fldl2gXZmtHgUcEBL

multilineText

Themen

fldnOaf9I682TU25B

multilineText

Video

fldgTYsteEfqMJHsq

checkbox

Ansprechpartner 1 Name

fld5p4hepIrQZ7CHj

text

Ansprechpartner 2 Name

fldie0gsNnkswywAZ

text

Ansprechpartner 1 Phone

fldFI0WMTeivA8DpL

phoneNumber

Ansprechpartner 2 Phone copy

fld94M1AyKOF3JMWz

phoneNumber

Programmvorschlag

fldRXXQQRKG1smGSe

checkbox

Status

fldyhLlNNth3FeHYK

select

Token Used

fldCzYmjZyZ7TXqJy

text