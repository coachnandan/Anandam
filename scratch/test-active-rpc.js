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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Testing active RPC exec_sql...");
  
  // Try inserting a club using exec_sql
  const sql = `
    INSERT INTO public.clubs (name, address)
    VALUES ('Anandam Wellness Club', 'Jaipur')
    ON CONFLICT DO NOTHING
    RETURNING id;
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  console.log("Result:", { data, error });
}

run();
