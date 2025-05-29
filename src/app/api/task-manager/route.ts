import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  console.log('TaskManager API: Starting GET request');
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  // console.log('TaskManager API: Token check:', !!token, !!token?.id);

  if (!token || !token.id) {
    console.log('TaskManager API: No valid token found, denying access.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string; // This is now the Supabase UUID
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
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    console.log('TaskManager API: Found', records?.length || 0, 'tasks');

    // Transform Supabase records to match expected format
    const tasks = records?.map((record) => ({
      id: record.id, // Use Supabase UUID for frontend operations
      supabaseId: record.id, // Include Supabase UUID
      name: record.name,
      description: record.description,
      priority: record.priority,
      nextJob: record.next_job,
      deadline: record.deadline,
      completed: record.completed,
      userId: record.user_id,
      createdAt: record.created_at,
    })) || [];

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('TaskManager API: Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('TaskManager API: Starting POST request');
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string; // This is now the Supabase UUID

  try {
    const body = await req.json();
    const { name, description, priority, nextJob, deadline } = body;

    console.log('TaskManager API: Creating task:', { name, description, priority, nextJob, deadline });

    // Create task in Supabase
    const { data: newTask, error } = await supabase
      .from('task_manager')
      .insert({
        user_id: userId,
        name,
        description: description || null,
        priority: priority || 'Normal',
        next_job: nextJob || 'Brainstorming',
        deadline: deadline || null,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('TaskManager API: Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    console.log('TaskManager API: Task created successfully:', newTask.id);

    // Transform response to match expected format
    const task = {
      id: newTask.auto_id || newTask.id,
      supabaseId: newTask.id,
      name: newTask.name,
      description: newTask.description,
      priority: newTask.priority,
      nextJob: newTask.next_job,
      deadline: newTask.deadline,
      completed: newTask.completed,
      userId: newTask.user_id,
      createdAt: newTask.created_at,
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error('TaskManager API: Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
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
    const { id, name, description, priority, nextJob, deadline, completed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    console.log('TaskManager API: Updating task:', id);

    // First check if the task belongs to the user
    const { data: existingTask, error: fetchError } = await supabase
      .from('task_manager')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTask) {
      console.log('TaskManager API: Task not found or access denied:', id);
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    // Update the task
    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (priority !== undefined) updateFields.priority = priority;
    if (nextJob !== undefined) updateFields.next_job = nextJob;
    if (deadline !== undefined) updateFields.deadline = deadline;
    if (completed !== undefined) updateFields.completed = completed;

    const { data: updatedTask, error: updateError } = await supabase
      .from('task_manager')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('TaskManager API: Error updating task:', updateError);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    console.log('TaskManager API: Task updated successfully:', updatedTask.id);

    // Transform response to match expected format
    const task = {
      id: updatedTask.auto_id || updatedTask.id,
      supabaseId: updatedTask.id,
      name: updatedTask.name,
      description: updatedTask.description,
      priority: updatedTask.priority,
      nextJob: updatedTask.next_job,
      deadline: updatedTask.deadline,
      completed: updatedTask.completed,
      userId: updatedTask.user_id,
      createdAt: updatedTask.created_at,
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error('TaskManager API: Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    console.log('TaskManager API: Task deleted successfully:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('TaskManager API: Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 