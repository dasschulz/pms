import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { generateMinorInquiry } from '@/ai/flows/generate-minor-inquiry';

export async function POST(request: NextRequest) {
  try {
    const { topic, context, desiredOutcome, targetAudience } = await request.json();
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    // Map session.user.id (autoNumber) to Airtable record id
    const userRecords = await base('Users')
      .select({ filterByFormula: `{UserID} = '${session.user.id}'`, maxRecords: 1 })
      .firstPage();
    if (userRecords.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userAirtableId = userRecords[0].id;

    // Validate required fields
    if (!topic || !context || !desiredOutcome || !targetAudience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create initial Airtable record
    const createResponse = await base('KA-Generator').create([
      {
        fields: {
          Titel: topic,
          Prompt: desiredOutcome,
          'Beteiligte MdB': targetAudience,
          Hintergrundinfos: context,
          'User-ID': userAirtableId,
          Signatur: `Berlin, den ${new Date().toLocaleDateString('de-DE')} <br> Heidi Reichinnek, Sören Pellmann und Fraktion`,
          Vorblatt_Heading: 'Vorblatt zur internen Verwendung',
        },
      },
    ]);
    const record = Array.isArray(createResponse) ? createResponse[0] : createResponse;
    const recordId = record.id;

    // Generate inquiry via AI flow
    const aiResult = await generateMinorInquiry({ topic, context, desiredOutcome, targetAudience });

    // Update record with AI result
    await base('KA-Generator').update([
      {
        id: recordId,
        fields: {
          Titel: aiResult.title,
          'Result final': aiResult.inquiryText,
        },
      },
    ]);

    return NextResponse.json({ id: recordId, ...aiResult });
  } catch (error) {
    console.error('Error in minor-inquiry/generate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 