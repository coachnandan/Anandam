import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns(tableName, columns) {
  console.log(`Checking columns for ${tableName}...`);
  for (const col of columns) {
    const { error } = await supabase.from(tableName).select(col).limit(1);
    if (error) {
      console.log(`❌ Column "${col}" in table "${tableName}" does NOT exist. Error: ${error.message}`);
    } else {
      console.log(`✅ Column "${col}" in table "${tableName}" exists.`);
    }
  }
}

async function run() {
  await checkColumns('clients', [
    'whatsapp', 'phone', 'email', 'role', 'goal', 'source', 'joining', 'joined_at', 'created_date', 'metadata'
  ]);

  await checkColumns('notification_logs', [
    'message', 'content', 'body', 'text', 'log', 'message_body'
  ]);
}

run();
