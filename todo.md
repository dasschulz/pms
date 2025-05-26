### Videoplanung ###

    #1 Sorta cool! ✅ COMPLETED
        Users should have the option to sort by name or date or any other column. this should translate to all other tables on the page.
        IMPLEMENTED: Added clickable table headers with sorting icons (↑↓) that allow sorting by Name, Fälligkeit, Nächster Job, Priorität, and VÖ-Datum. Sorting works in both ascending and descending order with proper type-aware comparison for dates, priorities, and status order.

    #2 Edit multiple ✅ COMPLETED
        We have selection boxes next to the drag and drop indicators. Currently, they do not do anything.
        If one or more are checked, animate in Floating Action Buttons in center bottom of screen to perform an action for all checked rows. (1: Delete all, 2: Set nextjob for all, 3: Priorität change)
            --> for all three, use icons indicating functionality
            --> ensure the api gets the correct put request for all changes
        IMPLEMENTED: Added floating action buttons that appear when tasks are selected. Features include:
        - Animated floating panel in bottom-right corner showing selection count
        - "Als erledigt markieren" button (moves tasks to "Erledigt" status)
        - Bulk "Nächster Job" change buttons for all status options
        - Bulk "Priorität" change buttons for all priority levels
        - Proper loading states, error handling, and toast notifications
        - All actions use proper API calls with PUT requests for bulk updates

    #3 NewTasks ✅ COMPLETED
        Allow new Tasks to be created inline. Below all other instances (subtables, such as Skript, Dreh...) there should always be 1 somewhat greyed out version of a new task that changes colors to active as soon as user interacts at the last line. I've provided screenshots for both task and subtask previews.
        IMPLEMENTED: Added inline task creation functionality with greyed-out phantom rows. Features include:
        - Greyed-out "Neue Aufgabe hinzufügen..." row at the bottom of each status table
        - Row becomes active with full colors when clicked
        - Input field with auto-focus for task name entry
        - Save/cancel buttons with proper keyboard shortcuts (Enter to save, Escape to cancel)
        - Smooth animations for row transitions
        - New tasks are automatically assigned to the current table's status
        - Proper error handling and toast notifications
        - Disabled state during task creation to prevent multiple submissions

    #4 Drag and drop!
        Currently, in the table, we have drag and drop indicators for every row, but the functionality is not there. 

    #5 Give a bit more room to Nächster Job cells - you can make Name cell smaller in return