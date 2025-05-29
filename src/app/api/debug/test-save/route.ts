import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string; // Supabase UUID

  try {
    console.log('Debug Test Save GET: Examining user record for:', userId);
    
    // Get the user record and examine its structure
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.log('Debug Test Save GET: User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      debug: true,
      recordId: userRecord.id,
      allFields: Object.keys(userRecord),
      fieldValues: {
        heimatbahnhof: userRecord.heimatbahnhof,
        name: userRecord.name,
        email: userRecord.email,
        wahlkreis: userRecord.wahlkreis,
        created_at: userRecord.created_at,
      },
      migrationInfo: {
        platform: 'Supabase',
        primaryKey: 'UUID (id)',
        fieldNaming: 'snake_case (instead of PascalCase)',
        notes: 'All fields use snake_case naming convention in Supabase'
      }
    });

  } catch (error) {
    console.error('Debug Test Save GET: Error:', error);
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

  const userId = token.id as string; // Supabase UUID

  try {
    const requestData = await req.json();
    const { heimatbahnhof, testField, testMode } = requestData;
    
    console.log('Debug Test Save POST: Testing save with data:', {
      userId,
      heimatbahnhof,
      testField,
      testMode
    });

    // First, find the user record
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, name, email, heimatbahnhof')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.log('Debug Test Save POST: User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Debug Test Save POST: Found user record:', userRecord.id);
    console.log('Debug Test Save POST: Current heimatbahnhof:', userRecord.heimatbahnhof);

    // Test different scenarios based on testMode
    let updateFields: any = {};
    
    if (testMode === 'safe') {
      // Test with a known safe field first
      updateFields['name'] = userRecord.name || 'Test Name';
    } else if (testMode === 'empty') {
      // Test with empty heimatbahnhof
      updateFields['heimatbahnhof'] = '';
    } else if (testMode === 'simple') {
      // Test with simple ASCII characters
      updateFields['heimatbahnhof'] = 'Berlin Hbf';
    } else {
      // Default test with provided value
      if (heimatbahnhof !== undefined) {
        updateFields['heimatbahnhof'] = heimatbahnhof;
      }
    }
    
    console.log('Debug Test Save POST: Fields to update:', updateFields);
    console.log('Debug Test Save POST: Update fields JSON:', JSON.stringify(updateFields, null, 2));

    if (Object.keys(updateFields).length > 0) {
      try {
        const { data: updateResult, error: updateError } = await supabase
          .from('users')
          .update(updateFields)
          .eq('id', userRecord.id)
          .select()
          .single();

        if (updateError) {
          console.error('Debug Test Save POST: Supabase update error:', updateError);
          
          return NextResponse.json({ 
            error: 'Supabase update failed',
            details: updateError.message,
            code: updateError.code,
            hint: updateError.hint,
            fieldsAttempted: updateFields,
            testMode: testMode || 'default',
            errorType: 'SupabaseError'
          }, { status: 400 });
        }
        
        console.log('Debug Test Save POST: Update successful');
        return NextResponse.json({ 
          success: true, 
          message: 'Test save successful',
          recordId: updateResult.id,
          updatedFields: updateFields,
          testMode: testMode || 'default',
          migrationInfo: {
            platform: 'Supabase',
            fieldUpdated: Object.keys(updateFields)[0],
            previousValue: testMode === 'safe' ? 'same' : userRecord.heimatbahnhof,
            newValue: Object.values(updateFields)[0]
          }
        });
      } catch (updateError) {
        console.error('Debug Test Save POST: General update error:', updateError);
        
        return NextResponse.json({ 
          error: 'General update error',
          details: updateError instanceof Error ? updateError.message : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
          fieldsAttempted: updateFields,
          testMode: testMode || 'default',
          errorType: updateError instanceof Error ? updateError.constructor.name : 'Unknown'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'No fields to update',
      migrationInfo: {
        platform: 'Supabase',
        note: 'No update operations performed'
      }
    });

  } catch (error) {
    console.error('Debug Test Save POST: General error:', error);
    return NextResponse.json({ 
      error: 'General error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 