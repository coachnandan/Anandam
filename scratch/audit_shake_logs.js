import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('./.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runAudit() {
  console.log("=========================================");
  console.log("AUDITING LOGGED-IN USER PROFILE & CLUB");
  console.log("=========================================");
  
  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_EMAIL,
    password: env.TEST_USER_PASSWORD
  });
  
  if (authError) {
    console.error("❌ Auth Sign-In Failed:", authError.message);
    return;
  }
  
  const user = authData.user;
  console.log(`✅ Auth Sign-In OK. User ID: ${user.id}, Email: ${user.email}`);
  
  // Check profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
    
  if (profileErr) {
    console.error("❌ Profiles Table Query Failed:", profileErr.message);
  } else if (!profile) {
    console.warn("⚠️ Profiles row NOT found for this user!");
  } else {
    console.log("✅ Profile Row Found:");
    console.log(`   - ID: ${profile.id}`);
    console.log(`   - Full Name: ${profile.full_name || 'N/A'}`);
    console.log(`   - Email: ${profile.email}`);
    console.log(`   - Role: ${profile.role}`);
    console.log(`   - Club ID: ${profile.club_id}`);
    console.log(`   - Status: ${profile.status}`);
  }
  
  // Verify if club_id exists in clubs table
  if (profile && profile.club_id) {
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', profile.club_id)
      .maybeSingle();
      
    if (clubErr) {
      console.error("❌ Clubs Table Query Failed:", clubErr.message);
    } else if (!club) {
      console.warn(`⚠️ Club with ID ${profile.club_id} does NOT exist in clubs table!`);
    } else {
      console.log("✅ Club Row Found:");
      console.log(`   - ID: ${club.id}`);
      console.log(`   - Name: ${club.name}`);
      console.log(`   - Address: ${club.address}`);
    }
  } else {
    console.warn("⚠️ No club_id is associated with this profile.");
  }
}

runAudit();
