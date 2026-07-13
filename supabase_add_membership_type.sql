-- ─── ADD MEMBERSHIP TYPE TO MEMBERSHIPS AND HISTORY ───

-- 1. Add membership_type to memberships table if it does not exist
ALTER TABLE public.memberships 
ADD COLUMN IF NOT EXISTS membership_type VARCHAR(100) DEFAULT 'Shake';

-- 2. Add membership_type to membership_history table if it does not exist
ALTER TABLE public.membership_history 
ADD COLUMN IF NOT EXISTS membership_type VARCHAR(100) DEFAULT 'Shake';

-- 3. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
