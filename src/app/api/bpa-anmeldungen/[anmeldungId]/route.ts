import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { base } from '@/lib/airtable';

interface UpdateAnmeldungBody {
  status?: string;           // e.g., 'Neu', 'Abgeschlossen', 'Terminiert', 'Eingegangen'
  statusTeilnahme?: string; // e.g., 'Abgesagt', 'Bestätigt', 'Nachrücker'
  // Add any other updatable fields for an application
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ anmeldungId: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.airtableRecordId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const mdbAirtableUserId = token.airtableRecordId as string; // For permission check

  const { anmeldungId } = await params;
  if (!anmeldungId) {
    return NextResponse.json({ error: 'Missing anmeldungId parameter' }, { status: 400 });
  }

  try {
    // Permission check:
    // 1. Fetch the BPA_Formular record (application).
    // 2. Get its linked FahrtID_ForeignKey (fldA0WyW6TwjVDqGV).
    // 3. Fetch the BPA_Fahrt record using that ID.
    // 4. Check UserID (fldNHxKrcJ0Hv4x1s) of the BPA_Fahrt against mdbAirtableUserId.
    const applicationRecord = await base('BPA_Formular').find(anmeldungId);
    if (!applicationRecord) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const fahrtForeignKey = (applicationRecord.fields.FahrtID_ForeignKey as string[])?.[0];
    if (!fahrtForeignKey) {
      return NextResponse.json({ error: 'Application is not linked to a BPA trip' }, { status: 400 }); // Or 500 if this indicates data integrity issue
    }

    const fahrtRecord = await base('BPA_Fahrten').find(fahrtForeignKey);
    if (!fahrtRecord) {
      return NextResponse.json({ error: 'Associated BPA Trip not found' }, { status: 404 });
    }

    const linkedMdbUserIds = (fahrtRecord.fields.UserID as string[]) || [];
    if (!linkedMdbUserIds.includes(mdbAirtableUserId)) {
      return NextResponse.json({ error: 'Forbidden. You do not own the BPA trip this application belongs to.' }, { status: 403 });
    }

    // If all checks pass, proceed to update.
    const body: UpdateAnmeldungBody = await req.json();

    const fieldsToUpdate: { [key: string]: any } = {};
    if (body.status !== undefined) fieldsToUpdate['Status'] = body.status;
    if (body.statusTeilnahme !== undefined) fieldsToUpdate['Status_Teilnahme'] = body.statusTeilnahme;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    const updatedRecord = await base('BPA_Formular').update([
      {
        id: anmeldungId,
        fields: fieldsToUpdate,
      },
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Application updated successfully', 
      recordId: updatedRecord[0].id,
      updatedFields: updatedRecord[0].fields // Return the updated fields
    });

  } catch (error) {
    console.error(`[API /bpa-anmeldungen/${anmeldungId} PUT] Airtable Error:`, error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
} 