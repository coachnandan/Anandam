-- =========================================================================
-- SUPER WAY NUTRITION CLUB MANAGEMENT SYSTEM - COMPLETE SUPABASE DATABASE SCHEMA
-- =========================================================================

-- Disable triggers temporarily during cleanup
SET session_replication_role = 'replica';

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.deleted_records CASCADE;
DROP TABLE IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.member_status_history CASCADE;
DROP TABLE IF EXISTS public.membership_history CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.dashboard_daily_stats CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.one_day_payments CASCADE;
DROP TABLE IF EXISTS public.closing_followups CASCADE;
DROP TABLE IF EXISTS public.visitors CASCADE;
DROP TABLE IF EXISTS public.attendance_shakes CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.membership_payments CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.shake_types CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clubs CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.member_status CASCADE;
DROP TYPE IF EXISTS public.gender_type CASCADE;
DROP TYPE IF EXISTS public.closing_status CASCADE;
DROP TYPE IF EXISTS public.payment_status_type CASCADE;
DROP TYPE IF EXISTS public.record_action_type CASCADE;

-- Restore standard trigger behavior
SET session_replication_role = 'origin';

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CREATE ENUMS AND LOOKUP TYPES
-- ==========================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'junior_admin');
CREATE TYPE member_status AS ENUM ('Active', 'Inactive');
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE closing_status AS ENUM ('Pending', 'Converted_to_Member', 'Converted_to_Membership', 'Closed');
CREATE TYPE payment_status_type AS ENUM ('Paid', 'Unpaid', 'Partially_Paid');
CREATE TYPE record_action_type AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PAYMENT', 'ATTENDANCE', 'MEMBERSHIP_CREATE', 'MEMBERSHIP_RENEWAL');

-- ==========================================
-- 2. CREATE DATABASE TABLES
-- ==========================================

-- ─── CLUBS TABLE ───
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── PROFILES TABLE (Supabase Auth Integration) ───
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'junior_admin',
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    profile_photo TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── SHAKE TYPES TABLE ───
CREATE TABLE shake_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── PAYMENT METHODS TABLE ───
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── MEMBERS TABLE ───
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    dob DATE,
    gender gender_type,
    profession VARCHAR(100),
    referral VARCHAR(255),
    member_type VARCHAR(50) DEFAULT 'Member',
    address TEXT,
    status member_status NOT NULL DEFAULT 'Active',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ─── MEMBERSHIPS TABLE ───
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL,
    total_shake_limit INTEGER NOT NULL,
    consumed_shakes INTEGER NOT NULL DEFAULT 0,
    remaining_shakes INTEGER NOT NULL GENERATED ALWAYS AS (GREATEST(0, total_shake_limit - consumed_shakes)) STORED,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(10, 2) NOT NULL GENERATED ALWAYS AS (GREATEST(0.00, total_amount - paid_amount)) STORED,
    payment_status payment_status_type NOT NULL DEFAULT 'Unpaid',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── MEMBERSHIP PAYMENTS TABLE ───
CREATE TABLE membership_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE RESTRICT,
    received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── ATTENDANCE TABLE ───
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    attendance_status VARCHAR(50) NOT NULL DEFAULT 'Present',
    check_in_time VARCHAR(20) NOT NULL,
    marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_member_daily_attendance UNIQUE (member_id, date)
);

-- ─── ATTENDANCE SHAKES TABLE ───
CREATE TABLE attendance_shakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
    shake_type_id UUID REFERENCES shake_types(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_time VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_attendance_shake_link UNIQUE (attendance_id)
);

-- ─── VISITORS TABLE ───
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    visitor_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    dob DATE,
    profession VARCHAR(100),
    address TEXT,
    referral VARCHAR(255),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ─── CLOSING FOLLOW-UPS TABLE ───
CREATE TABLE closing_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    status closing_status NOT NULL DEFAULT 'Pending',
    converted_to_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    converted_to_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── ONE DAY PAYMENTS TABLE ───
CREATE TABLE one_day_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE RESTRICT,
    received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── REFERRALS TABLE ───
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    referred_member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    referred_visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── DASHBOARD DAILY STATS TABLE ───
CREATE TABLE dashboard_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    total_active_members INTEGER DEFAULT 0,
    total_present_today INTEGER DEFAULT 0,
    total_revenue_collected NUMERIC(10, 2) DEFAULT 0.00,
    total_shakes_served INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_club_date_stat UNIQUE (club_id, stat_date)
);

-- ─── ACTIVITY LOGS (AUDIT TRAIL) TABLE ───
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action record_action_type NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── MEMBERSHIP HISTORY TABLE ───
CREATE TABLE membership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan VARCHAR(100) NOT NULL,
    total_shake_limit INTEGER NOT NULL,
    consumed_shakes INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── MEMBER STATUS HISTORY TABLE ───
CREATE TABLE member_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    old_status member_status NOT NULL,
    new_status member_status NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── ATTENDANCE HISTORY TABLE ───
CREATE TABLE attendance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID,
    member_id UUID,
    date DATE NOT NULL,
    attendance_status VARCHAR(50) NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── DELETED RECORDS TABLE ───
CREATE TABLE deleted_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    deleted_data JSONB NOT NULL,
    deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── SETTINGS TABLE ───
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_club_setting_key UNIQUE (club_id, config_key)
);

-- ==========================================
-- 3. TRIGGERS AND HELPER SQL FUNCTIONS
-- ==========================================

-- ─── Auto-update timestamp function ───
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_clubs_modtime BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_members_modtime BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_memberships_modtime BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_visitors_modtime BEFORE UPDATE ON visitors FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_closing_followups_modtime BEFORE UPDATE ON closing_followups FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_settings_modtime BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 4. DATABASE INDEXES FOR OPTIMAL SEARCH
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_members_mobile ON members(mobile_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_one_day_payments_date ON one_day_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_member_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shake_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_shakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_day_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ─── Disable RLS for Development/Testing Ease ───
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE shake_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_shakes DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE closing_followups DISABLE ROW LEVEL SECURITY;
ALTER TABLE one_day_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. SEED LOOKUP AND INITIAL DATA
-- ==========================================

-- Insert default club
INSERT INTO clubs (id, name, address)
VALUES ('747b0e1b-b4bf-4277-bf30-4e33db33cd84', 'Super Way Wellness Club', 'Jaipur, Rajasthan')
ON CONFLICT (id) DO NOTHING;

-- Insert standard shake types
INSERT INTO shake_types (id, name, base_price) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Shake', 200.00),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Shake + Beta Heart', 250.00),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Shake + Fiber', 250.00),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Shake + Beta + Fiber', 300.00),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Dino', 150.00)
ON CONFLICT (name) DO NOTHING;

-- Insert standard payment methods
INSERT INTO payment_methods (id, name) VALUES
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'Cash'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', 'Online')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 7. SUPABASE REALTIME CONFIGURATION
-- ==========================================

begin;
  -- Remove existing realtime publications
  drop publication if exists supabase_realtime;
  
  -- Create new publication containing the target tables
  create publication supabase_realtime for table 
    attendance, 
    members, 
    memberships, 
    visitors, 
    closing_followups, 
    membership_payments, 
    one_day_payments, 
    activity_logs;
commit;
