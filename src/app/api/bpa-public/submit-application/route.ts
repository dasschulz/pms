import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';

// Expected request body structure
interface SubmitApplicationBody {
  mdbAirtableUserId: string; // Airtable Record ID of the MdB (from Users table)
  fahrtAirtableId: string;   // Airtable Record ID of the selected BPA_Fahrt
  formData: {
    vorname: string;
    nachname: string;
    geburtsdatum: string;
    email: string;
    anschrift: string;
    postleitzahl: string;
    ort: string;
    parteimitglied: boolean;
    zustieg: string;
    essenspraeferenz: string;
    // Add other fields from BPA_Formular as they are added to the form
    geburtsort?: string; 
    themen?: string;
    // einzelzimmer?: boolean; // Example of another potential field
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitApplicationBody = await req.json();

    const { mdbAirtableUserId, fahrtAirtableId, formData } = body;

    if (!mdbAirtableUserId || !fahrtAirtableId || !formData) {
      return NextResponse.json({ error: 'Missing required fields in request body' }, { status: 400 });
    }

    // Airtable field names from airtable_schema.md for BPA_Formular table:
    // UserID (links to Users): fldae3qAVJuU3sBEF
    // FahrtID_ForeignKey (links to BPA_Fahrten): fldA0WyW6TwjVDqGV
    // Vorname: fld2s1kXwiBGO3j8g
    // Nachname: fldgnycvXVJOQ2pSt
    // Geburtsdatum: fldtvFU1d4qjBAtd4
    // Email: fld79dvhPEYtpP6Ah
    // Anschrift: fldaxRAJh2X9JjLti
    // Postleitzahl: fldkJwhCfssXMEqR2
    // Ort: fldUSoYUtZpCmgUeI
    // Parteimitglied (checkbox): fldCP2cnNvk87uiMM
    // Zustieg (select): fldkY9uvdjR5Wg0tX
    // Essenspräferenzen (select): fldiD7GwEAM3crblo
    // Geburtsort: fldrHVxstGXs1U4N8
    // Themen: fldpyjtc82FFjCwYz
    // Status: fldA1UzQdpOG5WbRI (Default to 'Neu')

    const airtableData = {
      'UserID': [mdbAirtableUserId], // Link to Users table (MdB)
      'FahrtID_ForeignKey': [fahrtAirtableId], // Link to BPA_Fahrten table
      'Vorname': formData.vorname,
      'Nachname': formData.nachname,
      'Geburtsdatum': formData.geburtsdatum, // Assuming YYYY-MM-DD string format
      'Email': formData.email,
      'Anschrift': formData.anschrift,
      'Postleitzahl': parseInt(formData.postleitzahl, 10), // Ensure it's a number
      'Ort': formData.ort,
      'Parteimitglied': formData.parteimitglied,
      'Zustieg': formData.zustieg,
      'Essenspräferenzen': formData.essenspraeferenz,
      'Status': 'Neu', // Default status for new applications
      // Optional fields from formData
      ...(formData.geburtsort && { 'Geburtsort': formData.geburtsort }),
      ...(formData.themen && { 'Themen': formData.themen }),
    };

    const createdRecord = await base('BPA_Formular').create([
      {
        fields: airtableData,
      },
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully', 
      recordId: createdRecord[0].id 
    });

  } catch (error) {
    console.error('[API bpa-public/submit-application] Error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
} 