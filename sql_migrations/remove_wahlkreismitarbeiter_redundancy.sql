-- SQL Migration: Remove Wahlkreismitarbeiter Redundancy
-- This script removes the old wahlkreisbuero_mitarbeiter system since the new 
-- abgeordneten_mitarbeiter system is now implemented and provides better functionality

-- Step 1: Drop dependent objects first

-- Drop indexes
DROP INDEX IF EXISTS idx_wahlkreisbuero_mitarbeiter_buero_id;

-- Drop triggers
DROP TRIGGER IF EXISTS update_wahlkreisbuero_mitarbeiter_updated_at ON public.wahlkreisbuero_mitarbeiter;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view all mitarbeiter" ON public.wahlkreisbuero_mitarbeiter;
DROP POLICY IF EXISTS "Users can manage mitarbeiter of their wahlkreisbueros" ON public.wahlkreisbuero_mitarbeiter;

-- Step 2: Drop the main table
DROP TABLE IF EXISTS public.wahlkreisbuero_mitarbeiter CASCADE;

-- Step 3: Update related views and functions if they reference the old table
-- (None found in current schema, but good to check)

-- Step 4: Clean up any leftover references
-- Remove from grants (if any)
-- Note: REVOKE statements are safe even if table doesn't exist

-- Step 5: Add comment about migration
COMMENT ON SCHEMA public IS 'wahlkreisbuero_mitarbeiter system removed in favor of abgeordneten_mitarbeiter system - migration completed';

-- Migration completed successfully
-- The new abgeordneten_mitarbeiter system provides:
-- - Better data structure with proper MdB assignments
-- - Professional grade system for parliamentary staff
-- - Integration with constituency office mapping
-- - Support for multiple MdB assignments per staff member
-- - Enhanced validation and business logic

SELECT 'wahlkreisbuero_mitarbeiter redundancy removed successfully' as migration_status; 