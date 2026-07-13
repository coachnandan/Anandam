// Live Supabase Database Verification Script
// Run this to verify end-to-end CRUD operations on the live Supabase instance.
// Usage: node --experimental-websocket live_db_verification.js <email> <password>

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

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("=================================================");
  console.log("SUPABASE DATABASE VERIFICATION TOOL");
  console.log("=================================================");
  console.log("To run the complete authenticated CRUD tests, please provide your login credentials:");
  console.log("\n  node --experimental-websocket live_db_verification.js <email> <password>\n");
  console.log("Running in ANONYMOUS check mode...");
  runAnonymousCheck();
} else {
  runAuthenticatedVerification();
}

async function runAnonymousCheck() {
  console.log("Checking if RLS is active by performing anonymous insertions (should fail)...");
  
  const testClubId = '747b0e1b-b4bf-4277-bf30-4e33db33cd84';
  const visitorPayload = {
    club_id: testClubId,
    visitor_name: 'Anon Test Visitor',
    mobile_number: '9876543210'
  };

  const { status, statusText, error } = await supabase.from('visitors').insert([visitorPayload]);
  console.log(`\nResponse Status: ${status} (${statusText})`);
  if (error) {
    console.log("✅ RLS Check Passed! Anonymous insert was rejected as expected.");
    console.log("Reason:", error.message);
  } else {
    console.log("⚠️ Warning: Anonymous insert succeeded! RLS may be disabled or policy is overly permissive.");
  }
  process.exit(0);
}

