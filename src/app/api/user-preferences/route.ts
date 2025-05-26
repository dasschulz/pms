import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { base } from '@/lib/airtable';

interface UserPreferences {
  userId: string;
  widgetOrder: string[];
  activeWidgets: string[];
  themePreference: 'light' | 'dark' | 'system';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, find the user record by email in Users table
    const userRecords = await base('Users')
      .select({
        filterByFormula: `{Email} = "${session.user.email}"`,
        maxRecords: 1
      })
      .firstPage();

    if (userRecords.length === 0) {
      // User not found, return defaults
      return NextResponse.json({
        widgetOrder: ['weather', 'trains', 'latest-speech', 'activity'],
        activeWidgets: ['weather', 'trains', 'latest-speech', 'activity'],
        themePreference: 'system'
      });
    }

    const userRecordId = userRecords[0].id;

    // Now find user preferences by linked user record
    const prefRecords = await base('User-Preferences')
      .select({
        filterByFormula: `FIND("${userRecordId}", ARRAYJOIN({Name})) > 0`,
        maxRecords: 1
      })
      .firstPage();

    if (prefRecords.length === 0) {
      // Return default preferences if none found
      return NextResponse.json({
        widgetOrder: ['weather', 'trains', 'latest-speech', 'activity'],
        activeWidgets: ['weather', 'trains', 'latest-speech', 'activity'],
        themePreference: 'system'
      });
    }

    const record = prefRecords[0];
    return NextResponse.json({
      widgetOrder: JSON.parse(record.get('Widget Order') as string || '["weather", "trains", "latest-speech", "activity"]'),
      activeWidgets: JSON.parse(record.get('Active Widgets') as string || '["weather", "trains", "latest-speech", "activity"]'),
      themePreference: (record.get('Theme Preference') as 'light' | 'dark' | 'system') || 'system'
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { widgetOrder, activeWidgets, themePreference } = await request.json();

    console.log('🔄 Saving preferences for user:', session.user.email);

    // First, find the user record by email in Users table
    const userRecords = await base('Users')
      .select({
        filterByFormula: `{Email} = "${session.user.email}"`,
        maxRecords: 1
      })
      .firstPage();

    if (userRecords.length === 0) {
      console.log('❌ User not found in Users table:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecordId = userRecords[0].id;
    console.log('✅ Found user record ID:', userRecordId);

    // Check if user preferences already exist - get ALL matching records to handle duplicates
    const existingRecords = await base('User-Preferences')
      .select({
        filterByFormula: `FIND("${userRecordId}", ARRAYJOIN({Name})) > 0`
      })
      .firstPage();

    console.log('🔍 Found existing preference records:', existingRecords.length);

    const preferenceData = {
      'Name': [userRecordId], // Link to user record
      'Widget Order': JSON.stringify(widgetOrder),
      'Active Widgets': JSON.stringify(activeWidgets),
      'Theme Preference': themePreference,
      'Last Update': new Date().toISOString().split('T')[0] // Date format YYYY-MM-DD
    };

    if (existingRecords.length > 0) {
      // If multiple records exist, clean up duplicates
      if (existingRecords.length > 1) {
        console.log('⚠️ Found duplicate records, cleaning up...', existingRecords.length);
        
        // Keep the first record, delete the rest
        const recordToKeep = existingRecords[0];
        const recordsToDelete = existingRecords.slice(1);
        
        if (recordsToDelete.length > 0) {
          console.log('🗑️ Deleting', recordsToDelete.length, 'duplicate records');
          try {
            await base('User-Preferences').destroy(recordsToDelete.map(r => r.id));
            console.log('✅ Deleted duplicate records successfully');
          } catch (error) {
            console.error('❌ Error deleting duplicates:', error);
          }
        }
        
        // Update the remaining record
        console.log('🔄 Updating remaining preference record:', recordToKeep.id);
        await base('User-Preferences').update([
          {
            id: recordToKeep.id,
            fields: preferenceData
          }
        ]);
        console.log('✅ Updated existing record successfully');
      } else {
        // Single existing record - normal update
        console.log('🔄 Updating existing preference record:', existingRecords[0].id);
        await base('User-Preferences').update([
          {
            id: existingRecords[0].id,
            fields: preferenceData
          }
        ]);
        console.log('✅ Updated existing record successfully');
      }
    } else {
      // No existing record found - create new one
      console.log('➕ Creating new preference record (first time for this user)');
      const newRecords = await base('User-Preferences').create([
        {
          fields: preferenceData
        }
      ]);
      console.log('✅ Created new record:', newRecords[0].id);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error saving user preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 