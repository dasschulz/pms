import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { base } from '@/lib/airtable';

const FRAKTIONSRUF_COUNTER_TABLE_ID = 'tblMfoWD86aQnZ9Ll';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.isFraktionsvorstand || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Nicht autorisiert oder keine Berechtigung' },
        { status: 401 }
      );
    }

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

    // If SMS is selected, check the limit and log it in FraktionsrufCounter table
    if (sendSMS) {
      let currentSmsCount = 0;
      await base(FRAKTIONSRUF_COUNTER_TABLE_ID)
        .select({
          filterByFormula: `AND({Month} = ${currentMonth}, {Year} = ${currentYear})`,
        })
        .eachPage((records, fetchNextPage) => {
          currentSmsCount += records.length;
          fetchNextPage();
        });

      if (currentSmsCount >= 6) {
        return NextResponse.json(
          { success: false, error: 'SMS-Limit für diesen Monat erreicht' },
          { status: 400 }
        );
      }

      // Log the SMS sending action in FraktionsrufCounter table
      // The 'Count' field in FraktionsrufCounter is an Airtable Count-type field and will auto-update.
      // 'FraktionsrufID' is an Auto Number.
      // 'UserID (from Assignee)' is a lookup and will auto-populate.
      const logResult = await base(FRAKTIONSRUF_COUNTER_TABLE_ID).create([
        {
          fields: {
            Month: currentMonth,
            Year: currentYear,
            Assignee: [session.user.id], // Link to the user who sent it. Must be an array of record IDs.
            // 'Created' field in Airtable for FraktionsrufCounter is a Date type.
            // Let Airtable handle its default creation timestamp or set it explicitly if specific format needed.
            // For simplicity, we'll let Airtable set it based on record creation time.
            // If your 'Created' field needs a specific format (e.g. just YYYY-MM-DD), adjust as needed.
          },
        },
      ]);
      if (!logResult || logResult.length === 0) {
        throw new Error('Failed to log SMS in FraktionsrufCounter table');
      }
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

    return NextResponse.json({
      success: true,
      message: 'Fraktionsruf-Aktion verarbeitet (Sendefunktionen sind Platzhalter)',
    });
  } catch (error) {
    console.error('Error submitting fraktionsruf:', error);
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