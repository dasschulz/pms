import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';
import type { Task } from '@/types/videoplanung';

export async function GET(req: NextRequest) {
  console.log('TaskManager API: Starting GET request');
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    console.log('TaskManager API: No valid token found, denying access.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;
  console.log('TaskManager API: Fetching tasks for userId:', userId);

  try {
    // Fetch tasks from Supabase
    const { data: records, error } = await supabase
      .from('task_manager')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('TaskManager API: Error fetching tasks from Supabase:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch tasks', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('TaskManager API: Found', records?.length || 0, 'tasks');

    // Transform Supabase records to match expected Task interface
    const tasks = records?.map((record) => ({
      id: record.id,
      taskId: record.auto_id || 0,
      name: record.name || '',
      detailview: record.description || '',
      isSubtask: false,
      parentTaskId: null,
      fälligkeitsdatum: record.deadline || null,
      nextJob: record.next_job || 'Brainstorming',
      priority: record.priority || 'Normal',
      publishDate: null,
      sortOrder: 0,
      createdDate: record.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      modifiedDate: record.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    })) || [];

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('TaskManager API: Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('TaskManager API: Starting POST request');
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;

  try {
    const body = await req.json();
    const { 
      name, 
      detailview, 
      isSubtask, 
      parentTaskId, 
      fälligkeitsdatum, 
      nextJob, 
      priority, 
      publishDate,
      sortOrder 
    } = body;

    console.log('TaskManager API: Creating task:', body);

    // Create task in Supabase with proper field mapping
    const { data: newTask, error } = await supabase
      .from('task_manager')
      .insert({
        user_id: userId,
        name: name || '',
        description: detailview || '',
        priority: priority || 'Normal',
        next_job: nextJob || 'Brainstorming',
        deadline: fälligkeitsdatum || null,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('TaskManager API: Error creating task:', error);
      return NextResponse.json({ 
        error: 'Failed to create task',
        details: error.message 
      }, { status: 500 });
    }

    console.log('TaskManager API: Task created successfully:', newTask.id);

    // Transform response to match expected Task interface
    const task = {
      id: newTask.id,
      taskId: newTask.auto_id || 0,
      name: newTask.name || '',
      detailview: newTask.description || '',
      isSubtask: false,
      parentTaskId: null,
      fälligkeitsdatum: newTask.deadline || null,
      nextJob: newTask.next_job || 'Brainstorming',
      priority: newTask.priority || 'Normal',
      publishDate: null,
      sortOrder: 0,
      createdDate: newTask.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      modifiedDate: newTask.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error('TaskManager API: Error creating task:', error);
    return NextResponse.json({ 
      error: 'Failed to create task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  console.log('TaskManager API: Starting PUT request');
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;

  try {
    const body = await req.json();
    const { 
      id, 
      name, 
      detailview, 
      isSubtask, 
      parentTaskId, 
      fälligkeitsdatum, 
      nextJob, 
      priority, 
      publishDate,
      sortOrder 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    console.log('TaskManager API: Updating task:', id, body);

    // Update task in Supabase with proper field mapping
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (detailview !== undefined) updateData.description = detailview;
    if (priority !== undefined) updateData.priority = priority;
    if (nextJob !== undefined) updateData.next_job = nextJob;
    if (fälligkeitsdatum !== undefined) updateData.deadline = fälligkeitsdatum;

    const { data: updatedTask, error } = await supabase
      .from('task_manager')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('TaskManager API: Error updating task:', error);
      return NextResponse.json({ 
        error: 'Failed to update task',
        details: error.message 
      }, { status: 500 });
    }

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    console.log('TaskManager API: Task updated successfully:', updatedTask.id);

    // Transform response to match expected Task interface
    const task = {
      id: updatedTask.id,
      taskId: updatedTask.auto_id || 0,
      name: updatedTask.name || '',
      detailview: updatedTask.description || '',
      isSubtask: false,
      parentTaskId: null,
      fälligkeitsdatum: updatedTask.deadline || null,
      nextJob: updatedTask.next_job || 'Brainstorming',
      priority: updatedTask.priority || 'Normal',
      publishDate: null,
      sortOrder: 0,
      createdDate: updatedTask.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      modifiedDate: updatedTask.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error('TaskManager API: Error updating task:', error);
    return NextResponse.json({ 
      error: 'Failed to update task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  console.log('TaskManager API: Starting DELETE request');
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    console.log('TaskManager API: Deleting task:', id);

    // Delete the task (only if it belongs to the user)
    const { error } = await supabase
      .from('task_manager')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('TaskManager API: Error deleting task:', error);
      return NextResponse.json({ 
        error: 'Failed to delete task',
        details: error.message 
      }, { status: 500 });
    }

    console.log('TaskManager API: Task deleted successfully:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('TaskManager API: Error deleting task:', error);
    return NextResponse.json({ 
      error: 'Failed to delete task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 