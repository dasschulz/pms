"use client";

import { useState } from "react";
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
  GripVertical, 
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
  X
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
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Brainstorming':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Skript':
      return 'bg-red-900 text-red-100 border-red-800';
    case 'Dreh':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Schnitt':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Veröffentlichung':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Erledigt':
      return 'bg-white text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
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
  return new Date(dateString).toLocaleDateString('de-DE');
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

  const handleTaskSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
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

  // Handle clicking outside to cancel subtask creation
  const handleTableClick = () => {
    if (creatingSubtaskFor) {
      handleCancelSubtask();
    }
    if (editingField) {
      handleFieldCancel();
    }
  };

  const mainTasks = tasks.filter(task => !task.isSubtask);
  const getSubtasks = (parentId: string) => 
    tasks.filter(task => task.isSubtask && task.parentTaskId?.includes(parentId));

  const statusColorClass = getStatusColor(status);

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
  const renderEditableDate = (task: Task, field: 'fälligkeitsdatum' | 'publishDate', icon: React.ReactNode) => {
    const isEditing = editingField?.taskId === task.id && editingField?.field === field;
    const value = task[field];
    const displayValue = value ? formatDate(value) : '-';
    const dateValue = value ? new Date(value) : null;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Popover open={true} onOpenChange={(open) => {
            if (!open) {
              // Save and close when popover closes
              setEditingField(null);
              setEditingValue('');
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-32 h-6 justify-start text-left font-normal text-xs",
                  !dateValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {dateValue ? (
                  format(dateValue, "dd.MM.yyyy", { locale: de })
                ) : (
                  <span>Datum wählen</span>
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
                    console.log('Frontend: Saving date update via calendar:', { taskId: task.id, field, date, updates });
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
        className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer hover:bg-muted px-1 py-0.5 rounded"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Frontend: Starting date edit for:', { taskId: task.id, field, value });
          handleFieldEdit(task.id, field, value || '');
        }}
      >
        {icon}
        {displayValue}
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
                console.log('Frontend: Saving nextJob update:', { taskId: task.id, value, updates });
                console.log('Frontend: nextJob value details:', { value, type: typeof value, stringified: JSON.stringify(value) });
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
            <SelectTrigger className="w-full h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {nextJobOptions.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    return (
      <Badge 
        className={cn("text-xs cursor-pointer hover:opacity-80", getStatusColor(task.nextJob || 'Brainstorming'))}
        onClick={(e) => {
          e.stopPropagation();
          handleFieldEdit(task.id, 'nextJob', task.nextJob || 'Brainstorming');
        }}
      >
        {task.nextJob || 'Brainstorming'}
      </Badge>
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
                console.log('Frontend: Saving priority update:', { taskId: task.id, value, updates });
                console.log('Frontend: priority value details:', { value, type: typeof value, stringified: JSON.stringify(value) });
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
            <SelectTrigger className="w-full h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
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
        className="flex items-center gap-1 cursor-pointer hover:bg-muted px-1 py-0.5 rounded"
        onClick={(e) => {
          e.stopPropagation();
          handleFieldEdit(task.id, 'priority', task.priority || 'Normal');
        }}
      >
        {getPriorityIcon(task.priority || 'Normal')}
        <span className="text-xs">{task.priority || 'Normal'}</span>
      </div>
    );
  };

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-32">Fälligkeitsdatum</TableHead>
                  <TableHead className="w-32">Nächster Job</TableHead>
                  <TableHead className="w-24">Priorität</TableHead>
                  <TableHead className="w-32">VÖ-Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainTasks.map((task) => {
                  const subtasks = getSubtasks(task.id);
                  const isExpanded = expandedTasks.has(task.id);
                  
                  return (
                    <Fragment key={task.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
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
                            <div className="flex items-center gap-2 flex-1">
                              <span 
                                className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                                onClick={(e) => handleNameClick(task, e)}
                              >
                                {task.name}
                              </span>
                              
                              {/* Description indicator */}
                              {task.detailview && task.detailview.trim() && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Menu className="h-3 w-3 text-muted-foreground cursor-help" />
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
                              
                              {/* Plus button for creating subtasks - appears on hover */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateSubtask(task.id);
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderEditableDate(task, 'fälligkeitsdatum', <Calendar className="h-3 w-3" />)}
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
                        <TableRow className="bg-muted/30 animate-in slide-in-from-top-2 duration-200">
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 ml-6">
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
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
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelSubtask}
                                disabled={isCreatingSubtask}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              -
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", getStatusColor(task.nextJob))}>
                              {task.nextJob}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getPriorityIcon('Normal')}
                              <span className="text-xs">Normal</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              -
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {/* Subtasks */}
                      {isExpanded && subtasks.map((subtask) => (
                        <Fragment key={subtask.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50 bg-muted/20"
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1 ml-6">
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
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
                                <div className="flex items-center gap-2 flex-1">
                                  <span 
                                    className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                                    onClick={(e) => handleNameClick(subtask, e)}
                                  >
                                    {subtask.name}
                                  </span>
                                  
                                  {/* Description indicator */}
                                  {subtask.detailview && subtask.detailview.trim() && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Menu className="h-3 w-3 text-muted-foreground cursor-help" />
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
                                  
                                  {/* Plus button for creating subtasks - appears on hover */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateSubtask(subtask.id);
                                    }}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Plus className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {renderEditableDate(subtask, 'fälligkeitsdatum', <Calendar className="h-3 w-3" />)}
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
                            <TableRow className="bg-muted/40 animate-in slide-in-from-top-2 duration-200">
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1 ml-12">
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                </div>
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell className="font-medium text-sm pl-14" onClick={(e) => e.stopPropagation()}>
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
                                    <Check className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelSubtask}
                                    disabled={isCreatingSubtask}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  -
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("text-xs", getStatusColor(subtask.nextJob))}>
                                  {subtask.nextJob}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {getPriorityIcon('Normal')}
                                  <span className="text-xs">Normal</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
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
                
                {tasks.length === 0 && (
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
    </TooltipProvider>
  );
} 