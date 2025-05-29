-- Migration: Add expires_at column to touranfragen_links table
-- Date: 2024-01-XX
-- Description: Adds expiration timestamp support for form links

-- Add the expires_at column with timezone support
ALTER TABLE touranfragen_links 
ADD COLUMN IF NOT EXISTS expires_at timestamptz; 