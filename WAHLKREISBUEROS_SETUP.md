# Wahlkreisbüros Complete Setup

## ✅ Status: Ready for Full Implementation

The basic wahlkreisbüros functionality is working perfectly! Now it's time to add all the advanced features from `todo.md`.

## 🔧 Required Action: Create Complete Database Schema

**Copy and paste the entire contents of `sql_migrations/wahlkreisbueros_complete_setup.sql` into your Supabase SQL Editor.**

This will create:

### 📁 Storage
- **wahlkreisbuero-photos** bucket (5MB limit, images only)
- Public access policies for photos

### 🗃️ Database Tables
- **wahlkreisbuero_oeffnungszeiten** (opening hours)
  - Weekday-based opening/closing times
- **wahlkreisbuero_sprechstunden** (MdB consultation hours)
  - When the MdB is available for meetings
- **wahlkreisbuero_beratungen** (consultation services)
  - "Die Linke hilft" services with enum types:
    - schuldenberatung (debt counseling)
    - buergergeldberatung (social benefits)
    - mietrechtsberatung (tenant rights)
    - arbeitsrechtsberatung (labor law)

### 🔒 Security
- **RLS policies** for all tables (properly configured)
- **Indexes** for optimal performance
- **Triggers** for automatic timestamp updates

### 🗺️ Geocoding
- **geocode_address()** function placeholder
- **Coordinates index** ready for Germany map display

## 🚀 After Database Setup

1. **Enable relations in API**: Update `/api/wahlkreisbueros?include=relations`
2. **Photo upload**: Add image upload and resizing functionality
3. **Hours management**: Create UI for opening hours and consultation times
4. **Consultation services**: Create UI for "Die Linke hilft" services
5. **Geocoding integration**: Add API call to convert addresses to coordinates
6. **Germany map page**: Create separate page showing all offices on map

## 📋 Staff Management Note

**Staff management is now handled by the comprehensive `/mitarbeitende` system** which provides:
- Professional MdB staff management with proper assignments
- Support for multiple MdB assignments per staff member  
- Integration with constituency office mapping via einsatzort field
- Enhanced validation and business logic
- Complete CRUD operations with form validation

## 📋 Full Schema Overview

```
wahlkreisbueros (main table)
├── id, user_id, name, photo_url
├── strasse, hausnummer, plz, ort
├── latitude, longitude (for map)
└── created_at, updated_at

wahlkreisbuero_oeffnungszeiten
├── wahlkreisbuero_id → wahlkreisbueros.id  
├── wochentag (1-7), von_zeit, bis_zeit
├── geschlossen (boolean)
└── created_at, updated_at

wahlkreisbuero_sprechstunden
├── wahlkreisbuero_id → wahlkreisbueros.id
├── mdb_name, wochentag (1-7)
├── von_zeit, bis_zeit, beschreibung
└── created_at, updated_at

wahlkreisbuero_beratungen
├── wahlkreisbuero_id → wahlkreisbueros.id
├── typ (enum), anbieter, wochentag (1-7)
├── von_zeit, bis_zeit, beschreibung  
└── created_at, updated_at
```

## 🎯 **Mehrwert** für das MdB-Büro

Durch die vollständige Wahlkreisbüro-Verwaltung können MdBs ihre Bürgernähe professionell organisieren und kommunizieren - von Mitarbeiterübersichten über Sprechstunden bis hin zu spezialisierten Beratungsangeboten, was die Bürgernähe und Erreichbarkeit der Abgeordneten erheblich verbessert.

Once the table is created, the wahlkreisbüros functionality will be **fully operational**:

- Users can create new constituency offices
- Data will be properly saved with user ownership
- All CRUD operations will work seamlessly
- The test endpoint `/api/wahlkreisbueros/test` will confirm everything works

## Verification 🧪

After creating the table, test the functionality:

1. Start your development server: `npm run dev`
2. Navigate to `/wahlkreisbueros`
3. Try creating a new office through the form
4. Verify data persistence and error handling

## Architecture Notes 📋

- **Authentication**: Uses NextAuth.js tokens (consistent with touranfragen)
- **Database Access**: Uses `supabaseAdmin` client to bypass RLS during development
- **User Context**: Properly filters data by `user_id` at application level
- **Error Handling**: Comprehensive logging and user-friendly error messages

## Future Enhancements 🔮

Once basic functionality is working:
- Enable proper RLS policies 
- Add related tables (mitarbeiter, öffnungszeiten, etc.)
- Implement photo upload functionality
- Add geocoding for automatic coordinates 