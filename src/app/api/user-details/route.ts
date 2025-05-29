import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSupabase } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string; // This is now the Supabase UUID
  
  // Validate UUID format to catch old Airtable IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error('User Details: Invalid user ID format (not UUID):', userId);
    return NextResponse.json({ 
      error: 'Invalid user ID format', 
      message: 'Please re-login to refresh your session',
      userId: userId,
      expectedFormat: 'UUID'
    }, { status: 400 });
  }
  
  console.log('GET: Fetching user data for userId:', userId);

  try {
    // Use authenticated Supabase client with proper RLS
    const supabase = await getAuthenticatedSupabase();
    
    const { data: userRecord, error } = await supabase
      .from('users')
      .select('wahlkreis, plz, profile_picture_url, name, email, landesverband, heimatbahnhof')
      .eq('id', userId)
      .single();

    if (error || !userRecord) {
      console.log('GET: No user found for userId:', userId, error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('GET: Retrieved user data:', {
      name: userRecord.name,
      email: userRecord.email,
      wahlkreis: userRecord.wahlkreis,
      plz: userRecord.plz,
      landesverband: userRecord.landesverband,
      heimatbahnhof: userRecord.heimatbahnhof,
      supabaseId: userId
    });

    return NextResponse.json({ 
      wahlkreis: userRecord.wahlkreis,
      plz: userRecord.plz,
      profilePictureUrl: userRecord.profile_picture_url,
      name: userRecord.name,
      email: userRecord.email,
      landesverband: userRecord.landesverband,
      heimatbahnhof: userRecord.heimatbahnhof,
      supabaseId: userId
    });
  } catch (error) {
    console.error('Supabase API Error fetching user details:', error);
    return NextResponse.json({ error: 'Failed to fetch user details from Supabase' }, { status: 500 });
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

  const userId = token.id as string; // This is now the Supabase UUID

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

    console.log('POST: About to fetch user record from Supabase...');
    
    // Use authenticated Supabase client with proper RLS
    const supabase = await getAuthenticatedSupabase();
    
    const { data: userRecord, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('POST: Supabase query completed');

    if (fetchError || !userRecord) {
      console.log('POST: No user found for userId:', userId, fetchError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('POST: Found user record with ID:', userRecord.id);
    
    const updateFields: any = {};

    console.log('POST: Processing password change...');
    // Handle password change - Simple plaintext for development environment
    if (currentPassword && newPassword) {
      console.log('POST: Password change requested');
      
      // Validate current password (simple plaintext comparison for dev)
      const { data: userWithPassword, error: passwordFetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

      if (passwordFetchError || !userWithPassword) {
        console.log('POST: Error fetching user password:', passwordFetchError);
        return NextResponse.json({ error: 'Fehler beim Abrufen der Benutzerdaten' }, { status: 500 });
      }

      // Check if current password matches (plaintext comparison for dev environment)
      if (userWithPassword.password !== currentPassword) {
        console.log('POST: Current password does not match');
        return NextResponse.json({ error: 'Das aktuelle Passwort ist nicht korrekt' }, { status: 400 });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        console.log('POST: New password validation failed:', passwordValidation.errors);
        return NextResponse.json({ 
          error: 'Das neue Passwort erfüllt nicht die Anforderungen',
          details: passwordValidation.errors
        }, { status: 400 });
      }

      // Add new password to update fields (plaintext for dev environment)
      updateFields['password'] = newPassword;
      console.log('POST: Added password to update fields');
    } else {
      console.log('POST: No password change requested');
    }

    console.log('POST: Processing other field updates...');
    // Update other fields that are provided
    if (name !== undefined && name !== null) {
      console.log('POST: Adding name to update:', name);
      updateFields['name'] = name;
    }
    if (email !== undefined && email !== null) {
      console.log('POST: Adding email to update:', email);
      updateFields['email'] = email;
    }
    if (wahlkreis !== undefined && wahlkreis !== null) {
      console.log('POST: Adding wahlkreis to update:', wahlkreis);
      updateFields['wahlkreis'] = wahlkreis;
    }
    if (plz !== undefined && plz !== null) {
      console.log('POST: Adding plz to update:', plz);
      updateFields['plz'] = plz;
    }
    if (landesverband !== undefined && landesverband !== null) {
      console.log('POST: Adding landesverband to update:', landesverband);
      updateFields['landesverband'] = landesverband;
    }
    if (heimatbahnhof !== undefined && heimatbahnhof !== null) {
      console.log('POST: Adding heimatbahnhof to update:', heimatbahnhof);
      updateFields['heimatbahnhof'] = heimatbahnhof;
    }
    
    // Handle profile picture URL if provided
    if (profilePictureUrl) {
      console.log('POST: Adding profile picture to update');
      updateFields['profile_picture_url'] = profilePictureUrl;
    }

    console.log('POST: Fields to update:', updateFields);

    // Update the record only if there are fields to update
    if (Object.keys(updateFields).length > 0) {
      try {
        console.log('POST: Attempting Supabase update for record:', userRecord.id);
        console.log('POST: Update fields structure:', JSON.stringify(updateFields, null, 2));
        
        const { data: updateResult, error: updateError } = await supabase
          .from('users')
          .update(updateFields)
          .eq('id', userRecord.id)
          .select()
          .single();

        if (updateError) {
          console.error('POST: Supabase update error:', updateError);
          throw updateError;
        }

        console.log('POST: Update successful, result:', updateResult.id);
      } catch (updateError) {
        console.error('POST: Supabase update error:', updateError);
        console.error('POST: Error details:', {
          message: updateError instanceof Error ? updateError.message : String(updateError),
          fieldsAttempted: updateFields,
          recordId: userRecord.id
        });
        
        // Handle Supabase-specific errors
        if (updateError instanceof Error) {
          if (updateError.message.includes('duplicate key value')) {
            return NextResponse.json({ 
              error: 'Ein Wert ist bereits vorhanden (z.B. E-Mail-Adresse).',
              details: updateError.message,
              fieldsAttempted: updateFields
            }, { status: 400 });
          }
          
          if (updateError.message.includes('violates check constraint')) {
            return NextResponse.json({ 
              error: 'Ungültiger Wert für ein Feld.',
              details: updateError.message,
              fieldsAttempted: updateFields
            }, { status: 400 });
          }
        }
        
        throw updateError; // Re-throw if it's not a recognized error
      }
    } else {
      console.log('POST: No fields to update');
    }

    console.log('POST: Preparing success response...');
    const responseMessage = updateFields['password'] 
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