import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert(tableName, payload) {
  console.log(`Testing insert into ${tableName}...`);
  try {
    const { data, error } = await supabase.from(tableName).insert([payload]).select();
    if (error) {
      console.log(`❌ Insert into ${tableName} failed:`, error.message);
    } else {
      console.log(`✅ Insert into ${tableName} succeeded:`, data);
    }
  } catch (err) {
    console.error(`Unexpected error for ${tableName}:`, err);
  }
}

async function run() {
  // Test clients
  await testInsert('clients', {
    name: 'Test Client Anon',
    contact: '1234567890',
    address: 'Anon Address',
    status: 'Active'
  });

  // Test memberships (need a valid client_id, but we don't have one, let's see if we get a foreign key error or RLS error)
  await testInsert('memberships', {
    client_id: 'bb77f862-7ab6-46a6-af7d-f80ebfeb3d88', // using our user id as dummy client_id
    membership_plan: 'Monthly Wellness',
    start_date: '2026-05-20',
    expiry_date: '2026-06-20',
    duration_days: 30,
    status: 'Active',
    amount: 1500,
    payment_status: 'Paid'
  });

  // Test attendance
  await testInsert('attendance', {
    client_id: 'bb77f862-7ab6-46a6-af7d-f80ebfeb3d88',
    date: '2026-05-20',
    status: 'Present',
    user_id: 'bb77f862-7ab6-46a6-af7d-f80ebfeb3d88'
  });

  // Test notification_logs
  await testInsert('notification_logs', {
    client_id: 'bb77f862-7ab6-46a6-af7d-f80ebfeb3d88',
    whatsapp_number: '1234567890',
    message_type: 'Welcome Plan',
    sent_status: 'Sent'
  });
}

run();
