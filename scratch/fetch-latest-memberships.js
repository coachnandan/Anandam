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
  const { data, error } = await supabase.from('memberships').select('id, plan, duration_days, total_amount, paid_amount, start_date, membership_type').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error("Error fetching memberships:", error);
  } else {
    console.log("Latest memberships in DB:", data);
  }
}

run();
