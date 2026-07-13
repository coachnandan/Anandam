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
  const { data, error } = await supabase.from('memberships').select('membership_type').limit(1);
  if (error) {
    console.error("❌ Column membership_type does NOT exist on memberships table:", error);
  } else {
    console.log("✅ Column membership_type exists on memberships table!");
  }
}

run();
