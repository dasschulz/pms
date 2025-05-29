// test-users-table.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userIdToTest = '950fac6e-c5d2-4eb0-afb0-1eef0856bb8b';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase credentials missing!');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testUsersTable() {
  console.log(`Testing users table...`);
  
  try {
    // First, check if the specific user exists
    console.log(`\nChecking for user ID: ${userIdToTest}`);
    const { data: specificUser, error: specificError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userIdToTest)
      .single();
    
    if (specificError) {
      console.error('Error finding specific user:', specificError);
    } else if (specificUser) {
      console.log('Found specific user:', specificUser.name, specificUser.email);
    } else {
      console.log('User not found in public.users table');
    }
    
    // Check all users in the table to see what IDs exist
    console.log(`\nListing all users in public.users table:`);
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .limit(10);
    
    if (allUsersError) {
      console.error('Error fetching all users:', allUsersError);
    } else {
      console.log(`Found ${allUsers?.length || 0} users:`);
      allUsers?.forEach(user => {
        console.log(`- ${user.id}: ${user.name} (${user.email})`);
      });
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

testUsersTable(); 