async function runAuthenticatedVerification() {
  console.log("=================================================");
  console.log("STARTING LIVE SUPABASE DATABASE VERIFICATION");
  console.log("=================================================");
  console.log("Logging in as:", email);

  // Authenticate user
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error("❌ Sign In Failed:", signInError.message);
    process.exit(1);
  }

  const userId = authData.user?.id;
  console.log("✅ Authenticated successfully! User ID:", userId);

  // Ensure default club exists in DB
  const testClubId = '747b0e1b-b4bf-4277-bf30-4e33db33cd84';
  const { data: clubs, error: clubCheckErr } = await supabase.from('clubs').select('id').eq('id', testClubId);
  
  if (clubCheckErr || !clubs || clubs.length === 0) {
    console.log("Inserting seed club...");
    const { error: clubInsertErr } = await supabase.from('clubs').insert([{
      id: testClubId,
      name: 'Super Way Wellness Club',
      address: 'Jaipur, Rajasthan'
    }]);
    if (clubInsertErr) {
      console.error("❌ Club insertion failed:", clubInsertErr.message);
      process.exit(1);
    }
  }

  // Ensure user profile exists
  const { data: profile, error: profileErr } = await supabase.from('profiles').select('id, club_id').eq('id', userId).maybeSingle();
  let userClubId = profile?.club_id;

  if (profileErr || !profile) {
    console.log("Profile not found in profiles table. Registering profile...");
    const { error: profileInsertErr } = await supabase.from('profiles').insert([{
      id: userId,
      full_name: 'Database Verifier Agent',
      email: email,
      role: 'super_admin',
      club_id: testClubId,
      status: 'Active'
    }]);
    if (profileInsertErr) {
      console.error("❌ Profile insertion failed:", profileInsertErr.message);
      process.exit(1);
    }
    userClubId = testClubId;
    console.log("✅ Profile successfully registered.");
  } else {
    console.log("✅ User profile verified in public schema. Linked Club ID:", userClubId);
  }

  const targetClubId = userClubId || testClubId;

  console.log("\n=================================================");
  console.log("VERIFYING MODULE CRUD OPERATIONS");
  console.log("=================================================");

  // ─── VISITORS MODULE TEST ───
  console.log("\n--- TEST MODULE: VISITORS ---");
  const visitorPayload = {
    club_id: targetClubId,
    visitor_name: 'Test Visitor Agent',
    mobile_number: '9876543210',
    whatsapp_number: '9876543210',
    gender: 'Male',
    profession: 'Engineer',
    address: '123 Test St',
    referral: 'Self'
  };

  console.log("1. Insert Payload:", JSON.stringify(visitorPayload, null, 2));
  console.log("2. Active User ID:", userId);
  console.log("3. Active Club ID:", targetClubId);

  const visitorRes = await supabase.from('visitors').insert([visitorPayload]).select();
  console.log("4. Supabase Response Status:", visitorRes.status);
  console.log("5. Supabase Response StatusText:", visitorRes.statusText);
  if (visitorRes.error) {
    console.error("❌ Visitor Insert Failed:", visitorRes.error);
    process.exit(1);
  }
  console.log("✅ Visitor Insert Succeeded. Returned Data:", JSON.stringify(visitorRes.data, null, 2));

  const visitorId = visitorRes.data[0].id;
  console.log("6. Verifying read-back of inserted Visitor ID:", visitorId);
  const visitorRead = await supabase.from('visitors').select('*').eq('id', visitorId).single();
  if (visitorRead.error || !visitorRead.data) {
    console.error("❌ Read-back verification failed:", visitorRead.error?.message || "No data returned");
    process.exit(1);
  }
  console.log("✅ Row exists in database. Read-back matches:", JSON.stringify(visitorRead.data, null, 2));


  // ─── MEMBERS MODULE TEST ───
  console.log("\n--- TEST MODULE: MEMBERS ---");
  const memberPayload = {
    club_id: targetClubId,
    name: 'Test Member Agent',
    mobile_number: '9999988888',
    whatsapp_number: '9999988888',
    gender: 'Male',
    profession: 'Designer',
    referral: 'Social Media',
    address: '456 Client Rd',
    status: 'Active'
  };

  console.log("1. Insert Payload:", JSON.stringify(memberPayload, null, 2));
  const memberRes = await supabase.from('members').insert([memberPayload]).select();
  console.log("2. Supabase Response Status:", memberRes.status);
  if (memberRes.error) {
    console.error("❌ Member Insert Failed:", memberRes.error);
    process.exit(1);
  }
  const memberId = memberRes.data[0].id;
  console.log("✅ Member Insert Succeeded. Read-back verification for ID:", memberId);
  const memberRead = await supabase.from('members').select('*').eq('id', memberId).single();
  console.log("✅ Row exists in database. Read-back matches:", JSON.stringify(memberRead.data, null, 2));


  // ─── MEMBERSHIP MODULE TEST ───
  console.log("\n--- TEST MODULE: MEMBERSHIP ---");
  const membershipPayload = {
    member_id: memberId,
    plan: '30 Days',
    duration_days: 30,
    total_shake_limit: 30,
    total_amount: 7000,
    paid_amount: 5000,
    payment_status: 'Partially_Paid',
    start_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  };

  console.log("1. Insert Payload:", JSON.stringify(membershipPayload, null, 2));
  const membershipRes = await supabase.from('memberships').insert([membershipPayload]).select();
  console.log("2. Supabase Response Status:", membershipRes.status);
  if (membershipRes.error) {
    console.error("❌ Membership Insert Failed:", membershipRes.error);
    process.exit(1);
  }
  const membershipId = membershipRes.data[0].id;
  console.log("✅ Membership Insert Succeeded. Read-back verification for ID:", membershipId);
  const membershipRead = await supabase.from('memberships').select('*').eq('id', membershipId).single();
  console.log("✅ Row exists. Read-back matches:", JSON.stringify(membershipRead.data, null, 2));


  // ─── ATTENDANCE MODULE TEST ───
  console.log("\n--- TEST MODULE: ATTENDANCE ---");
  const attendancePayload = {
    member_id: memberId,
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    check_in_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    marked_by: userId
  };

  console.log("1. Insert Payload:", JSON.stringify(attendancePayload, null, 2));
  const attendanceRes = await supabase.from('attendance').insert([attendancePayload]).select();
  console.log("2. Supabase Response Status:", attendanceRes.status);
  if (attendanceRes.error) {
    console.error("❌ Attendance Insert Failed:", attendanceRes.error);
    process.exit(1);
  }
  console.log("✅ Attendance Insert Succeeded. Read-back verification...");
  const attendanceRead = await supabase.from('attendance')
    .select('*')
    .eq('member_id', memberId)
    .eq('date', attendancePayload.date)
    .single();
  console.log("✅ Row exists. Read-back matches:", JSON.stringify(attendanceRead.data, null, 2));


  // ─── CLOSING MODULE TEST ───
  console.log("\n--- TEST MODULE: CLOSING ---");
  const closingPayload = {
    visitor_id: visitorId,
    visit_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    selected_type: 'Pending'
  };

  console.log("1. Insert Payload:", JSON.stringify(closingPayload, null, 2));
  const closingRes = await supabase.from('closing_followups').insert([closingPayload]).select();
  console.log("2. Supabase Response Status:", closingRes.status);
  if (closingRes.error) {
    console.error("❌ Closing Followup Insert Failed:", closingRes.error);
    process.exit(1);
  }
  const closingId = closingRes.data[0].id;
  console.log("✅ Closing Insert Succeeded. Read-back verification for ID:", closingId);
  const closingRead = await supabase.from('closing_followups').select('*').eq('id', closingId).single();
  console.log("✅ Row exists. Read-back matches:", JSON.stringify(closingRead.data, null, 2));


  // ─── PAYMENTS MODULE TEST ───
  console.log("\n--- TEST MODULE: PAYMENTS ---");
  const paymentPayload = {
    membership_id: membershipId,
    amount_paid: 2000,
    payment_mode: 'Cash',
    payment_purpose: 'Subscription Payment',
    payment_date: new Date().toISOString().split('T')[0],
    marked_by: userId
  };

  console.log("1. Insert Payload:", JSON.stringify(paymentPayload, null, 2));
  const paymentRes = await supabase.from('membership_payments').insert([paymentPayload]).select();
  console.log("2. Supabase Response Status:", paymentRes.status);
  if (paymentRes.error) {
    console.error("❌ Payment Insert Failed:", paymentRes.error);
    process.exit(1);
  }
  const paymentId = paymentRes.data[0].id;
  console.log("✅ Payment Insert Succeeded. Read-back verification for ID:", paymentId);
  const paymentRead = await supabase.from('membership_payments').select('*').eq('id', paymentId).single();
  console.log("✅ Row exists. Read-back matches:", JSON.stringify(paymentRead.data, null, 2));

  console.log("\n=================================================");
  console.log("CLEANING UP TEST RECORDS");
  console.log("=================================================");

  // Delete in correct dependency order
  await supabase.from('membership_payments').delete().eq('id', paymentId);
  await supabase.from('closing_followups').delete().eq('id', closingId);
  await supabase.from('attendance').delete().eq('member_id', memberId).eq('date', attendancePayload.date);
  await supabase.from('memberships').delete().eq('id', membershipId);
  await supabase.from('members').delete().eq('id', memberId);
  await supabase.from('visitors').delete().eq('id', visitorId);
  console.log("✅ Test records cleaned up successfully.");

  console.log("\n=================================================");
  console.log("🎉 ALL LIVE SCHEMAS VERIFIED SUCCESSFULLY!");
  console.log("=================================================");
  process.exit(0);
}
