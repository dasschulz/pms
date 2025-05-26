import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, CreateTaskData, UpdateTaskData } from '@/types/videoplanung';

async function fetchTasks(): Promise<Task[]> {
  const response = await fetch('/api/task-manager');
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  const data = await response.json();
  return data.tasks;
}

async function createTask(taskData: CreateTaskData): Promise<Task> {
  const response = await fetch('/api/task-manager', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  
  if (!response.ok) {
    // Try to get more detailed error information from the response
    try {
      const errorData = await response.json();
      const errorMessage = errorData.details ? 
        `${errorData.error}: ${errorData.details}` : 
        (errorData.error || 'Failed to create task');
      throw new Error(errorMessage);
    } catch (parseError) {
      // If we can't parse the error response, fall back to basic error
      throw new Error(`Failed to create task (HTTP ${response.status})`);
    }
  }
  
  return response.json();
}

async function updateTask(id: string, updateData: UpdateTaskData): Promise<Task> {
  const response = await fetch('/api/task-manager', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...updateData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update task');
  }
  
  return response.json();
}

async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`/api/task-manager?id=${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
}

export function useTasks() {
  const queryClient = useQueryClient();

  const {
    data: tasks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    // Ensure fresh data for tasks
    staleTime: 1000 * 10, // 10 seconds - shorter for tasks to ensure table updates
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      // Optimistically update to the new value with a temporary task
      if (previousTasks) {
        const tempTask: Task = {
          id: `temp-${Date.now()}`,
          taskId: 0,
          name: newTask.name,
          detailview: newTask.detailview || '',
          isSubtask: false,
          parentTaskId: null,
          fälligkeitsdatum: newTask.fälligkeitsdatum || null,
          nextJob: (newTask.nextJob || 'Brainstorming') as Task['nextJob'],
          priority: (newTask.priority || 'Normal') as Task['priority'],
          publishDate: newTask.publishDate || null,
          sortOrder: 0,
          createdDate: new Date().toISOString().split('T')[0],
          modifiedDate: new Date().toISOString().split('T')[0],
        };
        queryClient.setQueryData<Task[]>(['tasks'], [...previousTasks, tempTask]);
      }

      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch tasks to get the actual server data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.refetchQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...updateData }: { id: string } & UpdateTaskData) =>
      updateTask(id, updateData),
    onMutate: async ({ id, ...updateData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      // Optimistically update the task
      if (previousTasks) {
        const updatedTasks = previousTasks.map(task => {
          if (task.id === id) {
            const updatedTask: Task = {
              ...task,
              // Apply updates with proper type casting
              ...(updateData.name !== undefined && { name: updateData.name }),
              ...(updateData.detailview !== undefined && { detailview: updateData.detailview }),
              ...(updateData.isSubtask !== undefined && { isSubtask: updateData.isSubtask }),
              ...(updateData.fälligkeitsdatum !== undefined && { fälligkeitsdatum: updateData.fälligkeitsdatum }),
              ...(updateData.nextJob !== undefined && { nextJob: updateData.nextJob as Task['nextJob'] }),
              ...(updateData.priority !== undefined && { priority: updateData.priority as Task['priority'] }),
              ...(updateData.publishDate !== undefined && { publishDate: updateData.publishDate }),
              ...(updateData.sortOrder !== undefined && { sortOrder: updateData.sortOrder }),
              // Handle parentTaskId properly
              parentTaskId: updateData.parentTaskId ? [updateData.parentTaskId] : task.parentTaskId,
            };
            return updatedTask;
          }
          return task;
        });
        queryClient.setQueryData<Task[]>(['tasks'], updatedTasks);
      }

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch tasks to get the actual server data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.refetchQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      // Optimistically remove the task
      if (previousTasks) {
        const filteredTasks = previousTasks.filter(task => task.id !== taskId);
        queryClient.setQueryData<Task[]>(['tasks'], filteredTasks);
      }

      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch tasks to get the actual server data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.refetchQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks: tasks || [],
    isLoading,
    error,
    refetch,
    createTask: createTaskMutation.mutateAsync,
    updateTask: (id: string, updateData: UpdateTaskData) =>
      updateTaskMutation.mutateAsync({ id, ...updateData }),
    deleteTask: deleteTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
} 