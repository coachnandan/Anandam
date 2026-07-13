import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmdra3JseWtqZHZnZGVpcW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNzcsImV4cCI6MjA5NDA5NzA3N30.tuRIePjiZDy4OgUmeB5SMl6MIb4OgYANUUEZbJb-JCE';

// SQL to add missing columns to clients table
const migrationSQL = `
-- Add missing columns to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS mobile_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS member_type TEXT,
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Update existing rows to copy data from legacy fields
UPDATE public.clients SET 
  full_name = COALESCE(full_name, name),
  mobile_number = COALESCE(mobile_number, contact);
`;

async function runMigration() {
  console.log('🔄 Starting Supabase migration...\n');

  // Method 1: Try using Supabase SQL API via fetch
  // This requires the service_role key from Supabase Dashboard
  console.log('⚠️  IMPORTANT: To run migrations automatically, you need to:');
  console.log('   1. Go to Supabase Dashboard → Settings → API');
  console.log('   2. Copy the "service_role" key (secret)');
  console.log('   3. Run this script with: SERVICE_ROLE_KEY=your_key node scratch/migrate-clients-columns.js\n');

  // Check if service role key is provided via environment variable
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY;
  
  if (serviceRoleKey) {
    console.log('✅ Service role key found, running migration...\n');
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: migrationSQL
        })
      });

      if (response.ok) {
        console.log('✅ Migration completed successfully!');
      } else {
        const error = await response.text();
        console.error('❌ Migration failed:', error);
      }
    } catch (err) {
      console.error('❌ Error running migration:', err.message);
    }
  } else {
    console.log('📋 No service role key provided. Please run the migration manually:\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Go to: Supabase Dashboard → SQL Editor → New Query');
    console.log('Paste and run this SQL:\n');
    console.log(migrationSQL);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Also check current schema
    console.log('🔍 Checking current schema...\n');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.from('clients').select('*').limit(1);
    if (error) {
      console.log('❌ Error querying clients table:', error.message);
    } else if (data && data.length > 0) {
      console.log('Current columns in clients table:');
      console.log(Object.keys(data[0]).join(', '));
    } else {
      console.log('No rows in clients table yet.');
    }
  }
}

runMigration();
