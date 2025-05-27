"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, Save, X, Bold, Italic, Link, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";
import type { Task } from "@/types/videoplanung";
import { nextJobOptions, priorityOptions } from "@/types/videoplanung";
import { getStatusColor } from "./task-status-table";
import { useToast } from "@/hooks/use-toast";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  mode: 'create' | 'edit';
  parentTaskId?: string;
}

export function TaskModal({ isOpen, onClose, task, mode, parentTaskId }: TaskModalProps) {
  const { createTask, updateTask, isCreating, isUpdating } = useTasks();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    detailview: '',
    fälligkeitsdatum: null as Date | null,
    nextJob: 'Brainstorming',
    priority: 'Normal',
    publishDate: null as Date | null,
  });

  // Reset form when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && task) {
        setFormData({
          name: task.name,
          detailview: task.detailview,
          fälligkeitsdatum: task.fälligkeitsdatum ? new Date(task.fälligkeitsdatum) : null,
          nextJob: task.nextJob,
          priority: task.priority,
          publishDate: task.publishDate ? new Date(task.publishDate) : null,
        });
      } else {
        setFormData({
          name: '',
          detailview: '',
          fälligkeitsdatum: null,
          nextJob: 'Brainstorming',
          priority: 'Normal',
          publishDate: null,
        });
      }
    }
  }, [isOpen, task, mode]);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    setFormData({ ...formData, detailview: newText });

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        name: formData.name,
        detailview: formData.detailview,
        fälligkeitsdatum: formData.fälligkeitsdatum?.toISOString().split('T')[0] || undefined,
        nextJob: formData.nextJob,
        priority: formData.priority,
        publishDate: formData.publishDate?.toISOString().split('T')[0] || undefined,
        ...(parentTaskId && {
          isSubtask: true,
          parentTaskId: parentTaskId
        })
      };

      if (mode === 'create') {
        await createTask(submitData);
        toast({
          title: parentTaskId ? "Unteraufgabe erstellt" : "Aufgabe erstellt",
          description: parentTaskId ? "Die neue Unteraufgabe wurde erfolgreich erstellt." : "Die neue Aufgabe wurde erfolgreich erstellt.",
        });
      } else if (mode === 'edit' && task) {
        await updateTask(task.id, submitData);
        toast({
          title: "Aufgabe aktualisiert",
          description: "Die Aufgabe wurde erfolgreich aktualisiert.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast({
        title: "Fehler beim Speichern",
        description: error instanceof Error ? error.message : "Die Aufgabe konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' 
              ? (parentTaskId ? 'Neue Unteraufgabe erstellen' : 'Neue Aufgabe erstellen')
              : 'Aufgabe bearbeiten'
            }
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? (parentTaskId 
                  ? 'Erstelle eine neue Unteraufgabe für die übergeordnete Aufgabe.'
                  : 'Erstelle eine neue Aufgabe für deine Videoplanung mit allen wichtigen Details.'
                )
              : 'Bearbeite die Details dieser Aufgabe und speichere deine Änderungen.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Aufgabenname eingeben..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextJob">Status</Label>
              <Select
                value={formData.nextJob}
                onValueChange={(value) => setFormData({ ...formData, nextJob: value })}
              >
                <SelectTrigger className={cn(
                  "h-9 px-3 py-2 text-sm w-full",
                  "bg-background border border-input"
                )}>
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  {nextJobOptions.map((option) => (
                    <SelectItem 
                      key={option} 
                      value={option}
                      className={cn("text-sm", getStatusColor(option))}
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className={cn(
                  "h-9 px-3 py-2 text-sm w-full",
                  "bg-background border border-input"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fälligkeit</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.fälligkeitsdatum && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fälligkeitsdatum ? (
                      format(formData.fälligkeitsdatum, "PPP", { locale: de })
                    ) : (
                      <span>Datum auswählen</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.fälligkeitsdatum || undefined}
                    onSelect={(date) => setFormData({ ...formData, fälligkeitsdatum: date || null })}
                    locale={de}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Veröffentlichungsdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.publishDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.publishDate ? (
                      format(formData.publishDate, "PPP", { locale: de })
                    ) : (
                      <span>Datum auswählen</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.publishDate || undefined}
                    onSelect={(date) => setFormData({ ...formData, publishDate: date || null })}
                    locale={de}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detailview">Beschreibung</Label>
            
            {/* Markdown Editor Toolbar */}
            <div className="flex items-center gap-1 p-2 border rounded-t-md bg-muted/30">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('**', '**')}
                className="h-8 w-8 p-0"
                title="Fett"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('*', '*')}
                className="h-8 w-8 p-0"
                title="Kursiv"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('[', '](url)')}
                className="h-8 w-8 p-0"
                title="Link"
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('- ', '')}
                className="h-8 w-8 p-0"
                title="Liste"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('1. ', '')}
                className="h-8 w-8 p-0"
                title="Nummerierte Liste"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
            
            <Textarea
              id="detailview"
              value={formData.detailview}
              onChange={(e) => setFormData({ ...formData, detailview: e.target.value })}
              placeholder="Beschreibung der Aufgabe..."
              className="min-h-[200px] font-mono rounded-t-none border-t-0"
              ref={textareaRef}
            />
            <p className="text-xs text-muted-foreground">
              Verwende die Buttons oben für Formatierung oder schreibe Markdown direkt
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}