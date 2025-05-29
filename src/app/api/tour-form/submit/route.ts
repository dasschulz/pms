import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, performSpamCheck } from '@/lib/spam-protection';

// Create a service role client that bypasses RLS for this public API
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  try {
    console.log('Tour Form Submit: Starting tour request submission');
    
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(req);
    if (!rateLimitResult.allowed) {
      console.log('Tour Form Submit: Rate limit exceeded');
      return NextResponse.json({ 
        error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' 
      }, { status: 429 });
    }
    
    const requestData = await req.json();
    const {
      token,
      userId,
      kreisverband,
      landesverband,
      kandidatName,
      zeitraum1Von,
      zeitraum1Bis,
      zeitraum2Von,
      zeitraum2Bis,
      zeitraum3Von,
      zeitraum3Bis,
      themen,
      video,
      ansprechpartner1Name,
      ansprechpartner1Phone,
      ansprechpartner2Name,
      ansprechpartner2Phone,
      programmvorschlag,
      startTime,
      // Honeypot fields
      website,
      phone_number,
      company,
      fax
    } = requestData;

    // Spam protection check
    const spamResult = performSpamCheck({
      kreisverband,
      landesverband,
      kandidatName,
      themen,
      ansprechpartner1Name,
      ansprechpartner2Name,
      website,
      phone_number,
      company,
      fax
    }, startTime);
    
    if (spamResult.isSpam) {
      console.log('Tour Form Submit: Spam detected:', spamResult.reason);
      return NextResponse.json({ 
        error: 'Die Übermittlung konnte nicht verarbeitet werden. Bitte überprüfen Sie Ihre Eingaben.' 
      }, { status: 400 });
    }

    // Log suspicious but not blocked submissions
    if (spamResult.score > 40) {
      console.warn('Tour Form Submit: Suspicious submission (score: ' + spamResult.score + '):', spamResult.reason);
    }

    console.log('Tour Form Submit: Verifying token:', token);

    // Verify the token is valid and active using admin client to bypass RLS
    const { data: linkRecords, error: linkError } = await supabaseAdmin
      .from('touranfragen_links')
      .select('*')
      .eq('token', token)
      .eq('active', true)
      .limit(1);

    if (linkError) {
      console.error('Tour Form Submit: Error verifying token:', linkError);
      return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 });
    }

    if (!linkRecords || linkRecords.length === 0) {
      console.log('Tour Form Submit: Invalid or expired token:', token);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const linkRecord = linkRecords[0];
    console.log('Tour Form Submit: Token verified, creating tour request for user:', userId);

    // Combine time periods into a readable format
    const zeitraume = [];
    if (zeitraum1Von && zeitraum1Bis) {
      zeitraume.push(`${formatDate(zeitraum1Von)} - ${formatDate(zeitraum1Bis)}`);
    }
    if (zeitraum2Von && zeitraum2Bis) {
      zeitraume.push(`${formatDate(zeitraum2Von)} - ${formatDate(zeitraum2Bis)}`);
    }
    if (zeitraum3Von && zeitraum3Bis) {
      zeitraume.push(`${formatDate(zeitraum3Von)} - ${formatDate(zeitraum3Bis)}`);
    }

    // Prepare tour request data for Supabase
    const tourRequestData = {
      user_id: userId,
      kreisverband: kreisverband,
      landesverband: landesverband,
      kandidat_name: kandidatName,
      zeitraum_von: zeitraum1Von || null,
      zeitraum_bis: zeitraum1Bis || null,
      zeitraum_alle: zeitraume.join('\n'),
      themen: themen,
      video: video === 'Ja',
      ansprechpartner_1_name: ansprechpartner1Name,
      ansprechpartner_1_phone: ansprechpartner1Phone,
      ansprechpartner_2_name: ansprechpartner2Name || null,
      ansprechpartner_2_phone: ansprechpartner2Phone || null,
      programmvorschlag: programmvorschlag === 'füge ich an' ? 'füge ich an' : 'möchte ich mit dem Büro klären',
      status: 'Neu',
      token_used: token,
      spam_score: spamResult.score,
    };

    // Create the tour request record in Supabase using admin client to bypass RLS
    const { data: tourRequestRecord, error: createError } = await supabaseAdmin
      .from('touranfragen')
      .insert(tourRequestData)
      .select()
      .single();

    if (createError) {
      console.error('Tour Form Submit: Error creating tour request:', createError);
      return NextResponse.json({ error: 'Failed to submit tour request' }, { status: 500 });
    }

    console.log('Tour Form Submit: Tour request created:', tourRequestRecord.id);

    // Hard delete the used token/link after successful submission using admin client
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('touranfragen_links')
        .delete()
        .eq('id', linkRecord.id);

      if (deleteError) {
        console.error('Tour Form Submit: Error deleting form link:', deleteError);
        // Don't fail the entire request if link deletion fails
      } else {
        console.log('Tour Form Submit: Form link deleted after successful submission:', linkRecord.id);
      }
    } catch (deleteError) {
      console.error('Tour Form Submit: Exception while deleting form link:', deleteError);
      // Don't fail the entire request if link deletion fails
    }

    return NextResponse.json({ 
      success: true, 
      requestId: tourRequestRecord.id 
    });
  } catch (error) {
    console.error('Tour Form Submit: Supabase error submitting tour request:', error);
    return NextResponse.json({ error: 'Failed to submit tour request' }, { status: 500 });
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE');
} 