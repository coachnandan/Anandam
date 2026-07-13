import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Invoking whatsapp-notify edge function...");
  try {
    const { data, error } = await supabase.functions.invoke('whatsapp-notify', {
      body: {
        client_id: 'bb77f862-7ab6-46a6-af7d-f80ebfeb3d88', // our user ID or any valid/invalid uuid
        whatsapp_number: '919876543210',
        message_type: 'Welcome Plan',
        client_name: 'Test Auditor',
        expiry_date: '2026-06-20'
      }
    });
    console.log("Edge Function result:", { data, error });
  } catch (err) {
    console.error("Edge Function unexpected error:", err);
  }
}

run();
