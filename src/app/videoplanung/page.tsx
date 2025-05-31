"use client";

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/page-layout';
import { VideoPlanningBoard } from '@/components/videoplanung/video-planning-board';
import { TaskModal } from '@/components/videoplanung/task-modal';
import { Button } from '@/components/ui/button';
import { Plus, List, Kanban } from 'lucide-react';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export default function VideoPlanungPage() {
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const { preferences, updateVideoplanungViewMode, isLoading: preferencesLoading, error: preferencesError, isUpdating } = useUserPreferences();
  
  // Track if we've initialized the view mode from preferences
  const [viewModeInitialized, setViewModeInitialized] = useState(false);
  
  // Simple initial state - will be set from database
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Sync local state with user preferences when they load
  useEffect(() => {
    if (!preferencesLoading && preferences && !viewModeInitialized) {
      const serverViewMode = preferences.videoplanungViewMode || 'list';
      setViewMode(serverViewMode);
      setViewModeInitialized(true);
    }
  }, [preferences, preferencesLoading, viewModeInitialized]);

  const handleViewModeChange = (newViewMode: 'list' | 'kanban') => {
    setViewMode(newViewMode);
    updateVideoplanungViewMode(newViewMode);
  };

  const headerActions = (
    <div className="flex flex-col items-end gap-3">
      <Button
        onClick={() => setIsNewTaskModalOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="mr-2 h-4 w-4" />
        Neue Aufgabe
      </Button>
      
      <div className="flex rounded-lg border bg-background p-1">
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleViewModeChange('list')}
          disabled={preferencesLoading}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'kanban' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleViewModeChange('kanban')}
          disabled={preferencesLoading}
        >
          <Kanban className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Videoplanung"
      description="Verwalte deine Video-Projekte von der Idee bis zur Veröffentlichung. Organisiere Aufgaben in verschiedenen Produktionsstadien und behalte den Überblick über deine Inhalte."
      headerActions={headerActions}
    >
      <VideoPlanningBoard viewMode={viewMode} />
      <TaskModal 
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        mode="create"
      />
    </PageLayout>
  );
} 