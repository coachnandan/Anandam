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
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.log("Anonymous sign-in failed:", error.message);
  } else {
    console.log("Anonymous sign-in succeeded! Session user ID:", data.user?.id);
  }
}
test();
