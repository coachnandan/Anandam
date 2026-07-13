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

async function inspect() {
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_EMAIL,
    password: env.TEST_USER_PASSWORD
  });
  if (signInError) {
    console.error("Sign in failed:", signInError);
    return;
  }
  console.log("Signed in. User ID:", authData.user.id);

  console.log("Checking if shake_logs table exists...");
  const { data, error } = await supabase.from('shake_logs').select('*').limit(1);
  if (error) {
    console.error("shake_logs table query failed:", error);
  } else {
    console.log("shake_logs table exists! Columns:", data);
  }
}
inspect();
