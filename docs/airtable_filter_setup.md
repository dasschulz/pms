# Supabase RLS (Row Level Security) Setup

## Overview

Row Level Security (RLS) in Supabase provides fine-grained access control at the database level, ensuring users can only access data they're authorized to see.

## Common RLS Patterns

### 1. User-Specific Data Access

For tables where users should only see their own data:

```sql
-- Enable RLS on the table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for users to access only their own data
CREATE POLICY "Users can access own data" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Role-Based Access

For tables with role-based permissions:

```sql
-- Enable RLS
ALTER TABLE task_manager ENABLE ROW LEVEL SECURITY;

-- Policy for users to access assigned tasks
CREATE POLICY "Users can access assigned tasks" ON task_manager
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### 3. Public Read with Protected Write

For tables that are publicly readable but have protected writes:

```sql
-- Enable RLS
ALTER TABLE bpa_fahrten ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON bpa_fahrten
  FOR SELECT USING (aktiv = true);

-- Protected write access
CREATE POLICY "MdB write access" ON bpa_fahrten
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'MdB'
    )
  );
```

## Implementation Steps

1. **Enable RLS on each table**
2. **Create specific policies** for different access patterns
3. **Test policies** with different user roles
4. **Monitor performance** and optimize as needed

## Benefits over Traditional Filters

- **Database-level security** - Cannot be bypassed by client code
- **Automatic enforcement** - Applied to all queries automatically  
- **Performance optimized** - PostgreSQL query planner integration
- **Audit trail** - Built-in logging of policy applications 