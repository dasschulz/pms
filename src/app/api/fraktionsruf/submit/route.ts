import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isFraktionsvorstand || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Nicht autorisiert oder keine Berechtigung' },
        { status: 401 }
      );
    }

    const userId = session.user.id; // Supabase UUID
    console.log('Fraktionsruf Submit: Processing request for user:', userId);

    // webappReminder is now a field collected from the form
    const { mdbImPlenum, thema, topZeit, sendMail, sendSMS, webappReminder } = await request.json();

    if (!mdbImPlenum || !thema || !topZeit) {
      return NextResponse.json(
        { success: false, error: 'Bitte füllen Sie alle Pflichtfelder aus' },
        { status: 400 }
      );
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();

    console.log('Fraktionsruf Submit: Current period:', { month: currentMonth, year: currentYear });

    // If SMS is selected, check the limit and log it in fraktionsruf_counter table
    if (sendSMS) {
      // Check current SMS count for this month and year
      const { data: currentEntries, error: countError } = await supabase
        .from('fraktionsruf_counter')
        .select('id')
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (countError) {
        console.error('Fraktionsruf Submit: Error checking SMS count:', countError);
        return NextResponse.json({ error: 'Fehler beim Prüfen des SMS-Limits' }, { status: 500 });
      }

      const currentSmsCount = currentEntries?.length || 0;
      console.log('Fraktionsruf Submit: Current SMS count:', currentSmsCount);

      if (currentSmsCount >= 6) {
        return NextResponse.json(
          { success: false, error: 'SMS-Limit für diesen Monat erreicht' },
          { status: 400 }
        );
      }

      // Log the SMS sending action in fraktionsruf_counter table
      const { data: logResult, error: logError } = await supabase
        .from('fraktionsruf_counter')
        .insert({
          user_id: userId,
          month: currentMonth,
          year: currentYear,
        })
        .select()
        .single();

      if (logError) {
        console.error('Fraktionsruf Submit: Error logging SMS usage:', logError);
        return NextResponse.json({ error: 'Failed to log SMS in counter table' }, { status: 500 });
      }

      console.log('Fraktionsruf Submit: SMS usage logged:', logResult.id);
    }

    // Placeholder for actual sending logic (Mail, SMS, WebApp Toast)
    // This logic needs to be implemented based on your chosen services/methods
    if (sendMail) {
      // TODO: Implement actual email sending logic
      console.log('Placeholder: Sending Mail...', { mdbImPlenum, thema, topZeit });
    }
    if (sendSMS) {
      // TODO: Implement actual SMS sending logic (e.g., via Twilio, Vonage)
      // This would happen *after* successfully logging/checking the limit.
      console.log('Placeholder: Sending SMS...', { mdbImPlenum, thema, topZeit });
    }
    if (webappReminder) {
      // TODO: Implement actual WebApp toast notification logic (e.g., via WebSockets, Pusher)
      console.log('Placeholder: Sending WebApp Reminder...', { mdbImPlenum, thema, topZeit });
    }

    console.log('Fraktionsruf Submit: Action processed successfully');

    return NextResponse.json({
      success: true,
      message: 'Fraktionsruf-Aktion verarbeitet (Sendefunktionen sind Platzhalter)',
    });
  } catch (error) {
    console.error('Fraktionsruf Submit: Error in submit:', error);
    let errorMessage = 'Fehler bei der Verarbeitung des Fraktionsrufs';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 