"use client";

import React, { useState, useCallback } from 'react';
import { TaskStatusTable } from "./task-status-table";
import { TaskModal } from "./task-modal";
import { VideoPlanningBoardSkeleton } from "./video-planning-skeleton";
import { useTasks } from "@/hooks/use-tasks";
import type { Task } from "@/types/videoplanung";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Video, List, Columns3, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, AlignLeft, GitFork, CalendarIcon, ArrowUp, ArrowDown, Minus, MoreHorizontal, Layers3, Check } from "lucide-react";
import { getStatusColor } from "./task-status-table";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Drag and drop functionality
interface DragItem {
  id: string;
  type: 'task';
  sourceStatus: string;
}

// Kanban view component
function KanbanView({ 
  tasks, 
  onTaskClick, 
  onTaskUpdate,
  onCreateSubtask,
  onCreateNewTask
}: { 
  tasks: Task[]; 
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onCreateSubtask: (parentTaskId: string) => void;
  onCreateNewTask: (status: string) => void;
}) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const kanbanStatuses = ['Brainstorming', 'Skript', 'Dreh', 'Schnitt', 'Veröffentlichung'] as const;
  
  // Filter main tasks only and group by status
  const mainTasks = tasks.filter(task => !task.isSubtask);
  const groupedTasks = kanbanStatuses.reduce((acc, status) => {
    acc[status] = mainTasks.filter(task => task.nextJob === status);
    return acc;
  }, {} as Record<string, Task[]>);

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.nextJob === targetStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await onTaskUpdate(draggedTask.id, { nextJob: targetStatus as Task['nextJob'] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    } finally {
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // Function to get subtasks for a parent task
  const getSubtasks = (parentTaskId: string) => {
    return tasks.filter(task => {
      if (!task.isSubtask || !task.parentTaskId) return false;
      
      if (Array.isArray(task.parentTaskId)) {
        return task.parentTaskId.includes(parentTaskId);
      }
      
      return task.parentTaskId === parentTaskId;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Brainstorming': return <div className="w-2 h-2 rounded-full bg-gray-400" />;
      case 'Skript': return <div className="w-2 h-2 rounded-full bg-red-700" />;
      case 'Dreh': return <div className="w-2 h-2 rounded-full bg-red-400" />;
      case 'Schnitt': return <div className="w-2 h-2 rounded-full bg-yellow-400" />;
      case 'Veröffentlichung': return <div className="w-2 h-2 rounded-full bg-green-400" />;
      default: return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Dringend': return 'bg-red-500';
      case 'Hoch': return 'bg-orange-500';
      case 'Normal': return 'bg-blue-500';
      case 'Niedrig': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Dringend':
        return <ArrowUp className="h-3 w-3 text-red-600" />;
      case 'Hoch':
        return <ArrowUp className="h-3 w-3 text-orange-600" />;
      case 'Normal':
        return <Minus className="h-3 w-3 text-gray-600" />;
      case 'Niedrig':
        return <ArrowDown className="h-3 w-3 text-blue-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const handleMarkAsCompleted = async (task: Task) => {
    try {
      await onTaskUpdate(task.id, {
        nextJob: 'Erledigt' as Task['nextJob']
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht als erledigt markiert werden",
        variant: "destructive",
      });
    }
  };

  const renderTaskCard = (task: Task, isSubtask = false) => {
    const isOverdue = task.fälligkeitsdatum && new Date(task.fälligkeitsdatum) < new Date();
    const isVeöffentlichung = task.nextJob === 'Veröffentlichung';

    return (
      <Card 
        key={task.id}
        className={cn(
          "cursor-pointer hover:shadow-md transition-all duration-200 min-h-[120px] flex relative",
          draggedTask?.id === task.id && "opacity-50"
        )}
        onClick={() => onTaskClick(task)}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
      >
        <CardContent className="p-4 flex-1 justify-center">
          <div className="space-y-3">
            {/* Title and Actions */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm leading-tight flex-1">{task.name}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Description indicator */}
                {task.detailview && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <AlignLeft className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hat Beschreibung</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Has subtasks indicator */}
                {getSubtasks(task.id).length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(task.id);
                        }}
                        className="h-5 w-5 p-0 mt-0.5 flex-shrink-0"
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getSubtasks(task.id).length} Unteraufgaben</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Add subtask */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateSubtask(task.id);
                      }}
                      className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Unteraufgabe hinzufügen</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Priority and Dates */}
            <div className="space-y-2 text-xs">
              {/* Priority */}
              <div>
                <div className="text-muted-foreground font-medium">Priorität:</div>
                <div>{task.priority || 'Normal'}</div>
              </div>
              
              {/* Fälligkeit */}
              {task.fälligkeitsdatum && (
                <div>
                  <div className="text-muted-foreground font-medium">Fälligkeit:</div>
                  <div className={cn(isOverdue && "text-red-500 flex items-center gap-1")}>
                    {new Date(task.fälligkeitsdatum).toLocaleDateString('de-DE')}
                    {isOverdue && <AlertCircle className="h-3 w-3" />}
                  </div>
                </div>
              )}
              
              {/* Veröffentlichung */}
              {task.publishDate && (
                <div>
                  <div className="text-muted-foreground font-medium">Veröffentlichung:</div>
                  <div>{new Date(task.publishDate).toLocaleDateString('de-DE')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Subtasks */}
          {expandedTasks.has(task.id) && getSubtasks(task.id).length > 0 && (
            <div className="mt-3 space-y-2 border-t pt-3">
              {getSubtasks(task.id).map((subtask: Task) => (
                <Card 
                  key={subtask.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(subtask);
                  }}
                >
                  <CardContent className="p-2">
                    <div className="text-xs">
                      <div className="font-medium">{subtask.name}</div>
                      <div className="text-muted-foreground mt-1">{subtask.priority || 'Normal'}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>

        {/* Green checkmark for Veröffentlichung status */}
        {isVeöffentlichung && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsCompleted(task);
                }}
              >
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Als erledigt markieren</p>
            </TooltipContent>
          </Tooltip>
        )}
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="w-full overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible" style={{ maxWidth: '100vw' }}>
          <div className="flex gap-3 pb-4 px-1">
            {kanbanStatuses.map((status) => (
              <div 
                key={status} 
                className="flex-shrink-0 w-64"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <Card className="h-[calc(100vh-16rem)] flex flex-col">
                  <CardHeader className={cn("pb-0 h-16", getStatusColor(status))}>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {getStatusIcon(status)}
                      {status}
                      <Badge variant="outline" className="ml-auto bg-background/50">
                        {groupedTasks[status].length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-3 pt-4">
                    {/* Tasks */}
                    {groupedTasks[status].map((task) => 
                      renderTaskCard(task)
                    )}

                    {/* Add new task placeholder */}
                    <Card 
                      className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity duration-200 border-dashed border-2 min-h-[80px] flex"
                      onClick={() => onCreateNewTask(status)}
                    >
                      <CardContent className="p-4 flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Plus className="h-4 w-4" />
                          <span className="text-sm">Neue Aufgabe</span>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function VideoPlanningBoard({ viewMode = "list" }: { viewMode?: "list" | "kanban" }) {
  const { tasks, isLoading, error, updateTask, createTask } = useTasks();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<string | null>(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState<string>('Brainstorming');

  // Simplified grouping: only two tables for list view
  const groupedTasks = {
    'In Bearbeitung': tasks?.filter((task: Task) => task.nextJob !== 'Erledigt') || [],
    'Erledigt': tasks?.filter((task: Task) => task.nextJob === 'Erledigt') || []
  };

  // Define table order
  const tableOrder = ['In Bearbeitung', 'Erledigt'] as const;

  // Check if there are any tasks at all
  const totalTasks = tasks?.length || 0;

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskMove = async (taskId: string, newStatus: string, newSortOrder: number) => {
    try {
      await updateTask(taskId, { 
        nextJob: newStatus as Task['nextJob'],
        sortOrder: newSortOrder
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht verschoben werden",
        variant: "destructive",
      });
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
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
      
      await updateTask(taskId, updateData);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleCloseNewTaskModal = () => {
    setIsNewTaskModalOpen(false);
    setParentTaskForSubtask(null);
    setInitialTaskStatus('Brainstorming');
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
                Die TaskManager-Tabelle wurde noch nicht erstellt. 
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
          initialStatus={initialTaskStatus}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === "list" && tableOrder.map((status) => (
        <TaskStatusTable
          key={status}
          status={status}
          tasks={groupedTasks[status]}
          onTaskClick={handleTaskClick}
          onTaskMove={handleTaskMove}
          onTaskUpdate={handleTaskUpdate}
          isCollapsed={status === 'Erledigt'}
        />
      ))}
      
      {viewMode === "kanban" && (
        <KanbanView
          tasks={groupedTasks['In Bearbeitung']}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
          onCreateSubtask={(parentTaskId: string) => {
            setParentTaskForSubtask(parentTaskId);
            setIsNewTaskModalOpen(true);
          }}
          onCreateNewTask={(status: string) => {
            setInitialTaskStatus(status);
            setIsNewTaskModalOpen(true);
          }}
        />
      )}
      
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