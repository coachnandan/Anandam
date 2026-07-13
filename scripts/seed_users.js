// Seed script to create test admin and member users in Supabase
// Run with: node scripts/seed_users.js
import { supabase } from '../src/lib/supabaseClient.js';

async function createUser(email, password, role) {
  // Sign up the user (ignores email verification for testing)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (signUpError && signUpError.message !== 'User already registered') {
    console.error('Signup error for', email, signUpError.message);
    return;
  }
  // Upsert profile with role
  const { data, error } = await supabase.from('profiles').upsert([
    { id: signUpData?.user?.id, email, role },
  ]);
  if (error) console.error('Profile upsert error', error.message);
  else console.log(`✅ ${role} user ready: ${email}`);
}

(async () => {
  if (!supabase) {
    console.error('Supabase client not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    return;
  }
  await createUser('admin@example.com', 'adminPass', 'admin');
  await createUser('member@example.com', 'memberPass', 'member');
  console.log('Seeder completed');
})();
