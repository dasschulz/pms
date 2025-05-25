import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;
  console.log('GET: Fetching user data for userId:', userId);

  try {
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        fields: ['Wahlkreis', 'PLZ', 'Profile Picture', 'Name', 'Email', 'Landesverband', 'Heimatbahnhof'], 
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      console.log('GET: No user found for userId:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = records[0];
    const wahlkreis = userRecord.get('Wahlkreis') as string | undefined;
    const plz = userRecord.get('PLZ') as string | undefined;
    const profilePicture = userRecord.get('Profile Picture') as any[] | undefined;
    const name = userRecord.get('Name') as string | undefined;
    const email = userRecord.get('Email') as string | undefined;
    const landesverband = userRecord.get('Landesverband') as string | undefined;
    const heimatbahnhof = userRecord.get('Heimatbahnhof') as string | undefined;

    console.log('GET: Retrieved user data:', {
      name,
      email,
      wahlkreis,
      plz,
      landesverband,
      heimatbahnhof,
      recordId: userRecord.id
    });

    // Extract profile picture URL if available
    const profilePictureUrl = profilePicture && profilePicture.length > 0 
      ? profilePicture[0].url 
      : null;

    return NextResponse.json({ 
      wahlkreis,
      plz,
      profilePictureUrl,
      name,
      email,
      landesverband,
      heimatbahnhof,
      airtableRecordId: userRecord.id
    });
  } catch (error) {
    console.error('Airtable API Error fetching user details:', error);
    return NextResponse.json({ error: 'Failed to fetch user details from Airtable' }, { status: 500 });
  }
}

