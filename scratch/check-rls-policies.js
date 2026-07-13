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

  console.log("Fetching active policies...");
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: "SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';"
  });

  if (error) {
    console.log("Could not run exec_sql RPC (standard behavior if not created). Querying profiles instead...");
    // Let's try to query profiles to see if the user can read it.
    const { data: profs, error: profErr } = await supabase.from('profiles').select('*');
    console.log("Profiles read result:", profs ? `Success (${profs.length} profiles)` : "Error: " + profErr.message);
  } else {
    console.log("Active policies in DB:", data);
  }
}

run();
