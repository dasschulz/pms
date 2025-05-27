### Videoplanung ###

    #1 Drag and drop ✅ COMPLETED
        Implement drag and drop functionality for existing indicators. Users should be able to drag tasks to reorder them within the same status column.
        IMPLEMENTED: Added full drag-and-drop functionality using @dnd-kit library. Features include:
        - Draggable GripVertical icons with proper cursor states (grab/grabbing)
        - Visual feedback during dragging (opacity changes)
        - Smooth animations and transitions
        - Collision detection and drop zones
        - Integration with existing onTaskMove callback for persistence
        - Toast notifications for successful reordering
        - Proper sensor configuration with distance threshold to prevent accidental drags
        - Works seamlessly with existing sorting and selection functionality

    #2 Give a bit more room to Nächster Job cells - you can make Name cell smaller in return