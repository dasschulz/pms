import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  console.log('TaskManager API: Starting GET request');
  
  if (!process.env.AIRTABLE_PAT) {
    console.error('TaskManager API: AIRTABLE_PAT not configured');
    return NextResponse.json({ error: 'Airtable configuration missing' }, { status: 500 });
  }
  if (!process.env.AIRTABLE_BASE_ID) {
    console.error('TaskManager API: AIRTABLE_BASE_ID not configured');
    return NextResponse.json({ error: 'Airtable base ID missing' }, { status: 500 });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  // console.log('TaskManager API: Token check:', !!token, !!token?.id);

  if (!token || !token.id) {
    console.log('TaskManager API: No valid token found, denying access.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string; // This is the numeric UserID from your Users table (e.g., "1")
  // console.log('TaskManager API: User ID (from token, numeric):', userId);

  try {
    // We don't need to fetch userAirtableId if filtering by numeric userId directly in TaskManager
    // const userRecords = await base('Users').select({ filterByFormula: `{UserID} = ${userId}`, maxRecords: 1 }).firstPage();
    // if (userRecords.length === 0) {
    //   console.log('TaskManager API: User not found in Airtable Users table');
    //   return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    // }
    // const userAirtableId = userRecords[0].id;
    // console.log('TaskManager API: User Airtable ID (for filtering tasks):', userAirtableId);

    // console.log('TaskManager API: Fetching tasks from TaskManager table');
    
    try {
      const filterFormula = `{fldirhqhpcbGphbdD} = ${userId}`;
      // console.log('TaskManager API: Using filter formula (lookup field):', filterFormula);
      
      let records = await base('TaskManager')
        .select({
          filterByFormula: filterFormula,
          sort: [{ field: ' SortOrder ', direction: 'asc' }],
        })
        .all();
      
      // console.log('TaskManager API: Records found by Airtable (before mapping):', records.length);
      
      const tasks = records.map(record => ({
        id: record.id,
        taskId: record.get('Task-ID ') as number,
        name: record.get(' Name ') as string,
        detailview: record.get(' Detailview ') as string || '',
        isSubtask: record.get(' IsSubtask ') as boolean || false,
        parentTaskId: record.get(' ParentTaskID ') as string[] || null,
        fälligkeitsdatum: record.get(' Fälligkeitsdatum ') as string || null,
        nextJob: record.get(' NextJob ') as string || 'Brainstorming',
        priority: record.get(' Priority ') as string || 'Normal',
        publishDate: record.get(' PublishDate ') as string || null,
        sortOrder: record.get(' SortOrder ') as number || 0,
        createdDate: record.get(' CreatedDate ') as string,
        modifiedDate: record.get(' ModifiedDate') as string,
      }));

      // console.log('TaskManager API: Tasks processed and returning to client:', tasks.length);
      return NextResponse.json({ tasks });
      
    } catch (sortError: any) {
      if (sortError?.error === 'UNKNOWN_FIELD_NAME' && sortError?.message?.includes('SortOrder')) {
        // console.log('TaskManager API: SortOrder field not found, fetching without sort');
        const filterFormula = `{fldirhqhpcbGphbdD} = ${userId}`;
        // console.log('TaskManager API: Using filter formula (no sort, lookup field):', filterFormula);
        
        let records = await base('TaskManager')
          .select({
            filterByFormula: filterFormula,
          })
          .all();
        
        // console.log('TaskManager API: Records found by Airtable (no sort, before mapping):', records.length);
        
        const tasks = records.map(record => ({
          id: record.id,
          taskId: record.get('Task-ID ') as number,
          name: record.get(' Name ') as string,
          detailview: record.get(' Detailview ') as string || '',
          isSubtask: record.get(' IsSubtask ') as boolean || false,
          parentTaskId: record.get(' ParentTaskID ') as string[] || null,
          fälligkeitsdatum: record.get(' Fälligkeitsdatum ') as string || null,
          nextJob: record.get(' NextJob ') as string || 'Brainstorming',
          priority: record.get(' Priority ') as string || 'Normal',
          publishDate: record.get(' PublishDate ') as string || null,
          sortOrder: 0, 
          createdDate: record.get(' CreatedDate ') as string,
          modifiedDate: record.get(' ModifiedDate') as string,
        }));

        // console.log('TaskManager API: Tasks processed (no sort) and returning to client:', tasks.length);
        return NextResponse.json({ tasks });
      } else {
        console.error('TaskManager API: Error during task fetch (could be sort or other issue):', sortError);
        throw sortError;
      }
    }
  } catch (error) {
    console.error('TaskManager API: General Airtable API Error fetching tasks:', error);
    if (error instanceof Error) {
      console.error('TaskManager API: Error message:', error.message);
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json({ error: 'TaskManager table not found. Please check table name.' }, { status: 500 });
      }
      if (error.message.includes('INVALID_PERMISSIONS')) {
        return NextResponse.json({ error: 'Insufficient permissions for Airtable. Check API key.' }, { status: 500 });
      }
      if (error.message.includes('AUTHENTICATION_REQUIRED')) {
        return NextResponse.json({ error: 'Airtable authentication failed. Check API key.' }, { status: 500 });
      }
    }
    return NextResponse.json({ 
      error: 'Failed to fetch tasks', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // console.log('TaskManager API: Starting POST request (create task)');
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    // console.log('TaskManager API: No valid token for POST request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id as string;
  // console.log('TaskManager API: Creating task for user:', userId);

  try {
    // console.log('TaskManager API: Fetching user from Airtable for task creation');
    const userRecords = await base('Users')
      .select({
        filterByFormula: `{UserID} = ${userId}`,
        maxRecords: 1,
      })
      .firstPage();

    // console.log('TaskManager API: User records found for creation:', userRecords.length);

    if (userRecords.length === 0) {
      // console.log('TaskManager API: User not found for task creation');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userAirtableId = userRecords[0].id;
    // console.log('TaskManager API: User Airtable ID for creation:', userAirtableId);
    
    const requestData = await req.json();
    // console.log('TaskManager API: Request data for task creation:', requestData);
    
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
    } = requestData;

    const createFields: any = {
      ' Name ': name,
      ' UserID ': [userAirtableId],
      ' NextJob ': nextJob || 'Brainstorming',
      ' Priority ': priority || 'Normal',
      ' CreatedDate ': new Date().toISOString().split('T')[0],
      ' ModifiedDate': new Date().toISOString().split('T')[0],
      ' SortOrder ': sortOrder || 0,
    };

    if (detailview) createFields[' Detailview '] = detailview;
    if (isSubtask) createFields[' IsSubtask '] = isSubtask;
    if (parentTaskId) createFields[' ParentTaskID '] = [parentTaskId];
    if (fälligkeitsdatum) createFields[' Fälligkeitsdatum '] = fälligkeitsdatum;
    if (publishDate) createFields[' PublishDate '] = publishDate;

    // console.log('TaskManager API: Creating task with fields:', createFields);

    const record = await base('TaskManager').create([{
      fields: createFields
    }]);

    // console.log('TaskManager API: Task created successfully:', record[0].id);

    const newTask = record[0];
    const responseData = {
      id: newTask.id,
      taskId: newTask.get('Task-ID '),
      name: newTask.get(' Name '),
      detailview: newTask.get(' Detailview ') || '',
      isSubtask: newTask.get(' IsSubtask ') || false,
      parentTaskId: newTask.get(' ParentTaskID ') || null,
      fälligkeitsdatum: newTask.get(' Fälligkeitsdatum ') || null,
      nextJob: newTask.get(' NextJob ') || 'Brainstorming',
      priority: newTask.get(' Priority ') || 'Normal',
      publishDate: newTask.get(' PublishDate ') || null,
      sortOrder: newTask.get(' SortOrder ') || 0,
      createdDate: newTask.get(' CreatedDate '),
      modifiedDate: newTask.get(' ModifiedDate'),
    };

    // console.log('TaskManager API: Returning created task:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('TaskManager API: Airtable API Error creating task:', error);
    if (error instanceof Error) {
      console.error('TaskManager API: Create error message:', error.message);
      // console.error('TaskManager API: Create error stack:', error.stack);
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json({ 
          error: 'TaskManager table not found. Please check table name in Airtable.',
          details: error.message 
        }, { status: 500 });
      }
      if (error.message.includes('INVALID_PERMISSIONS')) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to create task. Please check API key permissions.',
          details: error.message 
        }, { status: 500 });
      }
      if (error.message.includes('AUTHENTICATION_REQUIRED')) {
        return NextResponse.json({ 
          error: 'Airtable authentication failed. Please check API key.',
          details: error.message 
        }, { status: 500 });
      }
      if (error.message.includes('UNKNOWN_FIELD_NAME')) {
        return NextResponse.json({ 
          error: 'Invalid field name in TaskManager table. Please check table schema.',
          details: error.message 
        }, { status: 500 });
      }
    }
    return NextResponse.json({ 
      error: 'Failed to create task', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestData = await req.json();
    const { id, ...updateData } = requestData;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updateFields: any = {
      ' ModifiedDate': new Date().toISOString().split('T')[0], // ModifiedDate field
    };

    // Map the update data to Airtable fields
    if (updateData.name !== undefined) updateFields[' Name '] = updateData.name; // Name field
    if (updateData.detailview !== undefined) updateFields[' Detailview '] = updateData.detailview; // Detailview field
    if (updateData.isSubtask !== undefined) updateFields[' IsSubtask '] = updateData.isSubtask; // IsSubtask field
    if (updateData.parentTaskId !== undefined) {
      updateFields[' ParentTaskID '] = updateData.parentTaskId ? [updateData.parentTaskId] : null; // ParentTaskID field
    }
    if (updateData.fälligkeitsdatum !== undefined) updateFields[' Fälligkeitsdatum '] = updateData.fälligkeitsdatum; // Fälligkeitsdatum field
    if (updateData.nextJob !== undefined) updateFields[' NextJob '] = updateData.nextJob; // NextJob field
    if (updateData.priority !== undefined) updateFields[' Priority '] = updateData.priority; // Priority field
    if (updateData.publishDate !== undefined) updateFields[' PublishDate '] = updateData.publishDate; // PublishDate field
    if (updateData.sortOrder !== undefined) updateFields[' SortOrder '] = updateData.sortOrder; // SortOrder field

    const updatedRecord = await base('TaskManager').update([{
      id: id,
      fields: updateFields
    }]);

    const task = updatedRecord[0];
    return NextResponse.json({
      id: task.id,
      taskId: task.get('Task-ID '), // Task-ID field
      name: task.get(' Name '), // Name field
      detailview: task.get(' Detailview ') || '', // Detailview field
      isSubtask: task.get(' IsSubtask ') || false, // IsSubtask field
      parentTaskId: task.get(' ParentTaskID ') || null, // ParentTaskID field
      fälligkeitsdatum: task.get(' Fälligkeitsdatum ') || null, // Fälligkeitsdatum field
      nextJob: task.get(' NextJob ') || 'Brainstorming', // NextJob field
      priority: task.get(' Priority ') || 'Normal', // Priority field
      publishDate: task.get(' PublishDate ') || null, // PublishDate field
      sortOrder: task.get(' SortOrder ') || 0, // SortOrder field
      createdDate: task.get(' CreatedDate '), // CreatedDate field
      modifiedDate: task.get(' ModifiedDate'), // ModifiedDate field
    });
  } catch (error) {
    console.error('Airtable API Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await base('TaskManager').destroy([id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Airtable API Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 