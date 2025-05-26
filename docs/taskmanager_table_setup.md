# TaskManager Table Setup for Airtable

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