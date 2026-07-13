import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';

// dotenv not needed natively in Node 20.6+ using --env-file


const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const server = createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end('ok');
    return;
  }

  if (req.method === 'GET') {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Mock Supabase Edge Function is running', port: 54321 }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, corsHeaders);
    res.end('Method Not Allowed');
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      const authHeader = req.headers['authorization'];
      if (!authHeader) throw new Error('Unauthorized');
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) throw new Error('Unauthorized');

      const parsedBody = JSON.parse(body);
      const { client_id, whatsapp_number, message_type, client_name, plan, expiry_date, new_expiry_date } = parsedBody;

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        throw new Error('Twilio credentials are not configured in .env file');
      }

      let to_number = whatsapp_number;
      if (!to_number.startsWith('whatsapp:')) {
        const clean_number = to_number.replace(/[^\d+]/g, '');
        to_number = `whatsapp:${clean_number.startsWith('+') ? clean_number : '+' + clean_number}`;
      }

      let msgBody = '';
      switch (message_type) {
        case 'Welcome':
          msgBody = `Welcome to Elevate Sanctuary, ${client_name}! We are thrilled to guide your wellness journey.`;
          break;
        case 'MembershipCreated':
          msgBody = `Hello ${client_name}, your ${plan} membership has been successfully activated. Welcome to the Sanctuary!`;
          break;
        case 'Welcome Plan':
          msgBody = `Hello ${client_name}, your membership has been successfully renewed until ${expiry_date || new_expiry_date}. We're glad to have you back in the flow!`;
          break;
        case 'Renewal Confirmation':
          msgBody = `Hi ${client_name}, this confirms your membership renewal. Your new access is valid until ${new_expiry_date}. Stay elevated.`;
          break;
        default:
          msgBody = `Hello ${client_name}, this is a notification from Elevate Sanctuary.`;
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const twilioData = new URLSearchParams();
      twilioData.append('To', to_number);
      twilioData.append('From', TWILIO_WHATSAPP_NUMBER);
      twilioData.append('Body', msgBody);

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: twilioData
      });

      const twilioResult = await twilioResponse.json();

      if (!twilioResponse.ok) {
        throw new Error(`Twilio Error: ${twilioResult.message}`);
      }

      await supabaseClient.from('notification_logs').insert({
        client_id: client_id,
        message_type: message_type,
        status: 'Sent'
      });

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, sid: twilioResult.sid }));

    } catch (error) {
      console.error(error);
      res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
});

const PORT = 54321;
server.listen(PORT, () => {
  console.log(`🚀 Mock Supabase Edge Function running successfully!`);
  console.log(`Endpoint: http://localhost:${PORT}/whatsapp-notify`);
});
