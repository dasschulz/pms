import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;

  try {
    // First, get the user's Airtable record ID
    const userRecords = await base('Users')
      .select({
        filterByFormula: `{UserID} = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userAirtableId = userRecords[0].id;

    // Generate unique token for the form link
    const linkToken = crypto.randomBytes(32).toString('hex');
    
    // Create the form link entry in Airtable
    const record = await base('Touranfragen_Links').create({
      'UserID': [userAirtableId], // Use array of record IDs for foreign key
      'Token': linkToken,
      'Created': new Date().toISOString().split('T')[0], // Use YYYY-MM-DD format for date field
      'Active': true,
    });

    // Generate the external form URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const formLink = `${baseUrl}/tour-form/${linkToken}`;

    return NextResponse.json({ 
      link: formLink,
      token: linkToken,
      recordId: record.id 
    });
  } catch (error) {
    console.error('Airtable API Error generating form link:', error);
    return NextResponse.json({ error: 'Failed to generate form link' }, { status: 500 });
  }
} 