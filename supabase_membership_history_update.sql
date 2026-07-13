-- ─── MEMBERSHIP HISTORY TABLE (CREATE OR UPDATE) ───

-- 1. Create the table if it does not exist
CREATE TABLE IF NOT EXISTS membership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan VARCHAR(100) NOT NULL,
    total_shake_limit INTEGER NOT NULL DEFAULT 0,
    consumed_shakes INTEGER NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add all the new columns for tracking extensions safely
ALTER TABLE membership_history ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE membership_history ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE membership_history ADD COLUMN IF NOT EXISTS due_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE membership_history ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 0;
ALTER TABLE membership_history ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE membership_history ADD COLUMN IF NOT EXISTS marked_by_name TEXT;

-- 3. Notify PostgREST to reload the schema cache (solves "schema cache" errors)
NOTIFY pgrst, 'reload schema';
