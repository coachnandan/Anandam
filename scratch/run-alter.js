import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log("Running DB alteration SQL via exec_sql RPC...");
  
  const sql = `
    -- Add membership_type column to memberships if it does not exist
    ALTER TABLE public.memberships 
    ADD COLUMN IF NOT EXISTS membership_type VARCHAR(100) DEFAULT 'Shake';

    -- Add membership_type column to membership_history if it does not exist
    ALTER TABLE public.membership_history 
    ADD COLUMN IF NOT EXISTS membership_type VARCHAR(100) DEFAULT 'Shake';

    -- Reload schema cache
    NOTIFY pgrst, 'reload schema';
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error("❌ SQL execution failed:", error);
  } else {
    console.log("✅ SQL execution succeeded! Result:", data);
  }
}

run();
