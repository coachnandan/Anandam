-- ─── centralized shake_logs table ───
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/zcnwhgjhwxyypanetwzd/sql/new

-- 1. Create the new shake_logs table
CREATE TABLE IF NOT EXISTS public.shake_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    person_type VARCHAR(50) NOT NULL CHECK (person_type IN ('MEMBER', 'VISITOR', 'OTHER_CLUB_MEMBER')),
    person_id UUID NOT NULL,
    shake_type_id UUID REFERENCES public.shake_types(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    payment_type VARCHAR(50) DEFAULT 'Cash',
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_person_shake_date UNIQUE (person_type, person_id, shake_type_id, date)
);

-- 2. Disable Row Level Security (RLS) for Development/Testing Ease
ALTER TABLE public.shake_logs DISABLE ROW LEVEL SECURITY;

-- 3. Create Trigger to update updated_at column automatically
CREATE TRIGGER update_shake_logs_modtime
    BEFORE UPDATE ON public.shake_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 4. Enable Supabase Realtime for the new table
BEGIN;
  -- Add shake_logs to realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shake_logs;
COMMIT;
