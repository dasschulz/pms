# Supabase Database Schema Documentation

This document describes the complete schema of the MdB-App Supabase database, including all tables, columns, data types, and relationships.

## Overview

The database contains **19 tables** designed to support a comprehensive Member of Parliament (MdB) management application.

---

## Enum Types

The database uses several PostgreSQL enum types for data validation:

### `role_type`
User roles within the system:
- `'MdB'` - Member of Parliament
- `'Landesverband'` - State Association
- `'Partei'` - Party
- `'Verwaltung'` - Administration

### `status_type`
General status values for various processes:
- `'Eingegangen'` - Received
- `'Planung'` - Planning
- `'Anmeldung offen'` - Registration Open
- `'Anmeldung geschlossen'` - Registration Closed
- `'Fahrt läuft'` - Trip Running
- `'Abgeschlossen'` - Completed
- `'Storniert'` - Cancelled

### `priority_type`
Priority levels for tasks and items:
- `'Dringend'` - Urgent
- `'Hoch'` - High
- `'Normal'` - Normal
- `'Niedrig'` - Low
- `'-'` - No Priority

### `essenspraeferenz_type`
Dietary preferences:
- `'Alles'` - Everything
- `'Vegetarisch'` - Vegetarian
- `'Vegan'` - Vegan
- `'Kosher'` - Kosher
- `'Halal'` - Halal

### `zustieg_type`
Boarding locations for trips:
- `'Osnabrück'` - Osnabrück
- `'Hannover'` - Hannover
- `'Berlin'` - Berlin

### `status_teilnahme_type`
Participation status:
- `'Angefragt'` - Requested
- `'Bestätigt'` - Confirmed
- `'Abgesagt'` - Cancelled
- `'Nachrücker'` - Replacement

### `next_job_type`
Video production workflow stages:
- `'Brainstorming'` - Brainstorming
- `'Skript'` - Script
- `'Dreh'` - Filming
- `'Schnitt'` - Editing
- `'Veröffentlichung'` - Publication
- `'Erledigt'` - Completed

---

## Tables

