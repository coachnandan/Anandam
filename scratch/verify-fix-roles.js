import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmdra3JseWtqZHZnZGVpcW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNzcsImV4cCI6MjA5NDA5NzA3N30.tuRIePjiZDy4OgUmeB5SMl6MIb4OgYANUUEZbJb-JCE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndFixUser(email, password, expectedRole) {
  console.log(`\n🔍 Checking: ${email}`);
  
  // Sign in as this user
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.error(`  ❌ Login failed: ${error.message}`);
    return;
  }

  const userId = data.user?.id;
  const metaRole = data.user?.user_metadata?.role;
  console.log(`  ✅ Login OK. User ID: ${userId}`);
  console.log(`  📋 Metadata role: ${metaRole}`);

  // Check if profile exists
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) {
    console.error(`  ❌ Profile fetch error: ${profileErr.message}`);
  } else if (profile) {
    console.log(`  ✅ Profile found: name="${profile.name}", role="${profile.role}"`);
    if (profile.role !== expectedRole) {
      // Update the role using authenticated session
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: expectedRole })
        .eq('id', userId);
      if (updateErr) console.error(`  ❌ Role update failed: ${updateErr.message}`);
      else console.log(`  ✅ Role updated to: ${expectedRole}`);
    } else {
      console.log(`  ✅ Role is already correct: ${expectedRole}`);
    }
  } else {
    // Profile does not exist – insert it (we are now authenticated so RLS passes)
    const { error: insertErr } = await supabase
      .from('profiles')
      .insert([{ id: userId, name: email.split('@')[0], role: expectedRole }]);
    if (insertErr) console.error(`  ❌ Profile insert failed: ${insertErr.message}`);
    else console.log(`  ✅ Profile created with role: ${expectedRole}`);
  }

  await supabase.auth.signOut();
}

(async () => {
  console.log('🌿 Elevate Sanctuary — Profile Role Verifier\n');
  
  await checkAndFixUser('admin@elevate.in', 'Admin@1234', 'admin');
  await checkAndFixUser('member@elevate.in', 'Member@1234', 'member');

  console.log('\n═══════════════════════════════════════════');
  console.log('  ADMIN LOGIN');
  console.log('  Email:    admin@elevate.in');
  console.log('  Password: Admin@1234');
  console.log('───────────────────────────────────────────');
  console.log('  MEMBER LOGIN');
  console.log('  Email:    member@elevate.in');
  console.log('  Password: Member@1234');
  console.log('═══════════════════════════════════════════\n');
})();
