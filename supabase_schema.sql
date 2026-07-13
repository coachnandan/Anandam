-- Anandam Wellness Dashboard Database Schema Migration
-- Target: Supabase / PostgreSQL Database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. CLUBS TABLE ───
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 2. USERS (STAFF/ADMIN) TABLE ───
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'coach');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'coach',
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 3. CUSTOMERS (MEMBERS & VISITORS) TABLE ───
CREATE TYPE customer_status AS ENUM ('Active', 'Inactive', 'Pending');

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    dob DATE,
    gender VARCHAR(10),
    profession VARCHAR(100),
    referred_by VARCHAR(255),
    address TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    status customer_status NOT NULL DEFAULT 'Pending',
    archive_status BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_requested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 4. MEMBERSHIPS TABLE ───
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    plan VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    advance_amount NUMERIC(10, 2) NOT NULL,
    remaining_amount NUMERIC(10, 2) NOT NULL GENERATED ALWAYS AS (total_amount - advance_amount) STORED,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 5. ATTENDANCE TABLE ───
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Present', 'Absent', 'Pending')),
    check_in_time VARCHAR(20) DEFAULT '-',
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_customer_date_attendance UNIQUE (customer_id, date)
);

-- ─── 6. SHAKE_LOGS TABLE ───
CREATE TABLE IF NOT EXISTS shake_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL DEFAULT 'member', -- member / visitor
    item VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_person_date_shake UNIQUE (person_id, date)
);

-- ─── 7. PAYMENT_LOGS (LEDGER) TABLE ───
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL, -- Cash / Online
    payment_purpose VARCHAR(100) NOT NULL, -- One Day Payment / Subscription
    plan VARCHAR(100),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(20) NOT NULL,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 8. ACTIVITY_LOGS (AUDIT TRAIL) TABLE ───
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 9. CLOSING RECORDS (FOLLOW-UP) TABLE ───
CREATE TABLE IF NOT EXISTS closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    selected_type VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_requested_at TIMESTAMP WITH TIME ZONE
);

-- ─── 10. LOGIN LOGS (LOGIN AUDIT) TABLE ───
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    status VARCHAR(20) NOT NULL, -- Success / Failed
    error_message TEXT,
    device_info TEXT,
    browser VARCHAR(100),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── DATABASE INDEXES FOR OPTIMAL SEARCH ───
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_shake_logs_date ON shake_logs(date);
CREATE INDEX IF NOT EXISTS idx_closings_visit_date ON closings(visit_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_customer ON activity_logs(customer_id);

-- ─── ENABLE ROW LEVEL SECURITY (RLS) ───
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE shake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
