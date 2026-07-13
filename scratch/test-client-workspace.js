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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Anon Key Length:", supabaseAnonKey?.length);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const tables = [
    'customers', 'clients', 'users', 'profiles', 'memberships', 'attendance', 
    'shake_logs', 'payment_logs', 'activity_logs', 'closings',
    'members', 'visitors', 'attendance_shakes', 'closing_followups', 
    'one_day_payments', 'settings', 'renewal_logs', 'clubs', 'shake_types', 'payment_methods'
  ];
  for (const table of tables) {
    console.log(`Checking table: ${table}`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`  Error: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`  Success! Data:`, data);
      }
    } catch (e) {
      console.error(`  Exception:`, e);
    }
  }
}

run();
