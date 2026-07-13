import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function tryLogin(email, password) {
  console.log(`Attempting sign in with ${email}...`);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      console.log(`❌ Sign in failed for ${email}:`, error.message);
    } else {
      console.log(`✅ Sign in success for ${email}! User:`, data.user);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

async function run() {
  await tryLogin('swativerma@gmail.com', 'elevate');
  await tryLogin('swativerma@gmail.com', 'password');
  await tryLogin('coachnandan@gmail.com', 'elevate');
}

run();
