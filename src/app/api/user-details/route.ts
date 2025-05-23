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
        fields: ['Wahlkreis', 'PLZ', 'Profile Picture', 'Name', 'Email', 'Landesverband'], 
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

    console.log('GET: Retrieved user data:', {
      name,
      email,
      wahlkreis,
      plz,
      landesverband,
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
    const requestData = await req.json();
    const { name, email, wahlkreis, plz, landesverband, profilePictureUrl, currentPassword, newPassword } = requestData;
    
    console.log('POST: Received data to update:', {
      name,
      email,
      wahlkreis,
      plz,
      landesverband,
      hasProfilePicture: !!profilePictureUrl,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      userId
    });

    // First, find the user record - include all fields we might need to update
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        fields: ['Password', 'Name', 'Email', 'Wahlkreis', 'PLZ', 'Landesverband', 'Profile Picture'], 
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      console.log('POST: No user found for userId:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = records[0];
    const updateFields: any = {};

    // Handle password change
    if (currentPassword && newPassword) {
      const storedPasswordHash = userRecord.get('Password') as string;
      
      if (!storedPasswordHash) {
        return NextResponse.json({ error: 'Kein aktuelles Passwort gefunden' }, { status: 400 });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedPasswordHash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Das aktuelle Passwort ist falsch' }, { status: 400 });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return NextResponse.json({ 
          error: 'Das neue Passwort erfüllt nicht die Sicherheitsanforderungen',
          details: passwordValidation.errors 
        }, { status: 400 });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      updateFields['Password'] = hashedNewPassword;
    }

    // Update other fields that are provided
    if (name !== undefined && name !== null) updateFields['Name'] = name;
    if (email !== undefined && email !== null) updateFields['Email'] = email;
    if (wahlkreis !== undefined && wahlkreis !== null) updateFields['Wahlkreis'] = wahlkreis;
    if (plz !== undefined && plz !== null) updateFields['PLZ'] = plz;
    if (landesverband !== undefined && landesverband !== null) updateFields['Landesverband'] = landesverband;
    
    // Handle profile picture URL if provided
    if (profilePictureUrl) {
      updateFields['Profile Picture'] = [{
        url: profilePictureUrl
      }];
    }

    console.log('POST: Fields to update:', updateFields);

    // Update the record only if there are fields to update
    if (Object.keys(updateFields).length > 0) {
      const updateResult = await base('Users').update([
        {
          id: userRecord.id,
          fields: updateFields
        }
      ]);
      console.log('POST: Update successful, result:', updateResult[0].id);
    } else {
      console.log('POST: No fields to update');
    }

    const responseMessage = updateFields['Password'] 
      ? 'Benutzerdaten und Passwort erfolgreich aktualisiert'
      : 'Benutzerdaten erfolgreich aktualisiert';

    return NextResponse.json({ success: true, message: responseMessage });
  } catch (error) {
    console.error('Airtable API Error updating user details:', error);
    // Include more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Fehler beim Aktualisieren der Benutzerdaten',
      details: errorMessage 
    }, { status: 500 });
  }
} 