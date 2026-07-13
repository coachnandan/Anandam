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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Seeding Anandam Club database...");

  // 1. Seed default club
  let clubId = null;
  const { data: clubs, error: clubsErr } = await supabase.from('clubs').select('*');
  if (clubsErr) {
    console.error("Error reading clubs:", clubsErr.message);
  } else if (clubs.length > 0) {
    clubId = clubs[0].id;
    console.log(`✅ Club already exists: ${clubs[0].name} (${clubId})`);
  } else {
    const { data: newClub, error: newClubErr } = await supabase.from('clubs').insert({
      name: 'Anandam Club',
      address: 'Jaipur, Rajasthan'
    }).select().single();
    if (newClubErr) {
      console.error("❌ Failed to create default club:", newClubErr.message);
    } else {
      clubId = newClub.id;
      console.log(`✅ Created default club: Anandam Club (${clubId})`);
    }
  }

  // 2. Seed shake types
  const shakeTypes = [
    { name: 'Shake', base_price: 200.00 },
    { name: 'Shake + Beta Heart', base_price: 250.00 },
    { name: 'Shake + Fiber', base_price: 250.00 },
    { name: 'Shake + Beta + Fiber', base_price: 300.00 },
    { name: 'Dino', base_price: 150.00 }
  ];
  for (const st of shakeTypes) {
    const { data, error } = await supabase.from('shake_types').select('*').eq('name', st.name).maybeSingle();
    if (error) {
      console.error(`Error checking shake type ${st.name}:`, error.message);
    } else if (data) {
      console.log(`✅ Shake type exists: ${st.name}`);
    } else {
      const { error: insErr } = await supabase.from('shake_types').insert(st);
      if (insErr) console.error(`❌ Failed to insert shake type ${st.name}:`, insErr.message);
      else console.log(`✅ Inserted shake type: ${st.name}`);
    }
  }

  // 3. Seed payment methods
  const paymentMethods = [
    { name: 'Cash' },
    { name: 'Online' }
  ];
  for (const pm of paymentMethods) {
    const { data, error } = await supabase.from('payment_methods').select('*').eq('name', pm.name).maybeSingle();
    if (error) {
      console.error(`Error checking payment method ${pm.name}:`, error.message);
    } else if (data) {
      console.log(`✅ Payment method exists: ${pm.name}`);
    } else {
      const { error: insErr } = await supabase.from('payment_methods').insert(pm);
      if (insErr) console.error(`❌ Failed to insert payment method ${pm.name}:`, insErr.message);
      else console.log(`✅ Inserted payment method: ${pm.name}`);
    }
  }

  // 4. Create test users
  const testUsers = [
    { email: 'admin@elevate.in', password: 'Admin@1234', full_name: 'Coach Aditi', role: 'admin' },
    { email: 'member@elevate.in', password: 'Member@1234', full_name: 'Staff Riya', role: 'junior_admin' }
  ];
  for (const tu of testUsers) {
    console.log(`\nChecking user: ${tu.email}`);
    // Try signing up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: tu.email,
      password: tu.password,
      options: {
        data: {
          full_name: tu.full_name,
          role: tu.role
        }
      }
    });

    let userId = signUpData?.user?.id;
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: tu.email,
          password: tu.password
        });
        if (loginError) {
          console.error(`❌ Could not sign in existing user ${tu.email}:`, loginError.message);
          continue;
        }
        userId = loginData.user?.id;
      } else {
        console.error(`❌ Signup failed for ${tu.email}:`, signUpError.message);
        continue;
      }
    }

    if (userId) {
      console.log(`✅ Auth user ready. ID: ${userId}`);
      // Check if profile exists
      const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profErr) {
        console.error(`❌ Failed to fetch profile:`, profErr.message);
      } else if (profile) {
        console.log(`✅ Profile already exists: ${profile.full_name}`);
        // Ensure club_id is set
        if (!profile.club_id && clubId) {
          await supabase.from('profiles').update({ club_id: clubId }).eq('id', userId);
          console.log(`✅ Updated profile with club_id.`);
        }
      } else {
        const { error: insErr } = await supabase.from('profiles').insert({
          id: userId,
          full_name: tu.full_name,
          email: tu.email,
          role: tu.role,
          club_id: clubId
        });
        if (insErr) console.error(`❌ Failed to insert profile for ${tu.email}:`, insErr.message);
        else console.log(`✅ Created profile for ${tu.email} with role: ${tu.role}`);
      }
    }
  }

  console.log("\nDatabase seeding finished.");
}

run();
