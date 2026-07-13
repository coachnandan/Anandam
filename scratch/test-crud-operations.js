// test-crud-operations.js
// Simple script to verify Supabase CRUD flow for clients, memberships, attendance.
// Run with: node test-crud-operations.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Starting CRUD verification ---');

  // 1. Insert a test client
  const clientData = {
    name: 'Test Client',
    email: 'test@example.com',
    contact: '1234567890',
    address: JSON.stringify({
      street: '123 Test St',
      city: 'Testville',
      profession: 'Yoga Instructor',
      purpose: 'Health',
      whatsapp_number: '1234567890'
    }),
    status: 'Active',
    profession: 'Yoga Instructor',
    purpose: 'Health',
    whatsapp_number: '1234567890'
  };
  const { data: newClient, error: err1 } = await supabase.from('clients').insert([clientData]).select();
  if (err1) { console.error('Insert client error:', err1); return; }
  console.log('Inserted client:', newClient[0]);

  const clientId = newClient[0].id;

  // 2. Update the client
  const { data: updatedClient, error: err2 } = await supabase
    .from('clients')
    .update({ status: 'Inactive' })
    .eq('id', clientId)
    .select();
  if (err2) { console.error('Update client error:', err2); return; }
  console.log('Updated client status:', updatedClient[0].status);

  // 3. Insert attendance for today
  const today = new Date().toISOString().split('T')[0];
  const attendanceRecord = {
    client_id: clientId,
    date: today,
    status: 'Present'
  };
  const { data: attInsert, error: err3 } = await supabase.from('attendance').insert([attendanceRecord]).select();
  if (err3) { console.error('Insert attendance error:', err3); return; }
  console.log('Inserted attendance:', attInsert[0]);

  // 4. Delete client (cascade should remove attendance if DB set)
  const { error: err4 } = await supabase.from('clients').delete().eq('id', clientId);
  if (err4) { console.error('Delete client error:', err4); return; }
  console.log('Deleted client');

  // Verify attendance removed
  const { data: attCheck, error: err5 } = await supabase.from('attendance').select().eq('client_id', clientId);
  if (err5) { console.error('Attendance check error:', err5); return; }
  console.log('Attendance after delete (should be empty):', attCheck);

  console.log('--- CRUD verification completed ---');
}

main();
