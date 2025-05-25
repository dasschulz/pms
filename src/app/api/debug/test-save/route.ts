import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;

  try {
    // First, get the user record and examine its structure
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = records[0];
    const fields = userRecord.fields;
    
    return NextResponse.json({ 
      debug: true,
      recordId: userRecord.id,
      allFields: Object.keys(fields),
      fieldValues: {
        Heimatbahnhof: fields['Heimatbahnhof'],
        heimatbahnhof: fields['heimatbahnhof'],
        'Heimat-Bahnhof': fields['Heimat-Bahnhof'],
        Name: fields['Name'],
        Email: fields['Email']
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to examine record',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;

  try {
    const requestData = await req.json();
    const { heimatbahnhof, testField, testMode } = requestData;
    
    console.log('DEBUG: Testing save with data:', {
      userId,
      heimatbahnhof,
      testField,
      testMode
    });

    // First, find the user record
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        fields: ['Name', 'Email', 'Heimatbahnhof'], 
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = records[0];
    console.log('DEBUG: Found user record:', userRecord.id);
    console.log('DEBUG: Current Heimatbahnhof:', userRecord.get('Heimatbahnhof'));

    // Test different scenarios based on testMode
    let updateFields: any = {};
    
    if (testMode === 'safe') {
      // Test with a known safe field first
      updateFields['Name'] = userRecord.get('Name') || 'Test Name';
    } else if (testMode === 'empty') {
      // Test with empty heimatbahnhof
      updateFields['Heimatbahnhof'] = '';
    } else if (testMode === 'simple') {
      // Test with simple ASCII characters
      updateFields['Heimatbahnhof'] = 'Berlin Hbf';
    } else {
      // Default test with provided value
      if (heimatbahnhof !== undefined) {
        updateFields['Heimatbahnhof'] = heimatbahnhof;
      }
    }
    
    console.log('DEBUG: Fields to update:', updateFields);
    console.log('DEBUG: Update fields JSON:', JSON.stringify(updateFields, null, 2));

    if (Object.keys(updateFields).length > 0) {
      try {
        const updateResult = await base('Users').update([
          {
            id: userRecord.id,
            fields: updateFields
          }
        ]);
        console.log('DEBUG: Update successful');
        return NextResponse.json({ 
          success: true, 
          message: 'Test save successful',
          recordId: updateResult[0].id,
          updatedFields: updateFields,
          testMode: testMode || 'default'
        });
      } catch (updateError) {
        console.error('DEBUG: Airtable update error details:', updateError);
        
        // Return detailed error information
        return NextResponse.json({ 
          error: 'Airtable update failed',
          details: updateError instanceof Error ? updateError.message : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
          fieldsAttempted: updateFields,
          testMode: testMode || 'default',
          errorType: updateError instanceof Error ? updateError.constructor.name : 'Unknown'
        }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'No fields to update' });

  } catch (error) {
    console.error('DEBUG: General error:', error);
    return NextResponse.json({ 
      error: 'General error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 