// Password validation function
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Das Passwort muss mindestens 8 Zeichen lang sein');
  }
  
  if (password.length > 128) {
    errors.push('Das Passwort darf maximal 128 Zeichen lang sein');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Das Passwort muss mindestens einen Kleinbuchstaben enthalten');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Das Passwort muss mindestens einen Großbuchstaben enthalten');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Das Passwort muss mindestens eine Zahl enthalten');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Das Passwort muss mindestens ein Sonderzeichen enthalten');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', 'passwort', '12345678', 'qwertyui', 'asdfghjk',
    'password123', 'passwort123', '123456789', 'qwerty123'
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Das Passwort ist zu häufig verwendet und unsicher');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;

  try {
    console.log('POST: Starting user-details update for userId:', userId);
    
    const requestData = await req.json();
    console.log('POST: Parsed request data successfully');
    
    const { name, email, wahlkreis, plz, landesverband, heimatbahnhof, profilePictureUrl, currentPassword, newPassword } = requestData;
    
    console.log('POST: Received data to update:', {
      name,
      email,
      wahlkreis,
      plz,
      landesverband,
      heimatbahnhof,
      hasProfilePicture: !!profilePictureUrl,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      userId
    });

    console.log('POST: About to fetch user record from Airtable...');
    
    // Determine which fields we need based on the operation
    const baseFields = ['Name', 'Email', 'Wahlkreis', 'PLZ', 'Landesverband', 'Heimatbahnhof', 'Profile Picture'];
    const fieldsToFetch = (currentPassword && newPassword) 
      ? [...baseFields, 'Password'] 
      : baseFields;
    
    console.log('POST: Fields to fetch:', fieldsToFetch);
    
    // First, find the user record - include all fields we might need to update
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        fields: fieldsToFetch, 
        maxRecords: 1,
      })
      .firstPage();

    console.log('POST: Airtable query completed, found', records.length, 'records');

    if (records.length === 0) {
      console.log('POST: No user found for userId:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = records[0];
    console.log('POST: Found user record with ID:', userRecord.id);
    
    const updateFields: any = {};

    console.log('POST: Processing password change...');
    // Handle password change
    if (currentPassword && newPassword) {
      console.log('POST: Password change requested');
      const storedPasswordHash = userRecord.get('Password') as string;
      
      if (!storedPasswordHash) {
        console.log('POST: No stored password hash found');
        return NextResponse.json({ error: 'Kein aktuelles Passwort gefunden' }, { status: 400 });
      }

      console.log('POST: Verifying current password...');
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedPasswordHash);
      if (!isCurrentPasswordValid) {
        console.log('POST: Current password validation failed');
        return NextResponse.json({ error: 'Das aktuelle Passwort ist falsch' }, { status: 400 });
      }

      console.log('POST: Current password verified, validating new password...');
      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        console.log('POST: New password validation failed:', passwordValidation.errors);
        return NextResponse.json({ 
          error: 'Das neue Passwort erfüllt nicht die Sicherheitsanforderungen',
          details: passwordValidation.errors 
        }, { status: 400 });
      }

      console.log('POST: Hashing new password...');
      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      updateFields['Password'] = hashedNewPassword;
      console.log('POST: Password hashed successfully');
    } else {
      console.log('POST: No password change requested');
    }

    console.log('POST: Processing other field updates...');
    // Update other fields that are provided
    if (name !== undefined && name !== null) {
      console.log('POST: Adding name to update:', name);
      updateFields['Name'] = name;
    }
    if (email !== undefined && email !== null) {
      console.log('POST: Adding email to update:', email);
      updateFields['Email'] = email;
    }
    if (wahlkreis !== undefined && wahlkreis !== null) {
      console.log('POST: Adding wahlkreis to update:', wahlkreis);
      updateFields['Wahlkreis'] = wahlkreis;
    }
    if (plz !== undefined && plz !== null) {
      console.log('POST: Adding plz to update:', plz);
      updateFields['PLZ'] = plz;
    }
    if (landesverband !== undefined && landesverband !== null) {
      console.log('POST: Adding landesverband to update:', landesverband);
      updateFields['Landesverband'] = landesverband;
    }
    if (heimatbahnhof !== undefined && heimatbahnhof !== null) {
      console.log('POST: Adding heimatbahnhof to update:', heimatbahnhof);
      updateFields['Heimatbahnhof'] = heimatbahnhof;
    }
    
    // Handle profile picture URL if provided
    if (profilePictureUrl) {
      console.log('POST: Adding profile picture to update');
      updateFields['Profile Picture'] = [{
        url: profilePictureUrl
      }];
    }

    console.log('POST: Fields to update:', updateFields);

    // Update the record only if there are fields to update
    if (Object.keys(updateFields).length > 0) {
      try {
        console.log('POST: Attempting Airtable update for record:', userRecord.id);
        console.log('POST: Update fields structure:', JSON.stringify(updateFields, null, 2));
        
        const updateResult = await base('Users').update([
          {
            id: userRecord.id,
            fields: updateFields
          }
        ]);
        console.log('POST: Update successful, result:', updateResult[0].id);
      } catch (updateError) {
        console.error('POST: Airtable update error:', updateError);
        console.error('POST: Error details:', {
          message: updateError instanceof Error ? updateError.message : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
          fieldsAttempted: updateFields,
          recordId: userRecord.id
        });
        
        // Check if it's a field validation error
        if (updateError instanceof Error && updateError.message.includes('INVALID_VALUE_FOR_COLUMN')) {
          return NextResponse.json({ 
            error: 'Ungültiger Wert für ein Feld. Möglicherweise stimmt der Landesverband nicht mit den verfügbaren Optionen überein.',
            details: updateError.message,
            fieldsAttempted: updateFields
          }, { status: 400 });
        }
        
        // Check for other specific Airtable errors
        if (updateError instanceof Error) {
          if (updateError.message.includes('INVALID_FIELD_NAME')) {
            return NextResponse.json({ 
              error: 'Ein Feldname ist ungültig.',
              details: updateError.message,
              fieldsAttempted: updateFields
            }, { status: 400 });
          }
          
          if (updateError.message.includes('RECORD_NOT_FOUND')) {
            return NextResponse.json({ 
              error: 'Benutzer-Datensatz nicht gefunden.',
              details: updateError.message
            }, { status: 404 });
          }
        }
        
        throw updateError; // Re-throw if it's not a recognized error
      }
    } else {
      console.log('POST: No fields to update');
    }

    console.log('POST: Preparing success response...');
    const responseMessage = updateFields['Password'] 
      ? 'Benutzerdaten und Passwort erfolgreich aktualisiert'
      : 'Benutzerdaten erfolgreich aktualisiert';

    console.log('POST: Sending success response');
    return NextResponse.json({ success: true, message: responseMessage });
  } catch (error) {
    console.error('POST: Top-level error in user-details:', error);
    console.error('POST: Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('POST: Error message:', error instanceof Error ? error.message : String(error));
    console.error('POST: Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    
    // Include more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      error: 'Fehler beim Aktualisieren der Benutzerdaten',
      details: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
} 