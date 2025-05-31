-- Migration: Add videoplanung_view_mode preference to user_preferences table
-- Date: 2024
-- Description: Adds a new column to store user preference for videoplanung view mode (list/kanban)

-- Add the new column with default value 'list'
ALTER TABLE user_preferences ADD COLUMN videoplanung_view_mode TEXT DEFAULT 'list';

-- Add a check constraint to ensure only valid values are stored
ALTER TABLE user_preferences ADD CONSTRAINT check_videoplanung_view_mode CHECK (videoplanung_view_mode IN ('list', 'kanban')); 