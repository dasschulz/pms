import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

interface UserPreferences {
  userId: string;
  widgetOrder: string[];
  activeWidgets: string[];
  themePreference: 'light' | 'dark' | 'system';
  videoplanungViewMode?: 'list' | 'kanban';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session (should be Supabase UUID now)
    const userId = session.user.id;
    
    if (!userId) {
      console.log('No user ID found in session for:', session.user.email);
      return NextResponse.json({ error: 'User session invalid' }, { status: 401 });
    }

    // Validate UUID format to catch old Airtable IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('User Preferences: Invalid user ID format (not UUID):', userId);
      return NextResponse.json({ 
        error: 'Invalid user ID format', 
        message: 'Please re-login to refresh your session',
        userId: userId,
        expectedFormat: 'UUID'
      }, { status: 400 });
    }

    console.log('Fetching preferences for user ID:', userId);

    // Temporarily use admin client until RLS policies are properly configured
    const { data: prefRecords, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('last_update', { ascending: false })
      .limit(1);

    const prefRecord = prefRecords?.[0];

    if (error || !prefRecord) {
      console.log('No preferences found for user, returning defaults:', error?.message);
      // Return default preferences if none found
      return NextResponse.json({
        widgetOrder: ['weather', 'trains', 'latest-speech', 'activity'],
        activeWidgets: ['weather', 'trains', 'latest-speech', 'activity'],
        themePreference: 'system',
        videoplanungViewMode: 'list'
      });
    }

    console.log('Found preferences record:', prefRecord.id);

    return NextResponse.json({
      widgetOrder: prefRecord.widget_order || ['weather', 'trains', 'latest-speech', 'activity'],
      activeWidgets: prefRecord.active_widgets || ['weather', 'trains', 'latest-speech', 'activity'],
      themePreference: prefRecord.theme_preference || 'system',
      videoplanungViewMode: prefRecord.videoplanung_view_mode || 'list'
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

    const { widgetOrder, activeWidgets, themePreference, videoplanungViewMode } = await request.json();

    // Get user ID from session (should be Supabase UUID now)
    const userId = session.user.id;
    
    if (!userId) {
      console.log('No user ID found in session for:', session.user.email);
      return NextResponse.json({ error: 'User session invalid' }, { status: 401 });
    }

    // Validate UUID format to catch old Airtable IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('User Preferences: Invalid user ID format (not UUID):', userId);
      return NextResponse.json({ 
        error: 'Invalid user ID format', 
        message: 'Please re-login to refresh your session',
        userId: userId,
        expectedFormat: 'UUID'
      }, { status: 400 });
    }

    console.log('🔄 Saving preferences for user:', session.user.email, 'ID:', userId);

    // Get the most recent record to update
    const { data: existingRecords, error: fetchError } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('last_update', { ascending: false })
      .limit(1);

    const existingRecord = existingRecords?.[0];

    // Prepare update data - only include fields that are being updated
    const updateData: any = {
      last_update: new Date().toISOString()
    };
    
    if (widgetOrder !== undefined) updateData.widget_order = widgetOrder;
    if (activeWidgets !== undefined) updateData.active_widgets = activeWidgets;
    if (themePreference !== undefined) updateData.theme_preference = themePreference;
    if (videoplanungViewMode !== undefined) updateData.videoplanung_view_mode = videoplanungViewMode;

    if (existingRecord) {
      // Update existing record
      console.log('🔄 Updating existing preference record:', existingRecord.id);
      
      const { error: updateError } = await supabaseAdmin
        .from('user_preferences')
        .update(updateData)
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('❌ Error updating preferences:', updateError);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
      }

      console.log('✅ Updated existing record successfully');
    } else {
      // Create new record only if none exists
      console.log('➕ Creating new preference record (no existing record found)');
      
      const { error: insertError } = await supabaseAdmin
        .from('user_preferences')
        .insert({
          user_id: userId,
          widget_order: widgetOrder,
          active_widgets: activeWidgets,
          theme_preference: themePreference,
          videoplanung_view_mode: videoplanungViewMode,
          last_update: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error creating preferences:', insertError);
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }

      console.log('✅ Created new record successfully');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error saving user preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 