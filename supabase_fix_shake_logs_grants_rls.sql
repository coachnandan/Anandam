-- =========================================================================
-- COMPLETE AUDIT & PERMISSION FIX FOR shake_logs TABLE
-- =========================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zcnwhgjhwxyypanetwzd/sql/new
-- =========================================================================

-- 1. Ensure Table Owner is correct (postgres)
ALTER TABLE public.shake_logs OWNER TO postgres;

-- 2. Verify and establish correct foreign keys
-- Drop existing constraints if they exist to avoid conflicts, then recreate cleanly.
ALTER TABLE public.shake_logs DROP CONSTRAINT IF EXISTS shake_logs_club_id_fkey;
ALTER TABLE public.shake_logs ADD CONSTRAINT shake_logs_club_id_fkey 
  FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;

ALTER TABLE public.shake_logs DROP CONSTRAINT IF EXISTS shake_logs_marked_by_fkey;
ALTER TABLE public.shake_logs ADD CONSTRAINT shake_logs_marked_by_fkey 
  FOREIGN KEY (marked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.shake_logs DROP CONSTRAINT IF EXISTS shake_logs_shake_type_id_fkey;
ALTER TABLE public.shake_logs ADD CONSTRAINT shake_logs_shake_type_id_fkey 
  FOREIGN KEY (shake_type_id) REFERENCES public.shake_types(id) ON DELETE RESTRICT;

-- 3. Verify Table Grants (fixes the "permission denied for table" error)
-- We grant SELECT, INSERT, UPDATE, DELETE to authenticated, anon, and service_role at the schema level.
-- RLS policies will handle the actual row-level access control.
GRANT ALL ON TABLE public.shake_logs TO postgres;
GRANT ALL ON TABLE public.shake_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shake_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shake_logs TO anon;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.shake_logs ENABLE ROW LEVEL SECURITY;

-- 5. Clean up any existing policies to avoid duplicates or conflicts
DROP POLICY IF EXISTS "Allow authenticated SELECT on shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow authenticated INSERT on shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow authenticated UPDATE on shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow admin DELETE on shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow authenticated full access to shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow anon full access to shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow anon read shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow anon write shake_logs" ON public.shake_logs;

-- 6. Create production-ready RLS Policies

-- SELECT: Allow authenticated users to view shake logs
CREATE POLICY "Allow authenticated SELECT on shake_logs"
  ON public.shake_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Allow authenticated users to insert shake logs
CREATE POLICY "Allow authenticated INSERT on shake_logs"
  ON public.shake_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Allow authenticated users to update shake logs
CREATE POLICY "Allow authenticated UPDATE on shake_logs"
  ON public.shake_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Allow DELETE ONLY for super_admin and admin roles (checks profiles table role)
CREATE POLICY "Allow admin DELETE on shake_logs"
  ON public.shake_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- 7. Ensure Supabase Realtime is enabled for shake_logs
-- Drop it first if already present in publication to avoid duplication errors, then add it.
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.shake_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shake_logs;

-- 8. Verify the schema and policy setup
SELECT 
    tablename, 
    rowsecurity, 
    schemaname
FROM pg_tables 
WHERE tablename = 'shake_logs' AND schemaname = 'public';

SELECT 
    policyname, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'shake_logs' AND schemaname = 'public';
