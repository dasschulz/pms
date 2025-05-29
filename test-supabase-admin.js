// test-supabase-admin.js
require('dotenv').config({ path: '.env.local' }); // Explizit .env.local angeben

const { createClient } = require('@supabase/supabase-js');

// ... Rest des Skripts bleibt gleich ...

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userIdToTest = '950fac6e-c5d2-4eb0-afb0-1eef0856bb8b'; // Die problematische User ID

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing! Check .env.local file or ensure variables are set.');
  console.error(`Loaded NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`); // Zum Debuggen
  console.error(`Loaded SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey}`); // Zum Debuggen
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testGetUser() {
  console.log(`Attempting to fetch user ${userIdToTest} via admin.getUserById()...`);
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userIdToTest);
    if (error) {
      console.error('Error fetching user:', error.message); 
      console.error('Full error object:', JSON.stringify(error, null, 2)); 
    } else if (data && data.user) {
      console.log('Fetched user data:', data.user);
    } else {
      console.log('User not found, but no explicit error object was returned from getUserById.');
      console.log('Full response data from getUserById:', data);
    }
  } catch (e) {
    console.error('Exception during fetch:', e);
  }
}

testGetUser();