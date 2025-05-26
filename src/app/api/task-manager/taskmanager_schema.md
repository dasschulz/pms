# TaskManager Table Schema for Airtable

## Table: TaskManager

This table stores video planning tasks for the videoplanung feature.

### Required Fields:

| Field Name | Field Type | Description | Required |
|------------|------------|-------------|----------|
| **Task-ID** | Auto Number | Automatically incremented unique task ID | Yes |
| **Name** | Single line text | Task name/title | Yes |
| **UserID** | Link to another record | Links to Users table records | Yes |
| **Detailview** | Long text | Detailed task description | No |
| **IsSubtask** | Checkbox | Whether this is a subtask | No |
| **ParentTaskID** | Link to another record | Links to parent TaskManager records | No |
| **Fälligkeitsdatum** | Date | Due date for the task | No |
| **NextJob** | Single select | Current status/stage of the task | No |
| **Priority** | Single select | Task priority level | No |
| **PublishDate** | Date | Planned publication date | No |
| **SortOrder** | Number | Order for sorting tasks | No |
| **CreatedDate** | Date | Date when task was created | No |
| **ModifiedDate** | Date | Date when task was last modified | No |

### Single Select Options:

#### NextJob Field Options:
- Brainstorming
- Skript
- Dreh
- Schnitt
- Veröffentlichung
- Erledigt

#### Priority Field Options:
- Dringend
- Hoch
- Normal
- Niedrig
- -

### Relationships:
- **UserID** field links to the **Users** table (tblmRrA9DEFEuuYi1)
- **ParentTaskID** field links to the same **TaskManager** table (for subtasks)

### Notes:
- The table must be named exactly "TaskManager"
- The UserID field should be a linked record field that allows multiple records
- The ParentTaskID field should be a linked record field that allows multiple records
- Default values can be set in Airtable for better UX

### API Endpoints:
- **GET** `/api/task-manager` - Fetch user tasks
- **POST** `/api/task-manager` - Create new task
- **PUT** `/api/task-manager` - Update existing task
- **DELETE** `/api/task-manager` - Delete task

### Filter Logic:
Tasks are filtered by user using: `FIND("${userAirtableId}", ARRAYJOIN({UserID}))`

This allows for flexible user assignment including potential shared tasks in the future. 