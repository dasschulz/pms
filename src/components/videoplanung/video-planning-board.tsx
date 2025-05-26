"use client";

import { useState } from "react";
import { TaskStatusTable } from "./task-status-table";
import { TaskModal } from "./task-modal";
import { VideoPlanningBoardSkeleton } from "./video-planning-skeleton";
import { useTasks } from "@/hooks/use-tasks";
import type { Task } from "@/types/videoplanung";
import { statusOrder } from "@/types/videoplanung";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Video } from "lucide-react";

export function VideoPlanningBoard() {
  const { tasks, isLoading, error, updateTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<string | null>(null);

  const groupedTasks = statusOrder.reduce((acc, status) => {
    acc[status] = tasks?.filter((task: Task) => task.nextJob === status) || [];
    return acc;
  }, {} as Record<string, Task[]>);

  // Check if there are any tasks at all
  const totalTasks = tasks?.length || 0;

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateSubtask = (parentTaskId: string) => {
    setParentTaskForSubtask(parentTaskId);
    setIsNewTaskModalOpen(true);
  };

  const handleTaskMove = async (taskId: string, newStatus: string, newSortOrder: number) => {
    try {
      await updateTask(taskId, { 
        nextJob: newStatus as Task['nextJob'],
        sortOrder: newSortOrder
      });
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('Updating task:', taskId, 'with updates:', updates);
      
      // Convert Task partial to UpdateTaskData format
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.detailview !== undefined) updateData.detailview = updates.detailview;
      if (updates.isSubtask !== undefined) updateData.isSubtask = updates.isSubtask;
      if (updates.parentTaskId !== undefined) {
        // Convert string[] | null to string | null (take first item if array)
        updateData.parentTaskId = Array.isArray(updates.parentTaskId) 
          ? updates.parentTaskId[0] || null 
          : updates.parentTaskId;
      }
      if (updates.fälligkeitsdatum !== undefined) updateData.fälligkeitsdatum = updates.fälligkeitsdatum;
      if (updates.nextJob !== undefined) updateData.nextJob = updates.nextJob;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.publishDate !== undefined) updateData.publishDate = updates.publishDate;
      if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;

      console.log('Converted update data:', updateData);
      
      const result = await updateTask(taskId, updateData);
      console.log('Task update result:', result);
      console.log('Current tasks after update:', tasks?.length);
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error; // Re-throw to trigger toast notification
    }
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleCloseNewTaskModal = () => {
    setIsNewTaskModalOpen(false);
    setParentTaskForSubtask(null);
  };

  if (isLoading) {
    return <VideoPlanningBoardSkeleton />;
  }

  if (error) {
    // Check if it's a table not found error
    const isTableMissing = error instanceof Error && 
      (error.message.includes('TaskManager table not found') || 
       error.message.includes('Table not found'));
    
    if (isTableMissing) {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Video className="w-16 h-16 text-gray-400 dark:text-muted-foreground mx-auto mb-6" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Videoplanung Setup erforderlich
              </h3>
              <p className="text-gray-500 dark:text-muted-foreground mb-6">
                Die TaskManager-Tabelle wurde noch nicht in Airtable erstellt. 
                Bitte erstelle die Tabelle mit den erforderlichen Feldern, 
                um die Videoplanung zu nutzen.
              </p>
              <div className="text-sm text-gray-400 dark:text-muted-foreground">
                Siehe: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">taskmanager_schema.md</code> für Details
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold mb-2">Fehler beim Laden der Aufgaben</h3>
          <p className="text-sm">
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left bg-gray-100 p-4 rounded">
              <summary className="cursor-pointer font-medium">Technische Details</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Seite neu laden
        </button>
      </div>
    );
  }

  // Show empty state if no tasks exist
  if (totalTasks === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 dark:text-muted-foreground mx-auto mb-6" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Einträge vorhanden
            </h3>
            <p className="text-gray-500 dark:text-muted-foreground mb-6">
              Erstelle jetzt deinen ersten Videoplan und organisiere deine Video-Projekte von der Idee bis zur Veröffentlichung.
            </p>
            <Button 
              onClick={() => setIsNewTaskModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Erste Aufgabe erstellen
            </Button>
          </CardContent>
        </Card>
        
        <TaskModal 
          isOpen={isNewTaskModalOpen}
          onClose={handleCloseNewTaskModal}
          mode="create"
          parentTaskId={parentTaskForSubtask || undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {statusOrder.map((status) => (
        <TaskStatusTable
          key={status}
          status={status}
          tasks={groupedTasks[status]}
          onTaskClick={handleTaskClick}
          onTaskMove={handleTaskMove}
          onTaskUpdate={handleTaskUpdate}
          onCreateSubtask={handleCreateSubtask}
          isCollapsed={status === 'Erledigt'}
        />
      ))}
      
      {selectedTask && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseModal}
          task={selectedTask}
          mode="edit"
        />
      )}
    </div>
  );
} 