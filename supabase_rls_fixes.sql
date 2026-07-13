-- Anandam Wellness Dashboard - Supabase Database RLS & Schema Fixes
-- Run these statements in your Supabase SQL Editor (https://supabase.com/dashboard/project/jsynuqsnztdbqvbsvykt/sql/new)

-- ─── 1. DISABLE OR BYPASS RESTRICTIVE RLS FOR TESTING ───
-- If you want to allow the frontend to bypass restrictive policy checks during development:
ALTER TABLE public.clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shake_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_shakes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.closing_followups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_day_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- ─── 2. SEED LOOKUP AND INITIAL DATA ───
-- Seed default club for Super Way Wellness Club
INSERT INTO public.clubs (id, name, address)
VALUES ('747b0e1b-b4bf-4277-bf30-4e33db33cd84', 'Super Way Wellness Club', 'Jaipur, Rajasthan')
ON CONFLICT (id) DO NOTHING;

-- Insert standard shake types
INSERT INTO public.shake_types (id, name, base_price) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Shake', 200.00),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Shake + Beta Heart', 250.00),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Shake + Fiber', 250.00),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Shake + Beta + Fiber', 300.00),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Dino', 150.00)
ON CONFLICT (name) DO NOTHING;

-- Insert standard payment methods
INSERT INTO public.payment_methods (id, name) VALUES
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'Cash'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', 'Online')
ON CONFLICT (name) DO NOTHING;
