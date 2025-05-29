# PDF Generation Functionality

## Components
- **PdfGenerator.tsx**: Handles the UI for PDF generation, including a button to trigger the process and a loading indicator.

## API
- **generate.ts**: API endpoint to handle PDF generation requests. It now includes custom fonts (Work Sans and Inter) and styling for headings and body text.

## Integration
- **Gegner-Recherche Page**: The 'Komplettes Dossier erstellen' button has been updated to use the `PdfGenerator` component, allowing users to generate and download PDFs directly from this page.

## Future Work
- Customize the PDF content based on specific page requirements.
- Further refine the styling and layout as needed. 

## Kleine Anfragen PDF generator


## Gegner-Recherche

- **Gegner-Recherche Page**: clicking the 'Komplettes Dossier erstellen' button should:
1. start a progress bar
2. Send the name of the currently displayed politician on the card to the OpenAI assistant "Feinddossier" associated with our api key
3. Wait for response
4. Turn response into pdf
5. finish progress bar
6. Enable download and turn 'Komplettes Dossier erstellen' button background green, switch text to 'Dossier erstellt' and enable download by clicking button.
7. Update Supabase 'feinddossier' table; enter User-ID in 'user_id', save the pdf to 'attachments', the name of currently displayed politician should be saved to 'gegner', and creation time should be saved to 'created_at'.

# PDF Creation Feature - Komplettes Dossier erstellen

## ✅ Implementation Status: COMPLETED

The "Komplettes Dossier erstellen" button functionality has been fully implemented for the Gegner-Recherche page.

## Features Implemented

### 1. ✅ Progress Bar
- Starts automatically when button is clicked
- Shows real-time progress updates during generation
- Completes at 100% when dossier is ready

### 2. ✅ OpenAI Integration
- Sends politician name to OpenAI assistant "Feinddossier"
- Waits for AI response with timeout protection
- Generates comprehensive dossier content

### 3. ✅ PDF Generation
- Converts AI response to professional PDF format
- Includes proper formatting with headers and dates
- Features automatic text wrapping and multi-page support
- A4 format with proper margins

### 4. ✅ Download Functionality
- Enables download immediately after completion
- Button changes to green "Dossier herunterladen" on success
- Generates filename with politician name and date

### 5. ✅ Supabase Integration
- Updates 'feinddossier' table with:
  - user_id (linked to users table)
  - gegner (politician name)
  - created_at (creation timestamp)
  - status ('Generated')
  - content (preview of first 1000 characters)

### 6. ✅ UI States & Error Handling
- Loading state with progress indicator
- Success state with green button
- Error state with retry option
- Comprehensive German error messages
- Toast notifications for user feedback

## Setup Requirements

### Environment Variables
Add to your `.env.local` file:
```
OPENAI_FEINDDOSSIER_ASSISTANT_ID=asst_your_assistant_id_here
```

### OpenAI Assistant Configuration
1. Create an OpenAI assistant in the OpenAI platform
2. Configure it with instructions for creating political dossiers
3. Copy the assistant ID (starts with "asst_")
4. Add it to your environment variables

### Supabase Schema
Ensure the 'feinddossier' table exists with these fields:
- user_id (UUID, Foreign Key to users table)
- gegner (TEXT)
- created_at (TIMESTAMP)
- status (TEXT)
- content (TEXT, optional)

## Usage Flow

1. User searches and selects a politician
2. User clicks "Komplettes Dossier erstellen"
3. Progress bar appears and updates
4. AI generates comprehensive dossier content
5. Content is converted to formatted PDF
6. Progress completes at 100%
7. Button changes to "Dossier herunterladen" (green)
8. User can download PDF or generate new dossier
9. Record is saved to Supabase for tracking

## Error Handling

The system handles various error scenarios:
- Authentication failures
- OpenAI API errors
- PDF generation errors
- Supabase connection issues
- Network timeouts

All errors display user-friendly German messages with appropriate retry options.

## File Structure

- `/src/app/api/dossier/generate/route.ts` - API endpoint
- `/src/app/gegner-recherche/page.tsx` - Frontend implementation
- Progress component from `@radix-ui/react-progress`
- Toast notifications from custom hooks
