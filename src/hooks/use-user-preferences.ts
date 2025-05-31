import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserPreferences {
  widgetOrder: string[];
  activeWidgets: string[];
  themePreference: 'light' | 'dark' | 'system';
  videoplanungViewMode: 'list' | 'kanban';
}

async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await fetch('/api/user-preferences');
  if (!response.ok) {
    throw new Error(`Failed to fetch user preferences: ${response.statusText}`);
  }
  return response.json();
}

async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
  const response = await fetch('/api/user-preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update user preferences: ${response.statusText}`);
  }
}

export function useUserPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-preferences'],
    queryFn: fetchUserPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  const updateVideoplanungViewMode = (viewMode: 'list' | 'kanban') => {
    console.log('🔄 Attempting to update videoplanung view mode to:', viewMode);
    mutation.mutate(
      { videoplanungViewMode: viewMode },
      {
        onSuccess: () => {
          console.log('✅ Successfully updated videoplanung view mode to:', viewMode);
        },
        onError: (error) => {
          console.error('❌ Failed to update videoplanung view mode:', error);
          console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          });
        }
      }
    );
  };

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateVideoplanungViewMode,
    isUpdating: mutation.isPending,
  };
} 