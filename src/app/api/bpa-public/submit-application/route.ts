import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Expected request body structure
interface SubmitApplicationBody {
  mdbUserId: string; // Supabase UUID of the MdB (from users table)
  fahrtId: string;   // Supabase UUID of the selected bpa_fahrten
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
    // Add other fields from bpa_formular as they are added to the form
    geburtsort?: string; 
    themen?: string;
    telefonnummer?: string;
    teilnahme5J?: boolean;
    einzelzimmer?: boolean;
  };
}

export async function POST(req: NextRequest) {
  try {
    console.log('BPA Public Submit Application: Starting application submission');
    
    const body: SubmitApplicationBody = await req.json();

    const { mdbUserId, fahrtId, formData } = body;

    if (!mdbUserId || !fahrtId || !formData) {
      return NextResponse.json({ error: 'Missing required fields in request body' }, { status: 400 });
    }

    console.log('BPA Public Submit Application: Received data for MdB:', mdbUserId, 'Trip:', fahrtId);

    // Verify that the MdB user exists
    const { data: mdbUser, error: mdbError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', mdbUserId)
      .single();

    if (mdbError || !mdbUser) {
      console.log('BPA Public Submit Application: MdB user not found:', mdbUserId, mdbError?.message);
      return NextResponse.json({ error: 'Invalid MdB user' }, { status: 400 });
    }

    // Verify that the trip exists and is active
    const { data: fahrt, error: fahrtError } = await supabase
      .from('bpa_fahrten')
      .select('id, zielort, aktiv')
      .eq('id', fahrtId)
      .eq('aktiv', true)
      .single();

    if (fahrtError || !fahrt) {
      console.log('BPA Public Submit Application: Trip not found or inactive:', fahrtId, fahrtError?.message);
      return NextResponse.json({ error: 'Invalid or inactive trip' }, { status: 400 });
    }

    console.log('BPA Public Submit Application: Verified MdB and trip, creating application');

    // Prepare application data for Supabase
    const applicationData = {
      user_id: mdbUserId, // Links to users table (MdB)
      fahrt_id: fahrtId, // Links to bpa_fahrten table
      vorname: formData.vorname,
      nachname: formData.nachname,
      geburtsdatum: formData.geburtsdatum,
      email: formData.email,
      anschrift: formData.anschrift,
      postleitzahl: formData.postleitzahl,
      ort: formData.ort,
      parteimitglied: formData.parteimitglied,
      zustieg: formData.zustieg,
      essenspraeferenzen: formData.essenspraeferenz,
      status: 'Neu', // Default status for new applications
      // Optional fields
      geburtsort: formData.geburtsort || null,
      themen: formData.themen || null,
      telefonnummer: formData.telefonnummer || null,
      teilnahme_5j: formData.teilnahme5J || false,
      einzelzimmer: formData.einzelzimmer || false,
    };

    // Create the application in Supabase
    const { data: createdRecord, error: createError } = await supabase
      .from('bpa_formular')
      .insert(applicationData)
      .select()
      .single();

    if (createError) {
      console.error('BPA Public Submit Application: Error creating application:', createError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    console.log('BPA Public Submit Application: Application created successfully:', createdRecord.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully', 
      recordId: createdRecord.id 
    });

  } catch (error) {
    console.error('[API bpa-public/submit-application] Supabase Error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
} 