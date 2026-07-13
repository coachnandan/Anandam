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

async function verifyOps() {
  console.log("=========================================");
  console.log("TESTING SHAKE_LOGS CRUD OPERATIONS");
  console.log("=========================================");

  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_EMAIL,
    password: env.TEST_USER_PASSWORD
  });

  if (authError) {
    console.error("❌ Sign in failed:", authError.message);
    process.exit(1);
  }

  const userId = authData.user?.id;
  console.log(`✅ Signed in as ${authData.user?.email} (${userId})`);

  // Fetch role and club
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log(`   Role: ${profile?.role}, Club ID: ${profile?.club_id}`);

  const testClubId = profile?.club_id || '747b0e1b-b4bf-4277-bf30-4e33db33cd84';

  // 1. SELECT test
  console.log("\n1. Testing SELECT...");
  const { data: selectData, error: selectErr } = await supabase
    .from('shake_logs')
    .select('*')
    .limit(5);

  if (selectErr) {
    console.error("❌ SELECT failed:", selectErr.message);
  } else {
    console.log(`✅ SELECT succeeded! Found ${selectData.length} records.`);
  }

  // 2. INSERT test
  console.log("\n2. Testing INSERT...");
  const uniqueDate = new Date().toISOString().split('T')[0]; // today
  const testPayload = {
    club_id: testClubId,
    person_type: 'VISITOR',
    person_id: 'dd0981b8-ca9f-43c1-a962-b4c3ef48d494', // Just use user id or a random UUID
    shake_type_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', // Standard Shake
    quantity: 1,
    payment_type: 'Cash',
    marked_by: userId,
    date: uniqueDate,
    time: '10:00 AM'
  };

  // Delete matching unique record first to prevent UNIQUE constraint violation on conflict
  await supabase
    .from('shake_logs')
    .delete()
    .match({
      person_type: testPayload.person_type,
      person_id: testPayload.person_id,
      shake_type_id: testPayload.shake_type_id,
      date: testPayload.date
    });

  const { data: insertData, error: insertErr } = await supabase
    .from('shake_logs')
    .insert([testPayload])
    .select();

  let insertedId = null;
  if (insertErr) {
    console.error("❌ INSERT failed:", insertErr.message);
  } else {
    insertedId = insertData[0]?.id;
    console.log("✅ INSERT succeeded! New ID:", insertedId);
    console.log(JSON.stringify(insertData[0], null, 2));
  }

  // 3. UPDATE test
  if (insertedId) {
    console.log("\n3. Testing UPDATE...");
    const { data: updateData, error: updateErr } = await supabase
      .from('shake_logs')
      .update({ quantity: 2, payment_type: 'Online' })
      .eq('id', insertedId)
      .select();

    if (updateErr) {
      console.error("❌ UPDATE failed:", updateErr.message);
    } else {
      console.log("✅ UPDATE succeeded!");
      console.log(JSON.stringify(updateData[0], null, 2));
    }
  }

  // 4. DELETE test
  if (insertedId) {
    console.log("\n4. Testing DELETE...");
    const { error: deleteErr } = await supabase
      .from('shake_logs')
      .delete()
      .eq('id', insertedId);

    if (deleteErr) {
      console.log("ℹ️ DELETE failed (as expected if junior_admin, or actual error):", deleteErr.message);
    } else {
      console.log("ℹ️ DELETE succeeded (expected only if admin/super_admin).");
    }
  }
}

verifyOps();
