-- =============================================================
-- CRITICAL PERMISSION FIX for shake_logs
-- 
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- URL: https://supabase.com/dashboard/project/zcnwhgjhwxyypanetwzd/sql/new
-- =============================================================

-- PROBLEM: shake_logs table exists but permissions are not set.
-- Both authenticated and anon roles get "permission denied".
-- This means NO shake is ever saved to the database.

-- STEP 1: Enable RLS (Row Level Security) on shake_logs
ALTER TABLE public.shake_logs ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop old restrictive policies if any
DROP POLICY IF EXISTS "Allow authenticated full access to shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow anon read shake_logs" ON public.shake_logs;
DROP POLICY IF EXISTS "Allow anon write shake_logs" ON public.shake_logs;

-- STEP 3: Create permissive policies for authenticated users (the app uses auth)
CREATE POLICY "Allow authenticated full access to shake_logs"
  ON public.shake_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- STEP 4: Also allow anon role (needed for local dev / initial page load before auth)
CREATE POLICY "Allow anon full access to shake_logs"
  ON public.shake_logs
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- STEP 5: Enable RLS on shake_types too (it's already accessible but be safe)
ALTER TABLE public.shake_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read shake_types" ON public.shake_types;
CREATE POLICY "Allow read shake_types"
  ON public.shake_types
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- VERIFICATION: These should return data (not permission errors)
SELECT 'shake_types accessible:' as check_name, count(*)::text as result FROM public.shake_types
UNION ALL
SELECT 'shake_logs accessible:' as check_name, count(*)::text as result FROM public.shake_logs;
