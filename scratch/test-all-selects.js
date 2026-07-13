import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const tables = ['clients', 'memberships', 'attendance', 'notification_logs', 'profiles', 'renewal_logs'];
  for (const t of tables) {
    console.log(`Querying ${t} as anonymous...`);
    try {
      const { data, error } = await supabase.from(t).select('*');
      if (error) {
        console.error(`Error querying ${t}:`, error.message);
      } else {
        console.log(`Success querying ${t}! Count:`, data.length);
        if (data.length > 0) {
          console.log(`Sample row from ${t}:`, data[0]);
        }
      }
    } catch (err) {
      console.error(`Unexpected error for ${t}:`, err);
    }
  }
}

run();
