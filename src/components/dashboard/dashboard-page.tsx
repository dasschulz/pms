import { DraggableDashboard } from "./draggable-dashboard";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { base } from '@/lib/airtable';

async function fetchUserPreferences(userEmail: string) {
  try {
    // First, find the user record by email in Users table
    const userRecords = await base('Users')
      .select({
        filterByFormula: `{Email} = "${userEmail}"`,
        maxRecords: 1
      })
      .firstPage();

    if (userRecords.length === 0) {
      // User not found, return defaults
      return {
        widgetOrder: ['weather', 'trains', 'activity'],
        activeWidgets: ['weather', 'trains', 'activity'],
        themePreference: 'system' as const
      };
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
      return {
        widgetOrder: ['weather', 'trains', 'activity'],
        activeWidgets: ['weather', 'trains', 'activity'],
        themePreference: 'system' as const
      };
    }

    const record = prefRecords[0];
    return {
      widgetOrder: JSON.parse(record.get('Widget Order') as string || '["weather", "trains", "activity"]'),
      activeWidgets: JSON.parse(record.get('Active Widgets') as string || '["weather", "trains", "activity"]'),
      themePreference: (record.get('Theme Preference') as 'light' | 'dark' | 'system') || 'system'
    };

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    // Return defaults if API fails
    return {
      widgetOrder: ['weather', 'trains', 'activity'],
      activeWidgets: ['weather', 'trains', 'activity'],
      themePreference: 'system' as const
    };
  }
}

export async function DashboardPage() {
  // Get authenticated user from NextAuth
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? 'Unbekannte/r Nutzer/in';

  // Fetch user preferences if authenticated
  let preferences = undefined;
  if (session?.user?.email) {
    preferences = await fetchUserPreferences(session.user.email);
  }

  return (
    <DraggableDashboard 
      userName={userName}
      initialPreferences={preferences}
    />
  );
}
