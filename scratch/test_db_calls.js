import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('./.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_EMAIL,
    password: env.TEST_USER_PASSWORD
  });
  if (signInError) {
    console.error("Sign in failed:", signInError);
    return;
  }
  console.log("Signed in. User ID:", authData.user.id);

  console.log("Testing fetchShakeLogs query...");
  // Let's call supabase directly using the query in db.js
  const { data, error } = await supabase
    .from('attendance_shakes')
    .select('id, quantity, approved_time, created_at, shake_types(name), attendance!inner(member_id, date)');
  
  if (error) {
    console.error("fetchShakeLogs with member_id, date failed:", error);
  } else {
    console.log("fetchShakeLogs with member_id, date succeeded! Length:", data.length);
  }

  const { data: data2, error: error2 } = await supabase
    .from('attendance_shakes')
    .select('id, quantity, approved_time, created_at, shake_types(name), attendance!inner(member_id, visitor_id, date)');
  
  if (error2) {
    console.error("fetchShakeLogs with visitor_id failed (as expected):", error2.message);
  } else {
    console.log("fetchShakeLogs with visitor_id succeeded! (Wow, column actually exists in DB?)");
  }
}
test();
