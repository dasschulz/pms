# User Preferences Table Schema

## Table: user_preferences (Supabase)

This table stores user-specific preferences and settings for the MdB application.

### Schema Definition

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated unique identifier |
| `user_id` | UUID | FOREIGN KEY | References users.id |
| `preference_key` | TEXT | NOT NULL | The preference setting name |
| `preference_value` | TEXT | | The preference value (JSON string for complex values) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the preference was created |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | When the preference was last updated |
| `legacy_id` | TEXT | | Legacy tracking field for data lineage |

### Indexes

- Primary key on `id`
- Foreign key on `user_id` → `users.id`
- Unique constraint on `(user_id, preference_key)`
- Index on `user_id` for fast user lookups

### Common Preference Keys

- `theme` - UI theme preference (light/dark)
- `language` - Language preference
- `notifications_email` - Email notification settings
- `notifications_push` - Push notification settings
- `dashboard_layout` - Dashboard widget configuration

### Example Usage

```sql
-- Get user's theme preference
SELECT preference_value 
FROM user_preferences 
WHERE user_id = $1 AND preference_key = 'theme';

-- Set user's notification preferences
INSERT INTO user_preferences (user_id, preference_key, preference_value)
VALUES ($1, 'notifications_email', 'true')
ON CONFLICT (user_id, preference_key)
DO UPDATE SET preference_value = EXCLUDED.preference_value, updated_at = NOW();
```

### RLS (Row Level Security)

```sql
-- Users can only access their own preferences
CREATE POLICY "Users can access own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
``` 