### users
Main user/member table containing MdB profiles and information.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id_auto` | `integer` | | Auto-incremented user ID |
| `name` | `text` | NOT NULL | Full name of the member |
| `email` | `text` | NOT NULL, UNIQUE | Email address |
| `profile_picture_url` | `text` | | URL to profile picture in Supabase Storage |
| `wahlkreis` | `text` | | Electoral district |
| `plz` | `text` | | Postal code |
| `heimatbahnhof` | `text` | | Home train station |
| `landesverband` | `text` | | State association |
| `active` | `boolean` | DEFAULT true | Whether the user is active |
| `magic_link` | `text` | | Magic link for authentication |
| `role` | `role_type` | DEFAULT 'MdB' | User role in the system |
| `is_fraktionsvorstand` | `boolean` | DEFAULT false | Whether user is in parliamentary group leadership |
| `geschlecht` | `text` | | Gender (M/W/D) |
| `tel_bueroleitung` | `text` | | Office management phone number |
| `ausschuss_1` | `text` | | First committee |
| `ausschuss_2` | `text` | | Second committee |
| `ausschuss_3` | `text` | | Third committee |
| `rolle_ausschuss_1` | `text[]` | | Role in first committee |
| `rolle_ausschuss_2` | `text[]` | | Role in second committee |
| `rolle_ausschuss_3` | `text[]` | | Role in third committee |
| `parlament` | `text` | | Parliament (Bundestag, Landtag, etc.) |
| `pm_generator` | `text` | | Press release generator settings |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### user_preferences
User interface preferences and widget configurations.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to user |
| `widget_order` | `text[]` | | Order of dashboard widgets |
| `active_widgets` | `text[]` | | List of active widgets |
| `theme_preference` | `text` | DEFAULT 'system' | UI theme preference |
| `last_update` | `date` | | Last preference update date |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### data
Legislative data and document storage.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `auto_id` | `integer` | | Auto-incremented ID |
| `auswertung_einzelland_urls` | `text[]` | | URLs to state evaluation documents |
| `buregtable_urls` | `text[]` | | URLs to bureaucracy table documents |
| `drucksache` | `text` | | Parliamentary paper number |
| `weitere_mdb` | `text` | | Other involved MdBs |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to user |
| `thema` | `text` | | Topic/subject |
| `sent` | `text` | | Send status |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### touranfragen
Tour requests and visit applications.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `auto_id` | `integer` | | Auto-incremented ID |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to user |
| `kreisverband` | `text` | | District association |
| `landesverband` | `text` | | State association |
| `kandidat_name` | `text` | | Candidate name |
| `zeitraum_von` | `date` | | Period start date |
| `zeitraum_bis` | `date` | | Period end date |
| `zeitraum_alle` | `text` | | Alternative time description |
| `themen` | `text` | | Topics of interest |
| `video` | `boolean` | DEFAULT false | Whether video is requested |
| `ansprechpartner_1_name` | `text` | | First contact person name |
| `ansprechpartner_2_name` | `text` | | Second contact person name |
| `ansprechpartner_1_phone` | `text` | | First contact person phone |
| `ansprechpartner_2_phone` | `text` | | Second contact person phone |
| `programmvorschlag` | `boolean` | DEFAULT false | Whether program suggestion is requested |
| `status` | `status_type` | DEFAULT 'Eingegangen' | Current status |
| `token_used` | `text` | | Token used for submission |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### task_manager
Task and project management system.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `auto_id` | `integer` | | Auto-incremented ID |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to user |
| `name` | `text` | NOT NULL | Task name |
| `description` | `text` | | Task description |
| `priority` | `priority_type` | DEFAULT 'Normal' | Task priority |
| `next_job` | `next_job_type` | DEFAULT 'Brainstorming' | Next workflow step |
| `deadline` | `date` | | Task deadline |
| `completed` | `boolean` | DEFAULT false | Whether task is completed |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### bpa_formular
BPA (Bundespresseamt) visit application forms.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to user |
| `fahrt_id` | `uuid` | FOREIGN KEY → bpa_fahrten(id) | Reference to trip |
| `anschrift` | `text` | | Address |
| `postleitzahl` | `text` | | Postal code |
| `ort` | `text` | | City |
| `vorname` | `text` | | First name |
| `nachname` | `text` | | Last name |
| `geburtsdatum` | `date` | | Date of birth |
| `geburtsort` | `text` | | Place of birth |
| `zeitraum_von` | `date` | | Period start date |
| `zeitraum_bis` | `date` | | Period end date |
| `zeitraum_alle` | `text` | | Alternative time description |
| `themen` | `text` | | Topics of interest |
| `essenspraeferenzen` | `essenspraeferenz_type` | | Dietary preferences |
| `email` | `text` | | Email address |
| `telefonnummer` | `text` | | Phone number |
| `zustieg` | `zustieg_type` | | Boarding location |
| `status_teilnahme` | `status_teilnahme_type` | | Participation status |
| `status` | `status_type` | | Application status |
| `teilnahme_5j` | `boolean` | DEFAULT false | 5-year participation rule |
| `parteimitglied` | `boolean` | DEFAULT false | Party membership |
| `einzelzimmer` | `boolean` | DEFAULT false | Single room request |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### bpa_fahrten
BPA trips and visit organization.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to organizing user |
| `fahrt_datum_von` | `date` | | Trip start date |
| `fahrt_datum_bis` | `date` | | Trip end date |
| `zielort` | `text` | | Destination |
| `hotel_name` | `text` | | Hotel name |
| `hotel_adresse` | `text` | | Hotel address |
| `kontingent_max` | `integer` | | Maximum participants |
| `status_fahrt` | `status_type` | | Trip status |
| `anmeldefrist` | `date` | | Registration deadline |
| `beschreibung` | `text` | | Trip description |
| `zustiegsorte_config` | `text` | | Boarding locations configuration |
| `aktiv` | `boolean` | DEFAULT true | Whether trip is active |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### news
News articles and press releases management.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to author |
| `title` | `text` | NOT NULL | Article title |
| `content` | `text` | | Article content |
| `summary` | `text` | | Article summary |
| `category` | `text` | | Article category |
| `tags` | `text[]` | | Article tags |
| `published` | `boolean` | DEFAULT false | Whether article is published |
| `publish_date` | `timestamptz` | | Publication date |
| `featured_image_url` | `text` | | Featured image URL |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### politicians
Database of politicians and political figures.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `name` | `text` | NOT NULL | Politician name |
| `party` | `text` | | Political party |
| `position` | `text` | | Current position |
| `biography` | `text` | | Biography |
| `contact_info` | `jsonb` | | Contact information |
| `social_media` | `jsonb` | | Social media links |
| `photo_url` | `text` | | Photo URL |
| `active` | `boolean` | DEFAULT true | Whether politician is active |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### reden
Speech management and analysis.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to speaker |
| `title` | `text` | NOT NULL | Speech title |
| `content` | `text` | | Speech content |
| `date` | `date` | | Speech date |
| `location` | `text` | | Speech location |
| `topic` | `text` | | Speech topic |
| `duration` | `integer` | | Duration in minutes |
| `audio_url` | `text` | | Audio recording URL |
| `transcript_url` | `text` | | Transcript URL |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### tagesordnung
Parliamentary agenda management.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `session_date` | `date` | NOT NULL | Session date |
| `session_number` | `text` | | Session number |
| `agenda_items` | `jsonb` | | Agenda items |
| `documents` | `text[]` | | Related document URLs |
| `status` | `status_type` | | Agenda status |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### bundestag_sessions
Bundestag session tracking and analysis.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `session_number` | `text` | NOT NULL | Session number |
| `date` | `date` | NOT NULL | Session date |
| `topic` | `text` | | Main topic |
| `participants` | `text[]` | | Participating MdBs |
| `documents` | `text[]` | | Session documents |
| `voting_results` | `jsonb` | | Voting results |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### kleine_anfragen
Small parliamentary questions management.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to author |
| `title` | `text` | NOT NULL | Question title |
| `content` | `text` | | Question content |
| `drucksache` | `text` | | Parliamentary paper number |
| `date_submitted` | `date` | | Submission date |
| `answer_received` | `boolean` | DEFAULT false | Whether answer was received |
| `answer_content` | `text` | | Answer content |
| `category` | `text` | | Question category |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### schriftliche_fragen
Written parliamentary questions management.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to author |
| `question_number` | `text` | | Question number |
| `title` | `text` | NOT NULL | Question title |
| `content` | `text` | | Question content |
| `minister` | `text` | | Addressed minister |
| `date_submitted` | `date` | | Submission date |
| `answer_received` | `boolean` | DEFAULT false | Whether answer was received |
| `answer_content` | `text` | | Answer content |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### journalisten
Journalist and media contact database.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `name` | `text` | NOT NULL | Journalist name |
| `media_outlet` | `text` | | Media organization |
| `email` | `text` | | Email address |
| `phone` | `text` | | Phone number |
| `specialization` | `text[]` | | Areas of specialization |
| `contact_history` | `jsonb` | | Contact interaction history |
| `active` | `boolean` | DEFAULT true | Whether contact is active |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### referenten
Expert speaker and reference contact database.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `name` | `text` | NOT NULL | Expert name |
| `organization` | `text` | | Organization/Institution |
| `expertise` | `text[]` | | Areas of expertise |
| `email` | `text` | | Email address |
| `phone` | `text` | | Phone number |
| `bio` | `text` | | Biography |
| `availability` | `text` | | Availability notes |
| `active` | `boolean` | DEFAULT true | Whether contact is active |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### raumbuchungen
Room booking and reservation system.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to booking user |
| `room_name` | `text` | NOT NULL | Room name |
| `date` | `date` | NOT NULL | Booking date |
| `start_time` | `time` | NOT NULL | Start time |
| `end_time` | `time` | NOT NULL | End time |
| `purpose` | `text` | | Booking purpose |
| `attendees` | `integer` | | Expected attendees |
| `equipment_needed` | `text[]` | | Required equipment |
| `status` | `status_type` | DEFAULT 'Eingegangen' | Booking status |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### pressemitteilungen
Press release management and distribution.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to author |
| `title` | `text` | NOT NULL | Press release title |
| `content` | `text` | | Press release content |
| `summary` | `text` | | Executive summary |
| `release_date` | `date` | | Planned release date |
| `published` | `boolean` | DEFAULT false | Whether published |
| `distribution_list` | `text[]` | | Distribution list |
| `attachments` | `text[]` | | Attachment URLs |
| `status` | `status_type` | DEFAULT 'Eingegangen' | Current status |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

### wahlkreisbueros
Electoral district office management.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `airtable_id` | `text` | UNIQUE | Reference ID for data lineage |
| `user_id` | `uuid` | FOREIGN KEY → users(id) | Reference to MdB |
| `office_name` | `text` | NOT NULL | Office name |
| `address` | `text` | | Office address |
| `postal_code` | `text` | | Postal code |
| `city` | `text` | | City |
| `phone` | `text` | | Office phone |
| `email` | `text` | | Office email |
| `opening_hours` | `text` | | Opening hours |
| `staff` | `jsonb` | | Staff information |
| `active` | `boolean` | DEFAULT true | Whether office is active |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation timestamp |

---

## Relationships

### Primary Foreign Key Relationships

1. **users** → **user_preferences** (One-to-One)
   - `user_preferences.user_id` → `users.id`

2. **users** → **data** (One-to-Many)
   - `data.user_id` → `users.id`

3. **users** → **touranfragen** (One-to-Many)
   - `touranfragen.user_id` → `users.id`

4. **users** → **task_manager** (One-to-Many)
   - `task_manager.user_id` → `users.id`

5. **users** → **bpa_formular** (One-to-Many)
   - `bpa_formular.user_id` → `users.id`

6. **bpa_fahrten** → **bpa_formular** (One-to-Many)
   - `bpa_formular.fahrt_id` → `bpa_fahrten.id`

7. **users** → **[various tables]** (One-to-Many)
   - Most content tables reference `users.id` as the author/creator

---

## Storage Buckets

### documents
- **Purpose**: Store file attachments, documents, and media files
- **Public**: Yes (with proper access controls)
- **Usage**: Profile pictures, legislative documents, press materials

---

## Indexes and Performance

### Recommended Indexes
- `users.email` - Unique index for authentication
- `users.airtable_id` - For data lineage lookups
- `task_manager.user_id` - For user task queries
- `touranfragen.status` - For status filtering
- `bpa_formular.fahrt_id` - For trip-related queries

---

## Security Considerations

1. **Row Level Security (RLS)**: Should be enabled on all tables
2. **User Access**: Users should only access their own records
3. **Admin Access**: Admin roles need broader access for management
4. **API Keys**: Proper key management for different access levels

---

## Technical Notes

- UUID primary keys for better distribution and security
- Enum types ensure data consistency
- Timestamps use `timestamptz` for timezone awareness
- Arrays used for multi-value fields (tags, roles, etc.)
- JSONB used for flexible nested data structures
- All tables include `airtable_id` for data lineage tracking 