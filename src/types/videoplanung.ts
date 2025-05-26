export interface Task {
  id: string;
  taskId: number;
  name: string;
  detailview: string;
  isSubtask: boolean;
  parentTaskId: string[] | null;
  fälligkeitsdatum: string | null;
  nextJob: 'Brainstorming' | 'Skript' | 'Dreh' | 'Schnitt' | 'Veröffentlichung' | 'Erledigt';
  priority: 'Dringend' | 'Hoch' | 'Normal' | 'Niedrig' | '-';
  publishDate: string | null;
  sortOrder: number;
  createdDate: string;
  modifiedDate: string;
}

export interface CreateTaskData {
  name: string;
  detailview?: string;
  isSubtask?: boolean;
  parentTaskId?: string;
  fälligkeitsdatum?: string;
  nextJob?: string;
  priority?: string;
  publishDate?: string;
  sortOrder?: number;
}

export interface UpdateTaskData {
  name?: string;
  detailview?: string;
  isSubtask?: boolean;
  parentTaskId?: string | null;
  fälligkeitsdatum?: string | null;
  nextJob?: string;
  priority?: string;
  publishDate?: string | null;
  sortOrder?: number;
}

export const statusOrder = ['Erledigt', 'Veröffentlichung', 'Schnitt', 'Dreh', 'Skript', 'Brainstorming'] as const;

export const nextJobOptions = [
  'Brainstorming',
  'Skript', 
  'Dreh',
  'Schnitt',
  'Veröffentlichung',
  'Erledigt'
] as const;

export const priorityOptions = [
  'Dringend',
  'Hoch',
  'Normal',
  'Niedrig',
  '-'
] as const; 