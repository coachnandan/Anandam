import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns(tableName, columns) {
  console.log(`Checking columns for ${tableName}...`);
  for (const col of columns) {
    const { error } = await supabase.from(tableName).select(col).limit(1);
    if (error) {
      console.log(`❌ Column "${col}" in table "${tableName}" does NOT exist. Error: ${error.message}`);
    } else {
      console.log(`✅ Column "${col}" in table "${tableName}" exists.`);
    }
  }
}

async function run() {
  await checkColumns('clients', [
    'id', 'client_id', 'name', 'full_name', 'contact', 'contact_number',
    'whatsapp_number', 'address', 'referral_source', 'purpose', 'profession',
    'joining_date', 'created_by_user_id', 'created_by', 'created_at', 'status'
  ]);

  await checkColumns('memberships', [
    'id', 'membership_id', 'client_id', 'membership_plan', 'start_date',
    'expiry_date', 'duration_days', 'membership_status', 'status',
    'renewal_status', 'created_by_user_id', 'created_at', 'amount', 'payment_status'
  ]);

  await checkColumns('attendance', [
    'id', 'client_id', 'date', 'status', 'marked_by_user_id', 'marked_at', 'user_id', 'check_in'
  ]);

  await checkColumns('notification_logs', [
    'id', 'notification_id', 'client_id', 'whatsapp_number', 'message_type',
    'message_content', 'sent_status', 'sent_at'
  ]);

  await checkColumns('profiles', [
    'id', 'name', 'role', 'email'
  ]);

  await checkColumns('renewal_logs', [
    'id', 'client_id', 'membership_id', 'previous_expiry_date', 'new_expiry_date',
    'renewed_by_user_id', 'renewed_at'
  ]);
}

run();
