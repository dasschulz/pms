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
import { 
  ChevronDown, 
  ChevronRight, 
  GripVertical, 
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Camera,
  Plus,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/videoplanung";
import { Fragment } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskStatusTableProps {
  status: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskMove: (taskId: string, newStatus: string, newSortOrder: number) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onCreateSubtask?: (parentTaskId: string) => void;
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
  onCreateSubtask,
  isCollapsed = false 
}: TaskStatusTableProps) {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

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

  const mainTasks = tasks.filter(task => !task.isSubtask);
  const getSubtasks = (parentId: string) => 
    tasks.filter(task => task.isSubtask && task.parentTaskId?.includes(parentId));

  const statusColorClass = getStatusColor(status);

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
          <div className="bg-background">
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
                              {onCreateSubtask && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateSubtask(task.id);
                                  }}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Plus className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.fälligkeitsdatum)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", getStatusColor(task.nextJob))}>
                            {task.nextJob}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(task.priority)}
                            <span className="text-xs">{task.priority}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(task.publishDate)}
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Subtasks */}
                      {isExpanded && subtasks.map((subtask) => (
                        <TableRow
                          key={subtask.id}
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
                                {onCreateSubtask && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCreateSubtask(subtask.id);
                                    }}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Plus className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(subtask.fälligkeitsdatum)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", getStatusColor(subtask.nextJob))}>
                              {subtask.nextJob}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getPriorityIcon(subtask.priority)}
                              <span className="text-xs">{subtask.priority}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(subtask.publishDate)}
                            </div>
                          </TableCell>
                        </TableRow>
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