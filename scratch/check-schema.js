import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dmdra3JseWtqZHZnZGVpcW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjEwNzcsImV4cCI6MjA5NDA5NzA3N30.tuRIePjiZDy4OgUmeB5SMl6MIb4OgYANUUEZbJb-JCE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Checking tables and columns...");
  
  // We can query information_schema or just run selects on tables to see what columns they return
  const tables = ['profiles', 'clients', 'memberships', 'attendance', 'notification_logs', 'renewal_logs'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`Error querying table ${table}:`, error.message);
      } else {
        console.log(`Table ${table} exists. Columns returned in first row (or empty):`, data[0] ? Object.keys(data[0]) : 'no rows');
      }
    } catch (e) {
      console.error(`Unexpected error for ${table}:`, e.message);
    }
  }
}

run();
