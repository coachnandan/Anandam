import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmdra3JseWtqZHZnZGVpcW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNzcsImV4cCI6MjA5NDA5NzA3N30.tuRIePjiZDy4OgUmeB5SMl6MIb4OgYANUUEZbJb-JCE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const users = [
  {
    email: 'admin@elevate.in',
    password: 'Admin@1234',
    full_name: 'Coach Aditi',
    role: 'admin'
  },
  {
    email: 'member@elevate.in',
    password: 'Member@1234',
    full_name: 'Staff Riya',
    role: 'member'
  }
];

async function createUser({ email, password, full_name, role }) {
  console.log(`\n⏳ Creating ${role} user: ${email}`);

  // Try signing up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
        name: full_name
      }
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
      console.log(`ℹ️  User ${email} already exists — attempting profile upsert.`);
      // Try to sign in to get the user id
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        console.error(`❌ Could not sign in existing user ${email}:`, loginError.message);
        return;
      }
      const userId = loginData.user?.id;
      if (userId) {
        const { error: upsertError } = await supabase.from('profiles').upsert([
          { id: userId, name: full_name, role }
        ], { onConflict: 'id' });
        if (upsertError) console.error(`❌ Profile upsert failed:`, upsertError.message);
        else console.log(`✅ Profile updated for existing user: ${email} | Role: ${role}`);
      }
      return;
    }
    console.error(`❌ Signup failed for ${email}:`, signUpError.message);
    return;
  }

  const userId = signUpData?.user?.id;
  if (!userId) {
    console.log(`⚠️  No user ID returned for ${email}. Email confirmation may be required.`);
    console.log(`   → Check your Supabase dashboard to confirm the email and set the profile role manually.`);
    return;
  }

  // Upsert the profile record with role
  const { error: profileError } = await supabase.from('profiles').upsert([
    { id: userId, name: full_name, role }
  ], { onConflict: 'id' });

  if (profileError) {
    console.error(`❌ Profile creation failed for ${email}:`, profileError.message);
  } else {
    console.log(`✅ SUCCESS! ${role.toUpperCase()} account ready.`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     ${role}`);
  }
}

(async () => {
  console.log('🌿 Elevate Sanctuary — Test Account Seeder\n');
  for (const user of users) {
    await createUser(user);
  }
  console.log('\n✅ Seeder completed.\n');
  console.log('═══════════════════════════════════════════');
  console.log('  ADMIN LOGIN');
  console.log('  Email:    admin@elevate.in');
  console.log('  Password: Admin@1234');
  console.log('───────────────────────────────────────────');
  console.log('  MEMBER LOGIN');
  console.log('  Email:    member@elevate.in');
  console.log('  Password: Member@1234');
  console.log('═══════════════════════════════════════════');
})();
