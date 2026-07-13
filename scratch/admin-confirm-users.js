/**
 * This script uses the Supabase Admin REST API to:
 * 1. Confirm both users' emails
 * 2. Update their profile roles
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard > Project Settings > API)
 * 
 * Usage:
 *   Set SUPABASE_SERVICE_ROLE_KEY below, then run:
 *   node scratch/admin-confirm-users.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';

// ⚠️ Replace this with your actual Service Role Key from:
// Supabase Dashboard → Project Settings → API → service_role key
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('\n❌ ERROR: Please set your SUPABASE_SERVICE_ROLE_KEY.');
  console.error('   Get it from: Supabase Dashboard → Project Settings → API → service_role\n');
  process.exit(1);
}

// Admin client bypasses RLS and email confirmation
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const usersToSetup = [
  { email: 'admin@elevate.in',  password: 'Admin@1234',  full_name: 'Coach Aditi', role: 'admin'  },
  { email: 'member@elevate.in', password: 'Member@1234', full_name: 'Staff Riya',  role: 'member' }
];

async function setupUser({ email, password, full_name, role }) {
  console.log(`\n⏳ Processing ${role}: ${email}`);

  // 1. List users to find this one
  const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    console.error(`  ❌ Failed to list users: ${listError.message}`);
    return;
  }

  let existingUser = listData.users.find(u => u.email === email);

  if (!existingUser) {
    // 2. Create user if not found
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, name: full_name }
    });
    if (createErr) {
      console.error(`  ❌ Create user failed: ${createErr.message}`);
      return;
    }
    existingUser = created.user;
    console.log(`  ✅ User created: ${email}`);
  } else {
    // 3. Confirm email if not already confirmed
    if (!existingUser.email_confirmed_at) {
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        user_metadata: { full_name, role, name: full_name }
      });
      if (updateErr) console.error(`  ❌ Email confirm failed: ${updateErr.message}`);
      else console.log(`  ✅ Email confirmed for: ${email}`);
    } else {
      console.log(`  ✅ Email already confirmed`);
    }
  }

  // 4. Upsert profile with correct role (admin client bypasses RLS)
  const { error: profileErr } = await adminClient
    .from('profiles')
    .upsert([{ id: existingUser.id, name: full_name, role }], { onConflict: 'id' });

  if (profileErr) console.error(`  ❌ Profile upsert failed: ${profileErr.message}`);
  else console.log(`  ✅ Profile set: name="${full_name}", role="${role}"`);

  console.log(`  ✅ READY → Email: ${email} | Password: ${password} | Role: ${role}`);
}

(async () => {
  console.log('🌿 Elevate Sanctuary — Admin Account Setup\n');
  for (const u of usersToSetup) {
    await setupUser(u);
  }
  console.log('\n════════════════════════════════════════════');
  console.log('  🛡️  ADMIN LOGIN');
  console.log('  Email:    admin@elevate.in');
  console.log('  Password: Admin@1234');
  console.log('────────────────────────────────────────────');
  console.log('  👤  MEMBER LOGIN');
  console.log('  Email:    member@elevate.in');
  console.log('  Password: Member@1234');
  console.log('════════════════════════════════════════════\n');
})();
