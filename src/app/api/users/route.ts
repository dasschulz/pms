import { NextResponse } from 'next/server';
import { base } from '@/lib/airtable';

export async function GET(request: Request) {
  try {
    const records = await base('Users')
      .select({
        filterByFormula: 'AND({Active}=TRUE(), {Role}="MdB")',
      })
      .firstPage();

    const users = records.map((record) => {
      const attachments = record.get('Profile Picture') as any[];
      const profilePictureUrl = attachments?.[0]?.url || null;
      return {
        id: record.get('UserID'),
        airtableId: record.id,
        name: record.get('Name'),
        email: record.get('Email'),
        profilePictureUrl,
        wahlkreis: record.get('Wahlkreis'),
        landesverband: record.get('Landesverband'),
      };
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 