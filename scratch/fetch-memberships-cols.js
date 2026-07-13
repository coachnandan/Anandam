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
  const { data, error } = await supabase.from('memberships').select('*').limit(1);
  if (error) {
    console.error("Error fetching memberships:", error);
  } else if (data && data.length > 0) {
    console.log("Columns in memberships table:", Object.keys(data[0]));
  } else {
    console.log("No rows in memberships table. Fetching history table columns...");
    const { data: hist, error: histErr } = await supabase.from('membership_history').select('*').limit(1);
    if (histErr) {
      console.error("Error fetching history:", histErr);
    } else if (hist && hist.length > 0) {
      console.log("Columns in membership_history table:", Object.keys(hist[0]));
    } else {
      console.log("Both tables are empty.");
    }
  }
}

run();
