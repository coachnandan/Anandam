-- Add marked_by_name text column to attendance table
-- This stores the display name directly so no profile join is needed
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS marked_by_name TEXT;

-- Backfill existing rows: try to join profiles for existing UUID-based marked_by values
UPDATE attendance a
SET marked_by_name = p.full_name
FROM profiles p
WHERE a.marked_by = p.id
  AND a.marked_by_name IS NULL;
