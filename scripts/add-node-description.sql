-- Add description column to nodes table
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS description TEXT;
