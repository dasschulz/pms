ALTER TABLE task_manager DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only see their own tasks" ON task_manager;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON task_manager;
DROP POLICY IF EXISTS "Users can update their own tasks" ON task_manager;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON task_manager; 