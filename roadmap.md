--> Videoplanung Page:

We want to display tables for each NextJob category, starting with Erledigt, then Veröffentlichung, Schnitt, Dreh, Skript, Brainstorming. Each table should be collapsible, with the Erledigt table being closed by default, everything else being opened by default.

--
Heading (Status)
Name | Fälligkeitsdatum | Nächster Job (NextJob) | Collab? | Priorität | VÖ-Datum


- Rows should be drag- and droppable, not just with their own status' table, but across tables
- To the left of name, show drag and drop indicator, selection box, and, if subtasks exist, collapsible indicator
- if 
- When a status of a row is changed, the row should then subsequently render in it's new associated table. 
- On click, the task should open in a modal. For Content of a task, we want to use a markdown editor.
- subtasks work and get saved just like regular tasks. They get show beneath regular tasks if rowstate is open
- NextJob select options and displayed options should follow color scheme: Brainstorming colorless, Skript Dark Red, Dreh light red, Schnitt Yellow, Veröffentlichung green, Erledigt white
- we want users to be able to sort columns in tables, edit fields in table view and modal view.

Schema suggestion

ID | Name | Detailview | IsSubtask | ParentTaskID | Fälligkeitsdatum | NextJob | Verantwortlicher | Priority | PublishDate | SortOrder | UserID | CreatedDate | ModifiedDate

ID: Autonumber
Name: Single line text (required)
Detailview: Long text (for markdown content)
IsSubtask: Checkbox/Boolean
ParentTaskID: Link to another record (self-referencing to same table)
Fälligkeitsdatum: Date (due date)
NextJob: Single select - Brainstorming, Skript, Dreh, Schnitt, Veröffentlichung, Erledigt
Verantwortlicher: Single line text (responsible person - seen in screenshot)
Priority: Single select - Dringend, Hoch, Normal, Niedrig
PublishDate: Date (VÖ-Datum from requirements)
SortOrder: Number (for drag-and-drop ordering within each status group)
UserID: Link to another record (Users table) or Single line text
CreatedDate: Created time (auto-generated)
ModifiedDate: Last modified time (auto-generated)

Notes on schema changes:
- Removed "Subtasks" field as it's redundant with ParentTaskID relationship
- Fixed PublishDate field type (was incorrectly showing Priority values)
- Added "Verantwortlicher" field visible in screenshot
- Renamed "Collab" to "Verantwortlicher" for clarity
- Changed "ID-Order" to "SortOrder" with Number type for better drag-drop handling
- Added audit fields (CreatedDate, ModifiedDate) for tracking
- Made ParentTaskID a proper link field for better relational integrity
- Removed Priority field options trailing dash
- Made UserID a link field for better user management