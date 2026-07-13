import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env file
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tableColumns = {
  clubs: ['id', 'name', 'address', 'created_at', 'updated_at'],
  profiles: ['id', 'full_name', 'email', 'mobile_number', 'role', 'club_id', 'profile_photo', 'status', 'last_login', 'created_at', 'updated_at'],
  members: ['id', 'club_id', 'name', 'mobile_number', 'whatsapp_number', 'dob', 'gender', 'profession', 'referral', 'member_type', 'address', 'status', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'deleted_by'],
  memberships: ['id', 'member_id', 'plan', 'duration_days', 'total_shake_limit', 'consumed_shakes', 'remaining_shakes', 'total_amount', 'paid_amount', 'due_amount', 'payment_status', 'start_date', 'status', 'created_at', 'updated_at'],
  attendance: ['id', 'member_id', 'attendance_status', 'check_in_time', 'marked_by', 'date', 'created_at'],
  attendance_shakes: ['id', 'attendance_id', 'shake_type_id', 'quantity', 'approved_by', 'approved_time', 'created_at'],
  visitors: ['id', 'club_id', 'visitor_name', 'mobile_number', 'whatsapp_number', 'dob', 'profession', 'address', 'referral', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'deleted_by'],
  closing_followups: ['id', 'visitor_id', 'status', 'converted_to_member_id', 'converted_to_membership_id', 'remarks', 'created_at', 'updated_at'],
  one_day_payments: ['id', 'club_id', 'visitor_id', 'amount', 'payment_method_id', 'received_by', 'payment_date'],
  activity_logs: ['id', 'customer_id', 'type', 'action_type', 'action_description', 'performed_by', 'timestamp']
};

async function run() {
  console.log("Checking columns for active database tables...");
  for (const [table, cols] of Object.entries(tableColumns)) {
    console.log(`Checking table: ${table}`);
    for (const col of cols) {
      const { error } = await supabase.from(table).select(col).limit(1);
      if (error) {
        console.error(`  ❌ Column "${col}" does NOT exist. Error: ${error.message}`);
      } else {
        console.log(`  ✅ Column "${col}" exists.`);
      }
    }
  }
}

run();
