import { DraggableDashboard } from "./draggable-dashboard";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

async function fetchUserPreferences(userId: string) {
  try {
    console.log('Dashboard: Fetching preferences for user ID:', userId);

    // Use the same logic as the API: get most recent record
    const { data: prefRecords, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('last_update', { ascending: false })
      .limit(1);

    const prefRecord = prefRecords?.[0];

    if (error || !prefRecord) {
      console.log('Dashboard: No preferences found for user, returning defaults:', error?.message);
      // Return default preferences if none found
      return {
        widgetOrder: ['weather', 'trains', 'latest-speech', 'dreh', 'kommunikationslinien', 'activity'],
        activeWidgets: ['weather', 'trains', 'latest-speech', 'dreh', 'kommunikationslinien', 'activity'],
        themePreference: 'system' as const
      };
    }

    console.log('Dashboard: Found preferences record:', prefRecord.id);

    return {
      widgetOrder: prefRecord.widget_order || ['weather', 'trains', 'latest-speech', 'dreh', 'kommunikationslinien', 'activity'],
      activeWidgets: prefRecord.active_widgets || ['weather', 'trains', 'latest-speech', 'dreh', 'kommunikationslinien', 'activity'],
      themePreference: prefRecord.theme_preference || 'system' as const
    };

  } catch (error) {
    console.error('Dashboard: Error fetching user preferences:', error);
    // Return defaults if query fails
    return {
      widgetOrder: ['weather', 'trains', 'latest-speech', 'dreh', 'kommunikationslinien', 'activity'],
      activeWidgets: ['weather', 'trains', 'latest-speech', 'dreh', 'kommunikationslinien', 'activity'],
      themePreference: 'system' as const
    };
  }
}

export async function DashboardPage() {
  // Get authenticated user from NextAuth
  const session = await getServerSession(authOptions);
  
  // Add null safety checks
  if (!session || !session.user) {
    console.error('No valid session found in DashboardPage');
    return (
      <DraggableDashboard 
        userName="Unbekannte/r Nutzer/in"
        initialPreferences={undefined}
      />
    );
  }
  
  const userName = session.user.name ?? 'Unbekannte/r Nutzer/in';

  // Fetch user preferences if authenticated and user ID is valid
  let preferences = undefined;
  if (session.user.id && typeof session.user.id === 'string' && session.user.id.length > 0) {
    preferences = await fetchUserPreferences(session.user.id);
  } else {
    console.error('Invalid or missing user ID in session:', session.user.id);
  }

  return (
    <DraggableDashboard 
      userName={userName}
      initialPreferences={preferences}
    />
  );
}
