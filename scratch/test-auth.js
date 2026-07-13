import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Attempting sign in with coach@elevate.in...");
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'coach@elevate.in',
      password: 'elevate'
    });
    if (error) {
      console.log("Sign in failed:", error.message);
    } else {
      console.log("Sign in success!", data.user);
      
      // Let's try to query the tables using this user's token!
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);
      console.log("Clients query:", { clients, clientsError });

      const { data: memberships, error: memError } = await supabase
        .from('memberships')
        .select('*')
        .limit(1);
      console.log("Memberships query:", { memberships, memError });

      const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .limit(1);
      console.log("Attendance query:", { attendance, attError });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

run();
