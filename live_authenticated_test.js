// Authenticated Database Verification Script
// Run this to verify active auth status, RPC policies, and make a real insert into visitors.

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('./.env');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env file not found.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value.trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const testEmail = env.TEST_USER_EMAIL;
const testPassword = env.TEST_USER_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

if (!testEmail || !testPassword) {
  console.error("Error: Please specify TEST_USER_EMAIL and TEST_USER_PASSWORD in your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  console.log("=================================================");
  console.log("LOGGING IN TO SUPABASE AUTHENTICATED SESSION");
  console.log("=================================================");
  console.log("Email:", testEmail);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (authError) {
    console.error("❌ Login failed:", authError.message);
    process.exit(1);
  }

  const userId = authData.user?.id;
  console.log("✅ Authenticated. User ID:", userId);

  console.log("\n=================================================");
  console.log("EXECUTING USER SQL CHECKS");
  console.log("=================================================");

  // 1. SELECT auth.uid();
  console.log("1. SELECT auth.uid() ->", userId);

  // 2. SELECT * FROM profiles WHERE id = auth.uid();
  console.log("\n2. SELECT * FROM profiles WHERE id = auth.uid();");
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error("   ❌ Failed to query profile:", profileError.message);
  } else if (!profileData) {
    console.warn("   ⚠️ Warning: No profile row found in 'profiles' table for this user ID.");
  } else {
    console.log("   Profile Row found:", JSON.stringify(profileData, null, 2));
  }

  // 3. SELECT get_user_role();
  console.log("\n3. SELECT get_user_role();");
  const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
  if (roleError) {
    console.error("   ❌ RPC get_user_role() failed:", roleError.message);
  } else {
    console.log("   Result:", roleData);
  }

  // 4. SELECT get_user_club_id();
  console.log("\n4. SELECT get_user_club_id();");
  const { data: clubData, error: clubError } = await supabase.rpc('get_user_club_id');
  if (clubError) {
    console.error("   ❌ RPC get_user_club_id() failed:", clubError.message);
  } else {
    console.log("   Result:", clubData);
  }

  const activeClubId = clubData || profileData?.club_id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';

  console.log("\n=================================================");
  console.log("TESTING INSERT INTO VISITORS");
  console.log("=================================================");

  const visitorPayload = {
    club_id: activeClubId,
    visitor_name: 'Live Verified Visitor',
    mobile_number: '9876543210',
    whatsapp_number: '9876543210',
    gender: 'Male',
    profession: 'Developer',
    address: 'Varanasi, India',
    referral: 'Direct'
  };

  console.log("* Request Payload:", JSON.stringify(visitorPayload, null, 2));

  // Perform insert
  const response = await supabase.from('visitors').insert([visitorPayload]).select();

  console.log("\n* Supabase Response status:", response.status);
  console.log("* Supabase Response statusText:", response.statusText);
  console.log("* Returned Data:", JSON.stringify(response.data, null, 2));
  console.log("* Returned Error:", JSON.stringify(response.error, null, 2));

  if (response.error) {
    console.error("\n❌ Insert Failed.");
    console.error("* PostgreSQL Error Code:", response.error.code);
    console.error("* PostgreSQL Error Message:", response.error.message);
    process.exit(1);
  }

  const createdId = response.data[0]?.id;
  console.log(`\n✅ Insert Succeeded! Generated Record ID: ${createdId}`);

  console.log("\n=================================================");
  console.log("VERIFYING DATA PRESENCE (READ-BACK QUERY)");
  console.log("=================================================");
  const { data: readData, error: readError } = await supabase
    .from('visitors')
    .select('*')
    .eq('id', createdId)
    .single();

  if (readError) {
    console.error("❌ Read-back validation failed:", readError.message);
    process.exit(1);
  }

  console.log("✅ Query Verified! The record exists in the database:");
  console.log(JSON.stringify(readData, null, 2));
  console.log("\n=================================================");
  console.log("🎉 ALL TASKS COMPLETE. EXITED CLEANLY.");
  console.log("=================================================");
  process.exit(0);
}

run();
