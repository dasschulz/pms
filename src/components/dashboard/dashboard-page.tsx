import { DraggableDashboard } from "./draggable-dashboard";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function fetchUserPreferences(userId: string) {
  try {
    // Use relative URL for server-side API calls to avoid NEXTAUTH_URL dependency
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/user-preferences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`, // Pass the user ID for server-side lookup
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch preferences, status:', response.status);
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
