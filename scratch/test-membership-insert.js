import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log("Signing in...");
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_EMAIL,
    password: env.TEST_USER_PASSWORD
  });

  if (authError) {
    console.error("Auth failed:", authError);
    return;
  }

  console.log("Creating test customer...");
  const { data: cust, error: custErr } = await supabase.from('members').insert({
    name: 'Test Customer ' + Date.now(),
    mobile_number: '9999999999',
    status: 'Active'
  }).select().single();

  if (custErr) {
    console.error("Error creating customer:", custErr);
    return;
  }

  console.log("Customer created with ID:", cust.id);

  console.log("Creating membership with type 'Shake + Fiber'...");
  const { data: memb, error: membErr } = await supabase.from('memberships').insert({
    member_id: cust.id,
    plan: '10 Days',
    duration_days: 10,
    total_shake_limit: 10,
    total_amount: 3450,
    paid_amount: 3450,
    start_date: new Date().toISOString().split('T')[0],
    membership_type: 'Shake + Fiber'
  }).select().single();

  if (membErr) {
    console.error("Error creating membership:", membErr);
  } else {
    console.log("✅ Membership created successfully:", memb);
    console.log("Read back membership_type:", memb.membership_type);
  }

  // Cleanup
  if (memb) await supabase.from('memberships').delete().eq('id', memb.id);
  await supabase.from('members').delete().eq('id', cust.id);
}

run();
