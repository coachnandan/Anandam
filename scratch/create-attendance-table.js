import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Leave')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select attendance" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert attendance" ON public.attendance FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update attendance" ON public.attendance FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
`;

// Use REST API to execute SQL via Supabase RPC
async function run() {
  // Try using rpc or direct SQL execution
  // Since anon key can't run raw SQL, we'll use the management API
  // Instead, let's use the service approach via fetch
  
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.log('No service role key found. Using REST API approach...');
    console.log('');
    console.log('Please run this SQL in your Supabase Dashboard SQL Editor:');
    console.log('========================================================');
    console.log(sql);
    console.log('========================================================');
    return;
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Status:', res.status);
  console.log('Response:', await res.text());
}

run();
