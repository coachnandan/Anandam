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
  // Sign in as the primary user to get permission
  await supabase.auth.signInWithPassword({
    email: env.TEST_USER_EMAIL,
    password: env.TEST_USER_PASSWORD
  });

  console.log("Updating all profiles to role='admin'...");

  // Update all profiles: set role to 'admin', ensure status is 'Active'
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin', status: 'Active', updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000') // match all rows
    .select('id, full_name, email, role, status');

  if (error) {
    console.error("Failed to update profiles:", error);
  } else {
    console.log("✅ All profiles updated to admin:");
    data.forEach(p => console.log(`  - ${p.full_name} (${p.email}) → role: ${p.role}, status: ${p.status}`));
  }
}

run();
