# TaskManager Table Schema for Supabase

## Table: task_manager

### Fields

1. **id** (Primary Key, UUID)
   - Supabase auto-generated UUID
   - Unique identifier for each task

2. **task_name** (Text, Required)
   - Brief title of the task
   - Examples: "Kleine Anfrage zur Digitalisierung", "Pressemitteilung Klimaschutz"

3. **beschreibung** (Long Text, Optional)
   - Detailed description of the task
   - Additional context, requirements, or notes

4. **priority** (Single Select, Required)
   - Options: "Niedrig", "Mittel", "Hoch", "Urgent"
   - Default: "Mittel"

5. **status** (Single Select, Required)
   - Options: "Offen", "In Bearbeitung", "Warten auf Feedback", "Abgeschlossen", "Abgebrochen"
   - Default: "Offen"

6. **due_date** (Date, Optional)
   - Target completion date
   - Format: YYYY-MM-DD

7. **category** (Single Select, Optional)
   - Options: "Kleine Anfrage", "Pressemitteilung", "Rede", "Termine", "Korrespondenz", "Sonstiges"
   - Helps categorize tasks by type

8. **user_id** (UUID, Required, Foreign Key)
   - References users.id
   - Links task to responsible user

9. **created_at** (Timestamp, Auto-generated)
   - Supabase auto-generated creation timestamp

10. **updated_at** (Timestamp, Auto-updated)
    - Supabase auto-updated modification timestamp

11. **completed_at** (Timestamp, Optional)
    - Timestamp when task was marked as completed
    - Set when status changes to "Abgeschlossen"

12. **airtable_id** (Text, Optional)
    - Legacy tracking field for data lineage
    - Not used in business logic

## Implementation Notes

- Use Supabase RLS (Row Level Security) for user access control
- Default values can be set in Supabase for better UX
- Index on user_id, due_date, and status for performance
- Consider adding notifications for approaching due dates

## Sample Query Patterns

### Get user's active tasks:
```sql
SELECT * FROM task_manager 
WHERE user_id = $1 
AND status NOT IN ('Abgeschlossen', 'Abgebrochen')
ORDER BY due_date ASC NULLS LAST, priority DESC;
```

### Filter by user:
Tasks are filtered by user using: `WHERE user_id = $userId` 