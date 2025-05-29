"use client";

import { useState } from "react";
import React from "react";
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar,
  CalendarIcon,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Camera,
  Plus,
  Menu,
  Check,
  X,
  AlignLeft,
  GitFork,
  ArrowUpDown,
  Trash2,
  Flag,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/videoplanung";
import { nextJobOptions, priorityOptions } from "@/types/videoplanung";
import { Fragment } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTasks } from "@/hooks/use-tasks";

interface TaskStatusTableProps {
  status: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskMove: (taskId: string, newStatus: string, newSortOrder: number) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  isCollapsed?: boolean;
}

// Color schemes for different statuses
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Brainstorming':
      return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700';
    case 'Skript':
      return 'bg-red-900 dark:bg-red-900 text-red-100 dark:text-red-100 border-red-800 dark:border-red-800';
    case 'Dreh':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
    case 'Schnitt':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
    case 'Veröffentlichung':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
    case 'Erledigt':
      return 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700';
    default:
      return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700';
  }
};

// Get camera icon color based on status
const getCameraIconColor = (status: string) => {
  switch (status) {
    case 'Brainstorming':
      return 'text-gray-600';
    case 'Skript':
      return 'text-red-600';
    case 'Dreh':
      return 'text-red-600';
    case 'Schnitt':
      return 'text-yellow-600';
    case 'Veröffentlichung':
      return 'text-green-600';
    case 'Erledigt':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'Dringend':
      return <ArrowUp className="h-4 w-4 text-red-600" />;
    case 'Hoch':
      return <ArrowUp className="h-4 w-4 text-orange-600" />;
    case 'Normal':
      return <Minus className="h-4 w-4 text-gray-600" />;
    case 'Niedrig':
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return format(new Date(dateString), "dd.MM.yyyy", { locale: de });
};

export function TaskStatusTable({ 
  status, 
  tasks, 
  onTaskClick, 
  onTaskMove, // TODO: Implement drag-and-drop functionality
  onTaskUpdate,
  isCollapsed = false 
}: TaskStatusTableProps) {
  const { toast } = useToast();
  const { createTask } = useTasks();
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [creatingSubtaskFor, setCreatingSubtaskFor] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState<string>('');
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [editingField, setEditingField] = useState<{taskId: string, field: string} | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Bulk actions state
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);

  // New task creation state
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isNewTaskActive, setIsNewTaskActive] = useState(false);
  const [isSavingNewTask, setIsSavingNewTask] = useState(false);

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleTaskSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleTaskExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleNameClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (clickTimeout) {
      // Double click - open modal
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      onTaskClick(task);
    } else {
      // Single click - open modal immediately (no more inline editing)
      onTaskClick(task);
    }
  };

  const handleCreateSubtask = (parentTaskId: string) => {
    setCreatingSubtaskFor(parentTaskId);
    setNewSubtaskName('');
    // Ensure parent task is expanded
    setExpandedTasks(prev => new Set([...prev, parentTaskId]));
  };

  const handleSaveSubtask = async () => {
    if (!creatingSubtaskFor || !newSubtaskName.trim()) return;
    
    setIsCreatingSubtask(true);
    try {
      // Find the parent task to inherit some properties
      const parentTask = tasks.find(t => t.id === creatingSubtaskFor);
      
      const taskData = {
        name: newSubtaskName.trim(),
        detailview: '',
        nextJob: parentTask?.nextJob || status,
        priority: 'Normal',
        isSubtask: true,
        parentTaskId: [creatingSubtaskFor]
      };
      
      console.log('Frontend: Creating subtask with data:', taskData);
      console.log('Frontend: parentTaskId value:', taskData.parentTaskId, 'type:', typeof taskData.parentTaskId, 'isArray:', Array.isArray(taskData.parentTaskId));
      
      await createTask(taskData);
      
      toast({
        title: "Unteraufgabe erstellt",
        description: "Die neue Unteraufgabe wurde erfolgreich erstellt.",
      });
      handleCancelSubtask();
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast({
        title: "Fehler beim Erstellen",
        description: "Die Unteraufgabe konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSubtask(false);
    }
  };

  const handleCancelSubtask = () => {
    setCreatingSubtaskFor(null);
    setNewSubtaskName('');
    setIsCreatingSubtask(false);
  };

  const handleSubtaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveSubtask();
    } else if (e.key === 'Escape') {
      handleCancelSubtask();
    }
  };

  const handleTableClick = () => {
    // Clear any editing state when clicking on table background
    setEditingField(null);
    setEditingValue('');
    
    // Also revert new task creation if active
    if (isCreatingNewTask) {
      handleNewTaskCancel();
    }
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (!onTaskUpdate || selectedTasks.size === 0) return;
    
    setBulkActionLoading('delete');
    try {
      // Note: This would typically be a bulk delete API call
      // For now, we'll delete each task individually
      const deletePromises = Array.from(selectedTasks).map(taskId => 
        onTaskUpdate(taskId, { nextJob: 'Erledigt' } as Partial<Task>)
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: "Aufgaben gelöscht",
        description: `${selectedTasks.size} Aufgabe(n) wurden erfolgreich gelöscht.`,
      });
      
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: "Fehler beim Löschen",
        description: "Die Aufgaben konnten nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!onTaskUpdate || selectedTasks.size === 0) return;
    
    setBulkActionLoading('status');
    try {
      const updatePromises = Array.from(selectedTasks).map(taskId => 
        onTaskUpdate(taskId, { nextJob: newStatus } as Partial<Task>)
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Status aktualisiert",
        description: `${selectedTasks.size} Aufgabe(n) wurden zu "${newStatus}" verschoben.`,
      });
      
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Der Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleBulkPriorityChange = async (newPriority: string) => {
    if (!onTaskUpdate || selectedTasks.size === 0) return;
    
    setBulkActionLoading('priority');
    try {
      const updatePromises = Array.from(selectedTasks).map(taskId => 
        onTaskUpdate(taskId, { priority: newPriority } as Partial<Task>)
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Priorität aktualisiert",
        description: `${selectedTasks.size} Aufgabe(n) haben jetzt die Priorität "${newPriority}".`,
      });
      
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Die Priorität konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(null);
    }
  };

  // New task creation handlers
  const handleNewTaskActivate = () => {
    setIsNewTaskActive(true);
    setIsCreatingNewTask(true);
  };

  const handleNewTaskSave = async () => {
    if (!newTaskName.trim()) return;
    
    setIsSavingNewTask(true);
    try {
      const taskData = {
        name: newTaskName.trim(),
        detailview: '',
        nextJob: status === 'In Bearbeitung' ? 'Brainstorming' : status,
        priority: 'Normal',
        isSubtask: false
      };
      
      await createTask(taskData);
      
      toast({
        title: "Aufgabe erstellt",
        description: "Die neue Aufgabe wurde erfolgreich erstellt.",
      });
      
      handleNewTaskCancel();
    } catch (error) {
      console.error('Error creating new task:', error);
      toast({
        title: "Fehler beim Erstellen",
        description: "Die Aufgabe konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNewTask(false);
    }
  };

  const handleNewTaskCancel = () => {
    setIsCreatingNewTask(false);
    setIsNewTaskActive(false);
    setNewTaskName('');
    setIsSavingNewTask(false);
  };

  const handleNewTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNewTaskSave();
    } else if (e.key === 'Escape') {
      handleNewTaskCancel();
    }
  };

  const getSubtasks = (parentId: string) => 
    tasks.filter(task => task.isSubtask && task.parentTaskId?.includes(parentId));

  const statusColorClass = getStatusColor(status);

  // Sorting functionality
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedTasks = (tasksToSort: Task[]) => {
    if (!sortField) return tasksToSort;

    return [...tasksToSort].sort((a, b) => {
      let aValue: any = a[sortField as keyof Task];
      let bValue: any = b[sortField as keyof Task];

      // Handle different field types
      switch (sortField) {
        case 'name':
          aValue = (aValue || '').toLowerCase();
          bValue = (bValue || '').toLowerCase();
          break;
        case 'fälligkeitsdatum':
        case 'publishDate':
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
          break;
        case 'priority':
          // Convert priority to numeric value for sorting
          const priorityOrder = { 'Dringend': 4, 'Hoch': 3, 'Normal': 2, 'Niedrig': 1, '-': 0 };
          aValue = priorityOrder[aValue as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[bValue as keyof typeof priorityOrder] || 0;
          break;
        case 'nextJob':
          // Sort by status order
          const statusOrder = ['Brainstorming', 'Skript', 'Dreh', 'Schnitt', 'Veröffentlichung', 'Erledigt'];
          aValue = statusOrder.indexOf(aValue) !== -1 ? statusOrder.indexOf(aValue) : 999;
          bValue = statusOrder.indexOf(bValue) !== -1 ? statusOrder.indexOf(bValue) : 999;
          break;
        default:
          aValue = aValue || '';
          bValue = bValue || '';
      }

      let result = 0;
      if (aValue < bValue) result = -1;
      else if (aValue > bValue) result = 1;

      return sortDirection === 'desc' ? -result : result;
    });
  };

  const renderSortableHeader = (label: string, field: string, className?: string) => {
    const isCurrentField = sortField === field;
    return (
      <TableHead 
        className={cn("cursor-pointer select-none", className)}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {isCurrentField ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  const handleFieldEdit = (taskId: string, field: string, currentValue: string) => {
    console.log('Frontend: handleFieldEdit called:', { taskId, field, currentValue });
    setEditingField({ taskId, field });
    setEditingValue(currentValue || '');
    console.log('Frontend: Editing state set:', { editingField: { taskId, field }, editingValue: currentValue || '' });
  };

  const handleFieldSave = async () => {
    if (!editingField || !onTaskUpdate) return;
    
    try {
      const updates: Partial<Task> = {};
      
      switch (editingField.field) {
        case 'fälligkeitsdatum':
        case 'publishDate':
          // For dates, we expect ISO date string format
          (updates as any)[editingField.field] = editingValue || null;
          break;
        case 'nextJob':
        case 'priority':
          (updates as any)[editingField.field] = editingValue;
          break;
      }
      
      await onTaskUpdate(editingField.taskId, updates);
      toast({
        title: "Aufgabe aktualisiert",
        description: "Das Feld wurde erfolgreich geändert.",
      });
      setEditingField(null);
      setEditingValue('');
    } catch (error) {
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Das Feld konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const handleFieldKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingField) {
        // Handle Enter key for date fields
        const target = e.target as HTMLInputElement;
        if (target.type === 'date') {
          target.blur(); // This will trigger the onBlur save handler
        } else {
          handleFieldSave();
        }
      }
    } else if (e.key === 'Escape') {
      handleFieldCancel();
    }
  };

  // Helper function to render editable date field
  const renderEditableDate = (task: Task, field: 'fälligkeitsdatum' | 'publishDate', _iconPlaceholder: React.ReactNode) => {
    const isEditing = editingField?.taskId === task.id && editingField?.field === field;
    const value = task[field];
    const displayValue = value ? formatDate(value) : '-';
    const dateValue = value ? new Date(value) : null;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Popover open={true} onOpenChange={(open) => {
            if (!open) {
              setEditingField(null);
              setEditingValue('');
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-9 justify-start text-left font-normal text-sm rounded",
                  "px-0",
                  "hover:bg-transparent focus:bg-transparent text-current hover:text-current",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  !dateValue && "text-muted-foreground"
                )}
              >
                {dateValue ? (
                  format(dateValue, "dd.MM.yyyy", { locale: de })
                ) : (
                  <span className="text-muted-foreground">Datum wählen</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateValue || undefined}
                onSelect={async (date) => {
                  try {
                    const updates: Partial<Task> = {};
                    (updates as any)[field] = date ? date.toISOString().split('T')[0] : null;
                    await onTaskUpdate?.(task.id, updates);
                    toast({
                      title: "Aufgabe aktualisiert",
                      description: "Das Datum wurde erfolgreich geändert.",
                    });
                    setEditingField(null);
                    setEditingValue('');
                  } catch (error) {
                    console.error('Frontend: Error saving date via calendar:', error);
                    toast({
                      title: "Fehler beim Aktualisieren",
                      description: "Das Datum konnte nicht aktualisiert werden.",
                      variant: "destructive",
                    });
                  }
                }}
                locale={de}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }
    
    return (
      <div 
        className={cn(
          "w-full h-9 text-sm rounded cursor-pointer",
          "flex items-center justify-start font-normal text-left"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleFieldEdit(task.id, field, value || '');
        }}
      >
        <span>{displayValue}</span>
      </div>
    );
  };

  // Helper function to render editable status field
  const renderEditableStatus = (task: Task) => {
    const isEditing = editingField?.taskId === task.id && editingField?.field === 'nextJob';
    
    if (isEditing) {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={editingValue}
            onValueChange={async (value) => {
              setEditingValue(value);
              // Save immediately
              try {
                const updates: Partial<Task> = { nextJob: value as Task['nextJob'] };
                await onTaskUpdate?.(task.id, updates);
                toast({
                  title: "Aufgabe aktualisiert",
                  description: "Das Feld wurde erfolgreich geändert.",
                });
                setEditingField(null);
                setEditingValue('');
              } catch (error) {
                console.error('Error saving nextJob:', error);
                toast({
                  title: "Fehler beim Aktualisieren",
                  description: "Das Feld konnte nicht aktualisiert werden.",
                  variant: "destructive",
                });
              }
            }}
          >
            <SelectTrigger className={cn(
              "h-9 px-3 py-2 text-sm w-full border border-input",
              getStatusColor(editingValue),
              "hover:opacity-80",
              "[&>svg]:hidden", // Hide the chevron indicator
              "justify-center", // Center the content like display state
              "[&>span]:flex [&>span]:items-center [&>span]:justify-center [&>span]:w-full" // Override SelectValue positioning
            )}>
              <SelectValue placeholder="Status wählen" />
            </SelectTrigger>
            <SelectContent>
              {nextJobOptions.map((option) => (
                <SelectItem 
                  key={option} 
                  value={option} 
                  className={cn(
                    "text-sm data-[highlighted]:opacity-75 focus:bg-transparent",
                    getStatusColor(option)
                  )}
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    // Display as a non-interactive, styled Select-like element when not editing
    return (
      <div 
        className={cn(
          "h-9 px-3 py-2 text-sm w-full",
          "flex items-center justify-center",
          getStatusColor(task.nextJob || 'Brainstorming'),
          "rounded-md border border-input",
          "cursor-pointer hover:opacity-80"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleFieldEdit(task.id, 'nextJob', task.nextJob || 'Brainstorming');
        }}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{task.nextJob || 'Brainstorming'}</span>
      </div>
    );
  };

  // Helper function to render editable priority field
  const renderEditablePriority = (task: Task) => {
    const isEditing = editingField?.taskId === task.id && editingField?.field === 'priority';
    
    if (isEditing) {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={editingValue}
            onValueChange={async (value) => {
              setEditingValue(value);
              // Save immediately
              try {
                const updates: Partial<Task> = { priority: value as Task['priority'] };
                await onTaskUpdate?.(task.id, updates);
                toast({
                  title: "Aufgabe aktualisiert",
                  description: "Das Feld wurde erfolgreich geändert.",
                });
                setEditingField(null);
                setEditingValue('');
              } catch (error) {
                console.error('Error saving priority:', error);
                toast({
                  title: "Fehler beim Aktualisieren",
                  description: "Das Feld konnte nicht aktualisiert werden.",
                  variant: "destructive",
                });
              }
            }}
          >
            <SelectTrigger className={cn(
              "w-full h-9 px-3 py-2 text-sm", // Adjusted for md size
              // Apply a base background and border similar to a "soft" variant
              "bg-background border border-input hover:bg-muted",
              "[&>svg]:hidden", // Hide the chevron indicator
              "justify-start", // Match the display state alignment
              "[&>span]:flex [&>span]:items-center [&>span]:justify-start [&>span]:w-full" // Override SelectValue positioning to match display
            )}>
              <SelectValue placeholder="Priorität wählen" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option} value={option} className="text-sm">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    return (
      <div 
        className={cn(
          "w-full h-9 text-sm cursor-pointer rounded", // Removed hover:bg-muted, kept px-3 for icon
          "flex items-center justify-start font-normal text-left" // Removed px-3
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleFieldEdit(task.id, 'priority', task.priority || 'Normal');
        }}
      >
        {getPriorityIcon(task.priority || 'Normal')}
        <span className="ml-2">{task.priority || 'Normal'}</span> {/* Adjust margin for icon spacing */}
      </div>
    );
  };

  // Separate main tasks from subtasks
  const mainTasks = tasks.filter(task => !task.isSubtask);
  const sortedMainTasks = getSortedTasks(mainTasks);

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        <div 
          className={cn(
            "flex items-center justify-between p-4 cursor-pointer",
            statusColorClass
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <h3 className="font-semibold">{status}</h3>
            <Badge variant="outline" className="bg-background/50">
              {tasks.length}
            </Badge>
          </div>
        </div>

        {!collapsed && (
          <div className="bg-background" onClick={handleTableClick}>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  {renderSortableHeader("Name", "name", "w-[custom]")}
                  {renderSortableHeader("Fälligkeit", "fälligkeitsdatum", "w-28")}
                  {renderSortableHeader("Nächster Job", "nextJob", "w-44")}
                  {renderSortableHeader("Priorität", "priority", "w-32")}
                  {renderSortableHeader("VÖ-Datum", "publishDate", "w-32")}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMainTasks.map((task) => {
                  const subtasks = getSubtasks(task.id);
                  const isExpanded = expandedTasks.has(task.id);
                  
                  return (
                    <Fragment key={task.id}>
                      <TableRow className="cursor-pointer bg-white dark:bg-background">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Checkbox
                              checked={selectedTasks.has(task.id)}
                              onCheckedChange={() => handleTaskSelect(task.id)}
                            />
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {subtasks.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskExpand(task.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 group">
                            <Camera className={cn("h-4 w-4", getCameraIconColor(task.nextJob))} />
                            
                            <div className="w-4 h-4 flex items-center justify-center">
                              {creatingSubtaskFor === task.id ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-1">
                              <span 
                                className="cursor-pointer hover:bg-muted px-2 py-1 rounded text-sm"
                                onClick={(e) => handleNameClick(task, e)}
                              >
                                {task.name}
                              </span>
                              
                              {/* Description indicator - now always visible if applicable */}
                              {task.detailview && task.detailview.trim() && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 transition-opacity ml-1"
                                    >
                                      <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-sm">
                                      {task.detailview.length > 800 
                                        ? task.detailview.substring(0, 800) + '...' 
                                        : task.detailview
                                      }
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              
                              {/* Has Subtasks indicator - always visible if applicable */}
                              {subtasks.length > 0 && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0 transition-opacity ml-1" 
                                  disabled // Non-interactive, just an indicator
                                >
                                  <GitFork className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                              
                              {/* Plus button for creating subtasks - now always visible */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateSubtask(task.id);
                                }}
                                className="h-6 w-6 p-0 transition-opacity"
                              >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderEditableDate(task, 'fälligkeitsdatum', <CalendarIcon className="h-3 w-3" />)}
                        </TableCell>
                        <TableCell>
                          {renderEditableStatus(task)}
                        </TableCell>
                        <TableCell>
                          {renderEditablePriority(task)}
                        </TableCell>
                        <TableCell>
                          {renderEditableDate(task, 'publishDate', <Clock className="h-3 w-3" />)}
                        </TableCell>
                      </TableRow>
                      
                      {/* Inline subtask creation row */}
                      {creatingSubtaskFor === task.id && (
                        <TableRow className="animate-in slide-in-from-top-2 duration-200 bg-white dark:bg-background">
                          <TableCell onClick={(e) => e.stopPropagation()} className="w-12">
                            <div className="flex items-center gap-1 ml-6">
                              <Checkbox
                                checked={selectedTasks.has(task.id)}
                                onCheckedChange={() => handleTaskSelect(task.id)}
                              />
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="font-medium text-sm pl-8" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4 text-gray-400" />
                              <Input
                                value={newSubtaskName}
                                onChange={(e) => setNewSubtaskName(e.target.value)}
                                onKeyDown={handleSubtaskKeyPress}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Neue Unteraufgabe..."
                                className="flex-1"
                                autoFocus
                                disabled={isCreatingSubtask}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveSubtask}
                                disabled={!newSubtaskName.trim() || isCreatingSubtask}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3 text-green-600 dark:text-white" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelSubtask}
                                disabled={isCreatingSubtask}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3 text-red-600 dark:text-white" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="w-28">
                            <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                              -
                            </div>
                          </TableCell>
                          <TableCell className="w-44">
                            <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                              -
                            </div>
                          </TableCell>
                          <TableCell className="w-32">
                            <div className="flex items-center gap-1">
                              {getPriorityIcon('Normal')}
                              <span className="text-xs">Normal</span>
                            </div>
                          </TableCell>
                          <TableCell className="w-32">
                            <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                              -
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {/* Subtasks */}
                      {isExpanded && subtasks.map((subtask) => (
                        <Fragment key={subtask.id}>
                          <TableRow
                            className="cursor-pointer bg-white dark:bg-background"
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1 ml-6">
                                <Checkbox
                                  checked={selectedTasks.has(subtask.id)}
                                  onCheckedChange={() => handleTaskSelect(subtask.id)}
                                />
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="font-medium text-sm pl-8">
                              <div className="flex items-center gap-2 group">
                                <Camera className={cn("h-4 w-4", getCameraIconColor(subtask.nextJob))} />
                                
                                <div className="w-4 h-4 flex items-center justify-center">
                                  {creatingSubtaskFor === subtask.id ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-1">
                                  <span 
                                    className="cursor-pointer hover:bg-muted px-2 py-1 rounded text-sm"
                                    onClick={(e) => handleNameClick(subtask, e)}
                                  >
                                    {subtask.name}
                                  </span>
                                  
                                  {/* Description indicator - now always visible if applicable */}
                                  {subtask.detailview && subtask.detailview.trim() && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-6 w-6 p-0 transition-opacity ml-1"
                                        >
                                          <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <p className="text-sm">
                                          {subtask.detailview.length > 800 
                                            ? subtask.detailview.substring(0, 800) + '...' 
                                            : subtask.detailview
                                          }
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  
                                  {/* Has Subtasks indicator - always visible if applicable */}
                                  {getSubtasks(subtask.id).length > 0 && (
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 transition-opacity ml-1" 
                                      disabled // Non-interactive, just an indicator
                                    >
                                      <GitFork className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  )}
                                  
                                  {/* Plus button for creating subtasks - now always visible */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateSubtask(subtask.id);
                                    }}
                                    className="h-6 w-6 p-0 transition-opacity"
                                  >
                                    <Plus className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {renderEditableDate(subtask, 'fälligkeitsdatum', <CalendarIcon className="h-3 w-3" />)}
                            </TableCell>
                            <TableCell>
                              {renderEditableStatus(subtask)}
                            </TableCell>
                            <TableCell>
                              {renderEditablePriority(subtask)}
                            </TableCell>
                            <TableCell>
                              {renderEditableDate(subtask, 'publishDate', <Clock className="h-3 w-3" />)}
                            </TableCell>
                          </TableRow>
                          
                          {/* Inline subtask creation row for subtasks */}
                          {creatingSubtaskFor === subtask.id && (
                            <TableRow className="animate-in slide-in-from-top-2 duration-200 bg-white dark:bg-background">
                              <TableCell onClick={(e) => e.stopPropagation()} className="w-12">
                                <div className="flex items-center gap-1 ml-6">
                                  <Checkbox
                                    checked={selectedTasks.has(subtask.id)}
                                    onCheckedChange={() => handleTaskSelect(subtask.id)}
                                  />
                                </div>
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell className="font-medium text-sm pl-8" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  <Camera className="h-4 w-4 text-gray-400" />
                                  <Input
                                    value={newSubtaskName}
                                    onChange={(e) => setNewSubtaskName(e.target.value)}
                                    onKeyDown={handleSubtaskKeyPress}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Neue Unteraufgabe..."
                                    className="flex-1"
                                    autoFocus
                                    disabled={isCreatingSubtask}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleSaveSubtask}
                                    disabled={!newSubtaskName.trim() || isCreatingSubtask}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Check className="h-3 w-3 text-green-600 dark:text-white" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelSubtask}
                                    disabled={isCreatingSubtask}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3 text-red-600 dark:text-white" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="w-28">
                                <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                                  -
                                </div>
                              </TableCell>
                              <TableCell className="w-44">
                                <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                                  -
                                </div>
                              </TableCell>
                              <TableCell className="w-32">
                                <div className="flex items-center gap-1">
                                  {getPriorityIcon('Normal')}
                                  <span className="text-xs">Normal</span>
                                </div>
                              </TableCell>
                              <TableCell className="w-32">
                                <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                                  -
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))}
                    </Fragment>
                  );
                })}
                
                {/* New Task Creation Row */}
                {!isCreatingNewTask ? (
                  <TableRow 
                    className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-background"
                    onClick={handleNewTaskActivate}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Checkbox disabled className="opacity-50" />
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-muted-foreground/50" />
                        <div className="w-4 h-4"></div>
                        <span className="text-muted-foreground italic text-sm">Neue Aufgabe hinzufügen...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-start text-sm text-muted-foreground/50 h-9 w-full">
                        -
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center text-sm text-muted-foreground/50 h-9 w-full">
                        -
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground/50">
                        {getPriorityIcon('Normal')}
                        <span className="text-sm">Normal</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                        -
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow className="animate-in slide-in-from-top-2 duration-200 bg-white dark:bg-background">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Checkbox disabled />
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Camera className={cn("h-4 w-4", getCameraIconColor(status))} />
                        <div className="w-4 h-4"></div>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            onKeyDown={handleNewTaskKeyPress}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Aufgabenname eingeben..."
                            className="flex-1"
                            autoFocus
                            disabled={isSavingNewTask}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleNewTaskSave}
                            disabled={!newTaskName.trim() || isSavingNewTask}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3 text-green-600 dark:text-white" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleNewTaskCancel}
                            disabled={isSavingNewTask}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3 text-red-600 dark:text-white" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                        -
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "h-9 px-3 py-2 text-sm w-full",
                        "flex items-center justify-center",
                        getStatusColor(status),
                        "rounded-md border border-input"
                      )}>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getPriorityIcon('Normal')}
                        <span className="text-sm">Normal</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-start text-sm text-muted-foreground h-9 w-full">
                        -
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                
                {tasks.length === 0 && !isCreatingNewTask && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Keine Aufgaben in diesem Status
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      {showBulkActions && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-background border rounded-lg shadow-lg p-2 flex flex-col gap-2">
            <div className="text-xs text-muted-foreground px-2 py-1 border-b">
              {selectedTasks.size} ausgewählt
            </div>
            
            {/* Delete Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkActionLoading === 'delete'}
              className="justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              {bulkActionLoading === 'delete' ? 'Wird erledigt...' : 'Als erledigt markieren'}
            </Button>
            
            {/* Status Change Buttons */}
            <div className="flex flex-col gap-1">
              <div className="text-xs text-muted-foreground px-2">Nächster Job:</div>
              {nextJobOptions.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange(option)}
                  disabled={bulkActionLoading === 'status'}
                  className="justify-start gap-2 text-xs"
                >
                  <ArrowRight className="h-3 w-3" />
                  {bulkActionLoading === 'status' ? 'Wird geändert...' : option}
                </Button>
              ))}
            </div>
            
            {/* Priority Change Buttons */}
            <div className="flex flex-col gap-1">
              <div className="text-xs text-muted-foreground px-2">Priorität:</div>
              {priorityOptions.map((priority) => (
                <Button
                  key={priority}
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkPriorityChange(priority)}
                  disabled={bulkActionLoading === 'priority'}
                  className="justify-start gap-2 text-xs"
                >
                  <Flag className="h-3 w-3" />
                  {bulkActionLoading === 'priority' ? 'Wird geändert...' : priority}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
} 