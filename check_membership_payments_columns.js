import { createClient } from '@supabase/supabase-js';

const url = 'https://zcnwhgjhwxyypanetwzd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbndoZ2pod3h5eXBhbmV0d3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjcyMDIsImV4cCI6MjA5OTMwMzIwMn0.k7_kh8gQeRFUiG4-ZhOvdFc2lRA_Qt4c8CgMt_UkkuA';

const supabase = createClient(url, key);

async function check() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'priyanshu@gmail.com',
    password: 'qazwsx@10'
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  const { data: pay, error: err } = await supabase.from('membership_payments').select('*').limit(1);
  console.log('Select Error:', err);
  if (pay && pay.length > 0) {
    console.log('Columns:', Object.keys(pay[0]));
  } else {
    // If table is empty, select schema query
    console.log('No rows in table.');
  }
}

check();
