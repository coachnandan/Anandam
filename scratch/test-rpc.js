import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Testing RPC...");
  try {
    const { data, error } = await supabase.rpc('get_schema_info');
    console.log("RPC get_schema_info result:", { data, error });
  } catch (err) {
    console.error("RPC error:", err);
  }
}

run();
