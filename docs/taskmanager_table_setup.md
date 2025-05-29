# TaskManager Table Setup for Supabase

## Database Schema

### Table: task_manager

Create the task_manager table in Supabase with the following structure:

```sql
CREATE TABLE task_manager (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  beschreibung TEXT,
  priority TEXT DEFAULT 'Mittel' CHECK (priority IN ('Niedrig', 'Mittel', 'Hoch', 'Urgent')),
  status TEXT DEFAULT 'Offen' CHECK (status IN ('Offen', 'In Bearbeitung', 'Warten auf Feedback', 'Abgeschlossen', 'Abgebrochen')),
  due_date DATE,
  category TEXT CHECK (category IN ('Kleine Anfrage', 'Pressemitteilung', 'Rede', 'Termine', 'Korrespondenz', 'Sonstiges')),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  legacy_id TEXT -- For data lineage tracking
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_task_manager_user_id ON task_manager(user_id);
CREATE INDEX idx_task_manager_due_date ON task_manager(due_date);
CREATE INDEX idx_task_manager_status ON task_manager(status);
CREATE INDEX idx_task_manager_priority ON task_manager(priority);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE task_manager ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own tasks
CREATE POLICY "Users can access own tasks" ON task_manager
  FOR ALL USING (auth.uid() = user_id);

-- Policy for admins to access all tasks
CREATE POLICY "Admins can access all tasks" ON task_manager
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### Triggers

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_manager_updated_at 
    BEFORE UPDATE ON task_manager 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Set completed_at when status changes to 'Abgeschlossen'
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Abgeschlossen' AND OLD.status != 'Abgeschlossen' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'Abgeschlossen' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_task_completed_at 
    BEFORE UPDATE ON task_manager 
    FOR EACH ROW 
    EXECUTE PROCEDURE set_completed_at();
```

## API Integration

### Common Queries

```sql
-- Get user's active tasks
SELECT * FROM task_manager 
WHERE user_id = $1 
AND status NOT IN ('Abgeschlossen', 'Abgebrochen')
ORDER BY due_date ASC NULLS LAST, priority DESC;

-- Get overdue tasks
SELECT * FROM task_manager 
WHERE user_id = $1 
AND due_date < CURRENT_DATE 
AND status NOT IN ('Abgeschlossen', 'Abgebrochen');

-- Get tasks by category
SELECT * FROM task_manager 
WHERE user_id = $1 
AND category = $2
ORDER BY created_at DESC;
```

### Supabase Client Usage

```typescript
// Get user tasks
const { data: tasks, error } = await supabase
  .from('task_manager')
  .select('*')
  .eq('user_id', userId)
  .neq('status', 'Abgeschlossen')
  .order('due_date', { ascending: true, nullsFirst: false });

// Create new task
const { data: newTask, error } = await supabase
  .from('task_manager')
  .insert({
    task_name: 'New Task',
    beschreibung: 'Task description',
    priority: 'Hoch',
    user_id: userId
  })
  .select()
  .single();

// Update task status
const { data: updatedTask, error } = await supabase
  .from('task_manager')
  .update({ status: 'Abgeschlossen' })
  .eq('id', taskId)
  .select()
  .single();
```

## Migration Notes

- Legacy `airtable_id` field preserved for data lineage
- All enum values translated to German
- Maintains existing API compatibility
- RLS provides automatic user filtering

## Critical: Table Missing from Current Schema

The TaskManager table does **NOT** exist in the current Airtable base. This table must be created before the videoplanung feature will work.

## Step-by-Step Setup Instructions

### 1. Create the TaskManager Table

1. Go to your Airtable base
2. Click the "+" button to add a new table
3. Name it exactly: **TaskManager**

### 2. Create Required Fields

Create these fields in the exact order and with exact names:

| Field Name | Field Type | Options/Settings | Required |
|------------|------------|------------------|----------|
| **Task-ID** | Auto number | - | Yes |
| **Name** | Single line text | - | Yes |
| **UserID** | Link to another record | Link to: Users table | Yes |
| **Detailview** | Long text | - | No |
| **IsSubtask** | Checkbox | - | No |
| **ParentTaskID** | Link to another record | Link to: TaskManager table (same table) | No |
| **Fälligkeitsdatum** | Date | - | No |
| **NextJob** | Single select | See options below | No |
| **Priority** | Single select | See options below | No |
| **PublishDate** | Date | - | No |
| **SortOrder** | Number | Integer, allow negative | No |
| **CreatedDate** | Date | - | No |
| **ModifiedDate** | Date | - | No |

### 3. Single Select Options

#### NextJob Field Options:
Add these exact options (case-sensitive):
- Brainstorming
- Skript
- Dreh
- Schnitt
- Veröffentlichung
- Erledigt

#### Priority Field Options:
Add these exact options (case-sensitive):
- Dringend
- Hoch
- Normal
- Niedrig
- -

### 4. Field Configuration Details

#### UserID Field:
- **Type**: Link to another record
- **Link to**: Users table (tblmRrA9DEFEuuYi1)
- **Allow linking to multiple records**: Yes
- **Limit to a view**: (leave blank)

#### ParentTaskID Field:
- **Type**: Link to another record  
- **Link to**: TaskManager table (same table you're creating)
- **Allow linking to multiple records**: Yes
- **Limit to a view**: (leave blank)

### 5. Important Notes

- **Field names are case-sensitive** - they must match exactly
- **Do not change the field order** after creation
- The **Task-ID** field will auto-increment starting from 1
- **UserID** links to the Users table to associate tasks with users
- **ParentTaskID** allows creating subtasks that reference parent tasks

### 6. Verification

After creating the table, verify:
1. The table name is exactly "TaskManager"
2. All required fields exist with correct names
3. Single select options are configured properly
4. Link fields point to the correct tables

### 7. User Authentication Fix

**Important**: The API has been updated to use the `UserID` field for user lookup, since NextAuth provides numeric user IDs.

The NextAuth integration provides numeric user IDs as identifiers, so the API now filters users by:
```
{UserID} = 1
```

This ensures proper user-to-task association in the TaskManager table by matching the numeric UserID from NextAuth to the autoNumber UserID field in the Users table.

## Testing

Once the table is created:
1. Try creating a new task in the videoplanung interface
2. Check that the task appears in the TaskManager table
3. Verify that the UserID field properly links to your user record
4. Test editing and deleting tasks

## Troubleshooting

If you still get errors after setup:
1. Double-check all field names (case-sensitive)
2. Ensure Single select options match exactly
3. Verify link fields point to correct tables
4. Check that your user exists in the Users table with a valid Email field 