// Run migration: 20260607_member_registration_tracking.sql
// Uses Supabase REST API with service role to execute DDL

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmdra3JseWtqZHZnZGVpcW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNzcsImV4cCI6MjA5NDA5NzA3N30.tuRIePjiZDy4OgUmeB5SMl6MIb4OgYANUUEZbJb-JCE';

// Run each statement individually via Supabase RPC
async function runMigration() {
  const sqlFile = path.join(__dirname, '../supabase/migrations/20260607_member_registration_tracking.sql');
  const sql = readFileSync(sqlFile, 'utf8');

  // Split on semicolons, filter out empty/comment-only blocks
  const statements = sql
    .split(/;(?!\s*\$\$)/)  // don't split inside $$ blocks
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  // We'll use fetch directly against the Supabase SQL API
  // Supabase exposes /rest/v1/rpc and also supports raw SQL via pg_meta (dashboard only)
  // For anon key we use the pg extension via stored procs approach
  // Instead, run via the Supabase management API if service role available,
  // or fall back to running statements individually via rpc exec_sql

  console.log(`\n📋 Migration: 20260607_member_registration_tracking.sql`);
  console.log(`🔗 Target: ${SUPABASE_URL}`);
  console.log('');

  // Try using rpc exec_sql (custom function that may exist)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Try running the full SQL using pg_dump compatible approach via REST
  // Most reliable: use the Supabase Management API (requires service key)
  // With anon key, attempt via custom rpc or direct fetch to /sql endpoint

  const projectRef = 'ixvgkkrlykjdvgdeiqmi';

  // Supabase has a SQL endpoint for dashboard (pg-meta) but requires service role
  // We'll attempt via the management REST API
  const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  // Since we only have anon key, we try each ALTER/UPDATE/CREATE separately via rpc
  // Build individual statements safely
  const safeStatements = [
    // Step 1: Add columns
    `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS registration_date DATE`,
    `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS registration_time_ist TEXT`,
    `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by_name TEXT`,
    // Step 2: Back-fill
    `UPDATE public.clients SET registration_date = (created_at AT TIME ZONE 'Asia/Kolkata')::DATE, registration_time_ist = TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM') WHERE registration_date IS NULL`,
    // Step 4: Indexes
    `CREATE INDEX IF NOT EXISTS idx_clients_registration_date ON public.clients(registration_date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_clients_created_by_name ON public.clients(created_by_name)`,
  ];

  let passed = 0;
  let failed = 0;

  for (const stmt of safeStatements) {
    const shortLabel = stmt.slice(0, 80).replace(/\n/g, ' ');
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      if (error) {
        // exec_sql rpc may not exist – try direct fetch
        throw error;
      }
      console.log(`  ✅ ${shortLabel}...`);
      passed++;
    } catch (err) {
      // exec_sql doesn't exist, report what would be needed
      console.log(`  ⚠️  Cannot auto-run via anon key: ${shortLabel.slice(0,60)}...`);
      console.log(`     → ${err.message || err}`);
      failed++;
    }
  }

  // Step 3: Function + trigger (PL/pgSQL) — needs service role
  const funcSql = `
CREATE OR REPLACE FUNCTION public.set_client_registration_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_date IS NULL THEN
    NEW.registration_date := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
  END IF;
  IF NEW.registration_time_ist IS NULL THEN
    NEW.registration_time_ist := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata','HH12:MI AM');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_registration_fields ON public.clients;

CREATE TRIGGER trg_client_registration_fields
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_client_registration_fields();
`.trim();

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: funcSql });
    if (error) throw error;
    console.log(`  ✅ Trigger + function created`);
    passed++;
  } catch (err) {
    console.log(`  ⚠️  Trigger/function requires manual execution (needs service role).`);
    failed++;
  }

  console.log('');
  console.log(`📊 Results: ${passed} succeeded, ${failed} require manual run`);
  
  if (failed > 0) {
    console.log('');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('📋 MANUAL STEPS — paste this into Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/ixvgkkrlykjdvgdeiqmi/sql/new');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(sql);
  }
}

runMigration().catch(console.error);
