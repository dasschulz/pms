# BPA-Fahrten Implementation

Complete implementation of the BPA (Bundespresseamt) trip management system for the MdB App.

## Overview

The BPA-Fahrten system provides comprehensive trip management for Members of Bundestag, allowing them to organize, manage and accept applications for citizen trips to Berlin.

## Features Implemented

### Task 0-3: Core Infrastructure
- **Airtable Backend Integration**: Complete CRUD operations with proper field mapping
- **Management Dashboard**: `/bpa-fahrten` - Administrative interface for trip management
- **Public Application Form**: `/bpa/[lastName]` - Citizens can apply for trips
- **API Endpoints**: Full REST API for trips and applications
- **Authentication**: JWT-based auth with Airtable record ID integration

### Task 4: Beautiful Public Form & iFrame Embedding
- **Modern UI**: Glass morphism design matching Touranfragen form
- **Responsive Design**: Works on all device sizes
- **iFrame Embeddable**: Can be embedded on external websites
- **Embedding API**: `/api/bpa-public/embed?lastName=[name]` 
- **Auto-resize**: Smart iframe sizing for seamless integration

### Task 5: Navigation Reorganization
- **"Draußenwelt" Category**: New navigation section for external activities
- **Reorganized Menu**: BPA-Fahrten and Touranfragen moved under Draußenwelt
- **Wahlkreisbüros Page**: Placeholder page for future constituency office management
- **Mountain Icon**: Uses Mountain icon to represent outdoor/external activities

## Technical Implementation

### Database Schema (Airtable)

#### BPA_Fahrten Table
- `FahrtID` (Primary Key)
- `Fahrt_Datum_Von` (Date)
- `Fahrt_Datum_Bis` (Date) 
- `Zielort` (Text)
- `Hotel_Name` (Text)
- `Hotel_Adresse` (Long Text)
- `Kontingent_Max` (Number)
- `Status_Fahrt` (Single Select)
- `Anmeldefrist` (Date)
- `Beschreibung` (Long Text)
- `Zustiegsorte_Config` (Text)
- `Aktiv` (Checkbox)
- `MdB_User` (Link to Users table)

#### BPA_Formular Table
- `AnmeldungID` (Primary Key)
- `Vorname` (Text)
- `Nachname` (Text)
- `Geburtsdatum` (Date)
- `Email` (Email)
- `Anschrift` (Text)
- `Postleitzahl` (Text)
- `Ort` (Text)
- `Parteimitglied` (Checkbox)
- `Zustieg` (Text)
- `Essenspraeferenz` (Single Select)
- `Status_Teilnahme` (Single Select: Abgesagt, Bestätigt, Nachrücker)
- `BPA_Fahrt` (Link to BPA_Fahrten)
- `MdB_User` (Link to Users table)

### API Endpoints

#### Management APIs
- `GET /api/bpa-fahrten` - List all trips
- `POST /api/bpa-fahrten` - Create new trip
- `PUT /api/bpa-fahrten` - Update existing trip
- `DELETE /api/bpa-fahrten` - Delete trip
- `GET /api/bpa-fahrten/[fahrtId]` - Get trip details with applications

#### Public APIs
- `GET /api/bpa-public/mdb-details?lastName=[name]` - Get MdB info by last name
- `GET /api/bpa-public/active-trips?airtableUserId=[id]` - Get active trips for MdB
- `POST /api/bpa-public/submit-application` - Submit citizen application
- `GET /api/bpa-public/embed?lastName=[name]` - iFrame embedding HTML

### UI Components

#### Management Interface (`/bpa-fahrten`)
- **Data Table**: Sortable, filterable list of all trips
- **Skeleton Loading**: Professional loading states
- **CRUD Dialogs**: Create and edit trip forms
- **Calendar Integration**: Date pickers with German locale
- **Info Popovers**: Contextual help with BPA policy information
- **Status Management**: Color-coded status badges
- **iFrame Documentation**: Copy-paste embedding instructions

#### Public Form (`/bpa/[lastName]`)
- **Glass Morphism Design**: Modern, beautiful UI with backdrop blur
- **Gradient Background**: Eye-catching red/pink gradient with noise texture
- **Smart Trip Selection**: Auto-selection for single trips, dropdown for multiple
- **Form Validation**: Client and server-side validation
- **Success States**: Beautiful confirmation screens
- **Error Handling**: User-friendly error messages
- **Responsive Layout**: Works on mobile, tablet, desktop

#### Navigation
- **Draußenwelt Category**: Groups external-facing tools
- **Icon Consistency**: Mountain icon for outdoor activities
- **Hierarchical Structure**: Logical grouping of related features

### Design Features

#### Visual Design
- **Consistent Branding**: Matches DIE LINKE color scheme
- **Modern Typography**: Clean, readable fonts
- **Accessibility**: Proper contrast ratios and keyboard navigation
- **Loading States**: Skeleton loaders for better UX
- **Micro-interactions**: Smooth hover effects and transitions

#### UX Features
- **Contextual Help**: Question mark icons with policy information
- **Smart Defaults**: Pre-filled common values
- **Validation Feedback**: Real-time form validation
- **Success Feedback**: Toast notifications and success screens
- **Error Recovery**: Clear error messages with recovery options

## Usage

### For MdB Staff
1. Navigate to `/bpa-fahrten` 
2. Create new trips with the "Neue Fahrt erstellen" button
3. Manage existing trips with edit/view/delete actions
4. Monitor applications and participant status
5. Copy iframe code for website embedding

### For Citizens
1. Visit `/bpa/[lastName]` (replace with MdB's last name)
2. Fill out the application form
3. Submit and receive confirmation
4. Receive status updates via email

### For Website Integration
1. Get iframe code from management interface
2. Replace lastName parameter with actual MdB name
3. Embed on website with responsive sizing
4. Auto-resize handles content changes

## Security & Data Protection

### Privacy Compliance
- **GDPR Compliant**: Data deletion after trip completion
- **Minimal Data Sharing**: Only name shared with hotels
- **Secure Storage**: Encrypted data transmission
- **Access Control**: Authentication required for management

### BPA Policy Compliance
- **Age Verification**: 18+ requirement enforced
- **Eligibility Checks**: Political interest and constituency requirements
- **5-Year Rule**: Documentation of repeat participation restrictions
- **EU Citizenship**: Support for EU citizen participation

## Future Enhancements

### Planned Features
- **Email Automation**: Automatic confirmation and reminder emails
- **Bulk Operations**: Mass status updates and communications
- **Reporting**: Analytics and participation reports
- **Integration**: Connection with constituency office systems
- **Mobile App**: Native mobile application for participants

### Technical Improvements
- **Caching**: Redis caching for better performance
- **Real-time Updates**: WebSocket integration for live status updates
- **PDF Generation**: Automatic participant lists and documents
- **API Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete audit trail for compliance

## Deployment Notes

### Environment Variables Required
```env
AIRTABLE_API_KEY=your_api_key
AIRTABLE_BASE_ID=your_base_id
NEXTAUTH_URL=your_domain
NEXTAUTH_SECRET=your_secret
```

### Build Configuration
- Next.js 14 with App Router
- TypeScript strict mode enabled
- Tailwind CSS for styling
- shadcn/ui component library
- date-fns for date handling with German locale

## Support

For technical issues or feature requests, contact the development team.
The implementation follows modern web standards and accessibility guidelines. 