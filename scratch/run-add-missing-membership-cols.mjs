// run-add-missing-membership-cols.mjs
// Adds missing columns to the memberships table in Supabase

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmdra3JseWtqZHZnZGVpcW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNzcsImV4cCI6MjA5NDA5NzA3N30.tuRIePjiZDy4OgUmeB5SMl6MIb4OgYANUUEZbJb-JCE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statements = [
  `ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS remaining_days INTEGER DEFAULT 0`,
  `ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS extra_type TEXT`,
  `ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS extra_charge NUMERIC DEFAULT 0`,
  `UPDATE public.memberships SET remaining_days = duration_days WHERE remaining_days = 0 AND duration_days IS NOT NULL`,
  `NOTIFY pgrst, 'reload schema'`,
];

console.log('\n🚀 Running membership columns migration...\n');

let passed = 0;
let failed = 0;
const failedStmts = [];

for (const stmt of statements) {
  const label = stmt.slice(0, 80).replace(/\n/g, ' ');
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: stmt });
    if (error) throw error;
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (err) {
    console.log(`  ⚠️  Cannot auto-run (needs service role): ${label.slice(0, 60)}...`);
    console.log(`     → ${err.message || err}`);
    failed++;
    failedStmts.push(stmt);
  }
}

console.log(`\n📊 Results: ${passed} succeeded, ${failed} need manual run`);

if (failed > 0) {
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('📋 PASTE THIS INTO Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/ixvgkkrlykjdvgdeiqmi/sql/new');
  console.log('─────────────────────────────────────────────────────────────────\n');
  console.log(`ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS remaining_days  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_type      TEXT,
  ADD COLUMN IF NOT EXISTS extra_charge    NUMERIC DEFAULT 0;

UPDATE public.memberships
  SET remaining_days = duration_days
  WHERE remaining_days = 0 AND duration_days IS NOT NULL;

NOTIFY pgrst, 'reload schema';`);
  console.log('\n─────────────────────────────────────────────────────────────────');
}
