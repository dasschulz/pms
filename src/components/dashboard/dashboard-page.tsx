import { DraggableDashboard } from "./draggable-dashboard";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function fetchUserPreferences(userId: string) {
  try {
    // Use the migrated user-preferences API endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/user-preferences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`, // Pass the user ID for server-side lookup
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }

    const data = await response.json();
    
    if (data.success && data.preferences) {
      return {
        widgetOrder: data.preferences.widget_order || ['weather', 'trains', 'activity'],
        activeWidgets: data.preferences.active_widgets || ['weather', 'trains', 'activity'],
        themePreference: data.preferences.theme_preference || 'system'
      };
    }

    // Return defaults if no preferences found
    return {
      widgetOrder: ['weather', 'trains', 'activity'],
      activeWidgets: ['weather', 'trains', 'activity'],
      themePreference: 'system' as const
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
  if (session?.user?.id) {
    preferences = await fetchUserPreferences(session.user.id);
  }

  return (
    <DraggableDashboard 
      userName={userName}
      initialPreferences={preferences}
    />
  );
}
