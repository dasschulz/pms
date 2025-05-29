#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqpcivtlowdqsyhcwhql.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcGNpdnRsb3dkcXN5aGN3aHFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ2MjQ4MiwiZXhwIjoyMDY0MDM4NDgyfQ.8wST-T49me7NCcPVlEwoXsNvlyDHnXNSdNMipmBt-h0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
  console.log('🔍 Checking current database schema...');
  
  try {
    // Check if users table exists by trying to query it
    console.log('\n📋 Checking users table...');
    const { data: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) {
      console.log(`❌ Users table issue: ${usersError.message}`);
    } else {
      console.log(`✅ Users table exists with ${usersCount} records`);
    }
    
    // Check what tables we can access
    console.log('\n📋 Checking accessible tables...');
    const tableNames = [
      'users', 'user_preferences', 'data', 'touranfragen', 
      'bpa_fahrten', 'bpa_formular', 'task_manager'
    ];
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${data} records`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err}`);
      }
    }
    
    // Try to get one user record to see the structure
    console.log('\n👤 Checking users table structure...');
    const { data: sampleUser, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log(`❌ Cannot fetch sample user: ${sampleError.message}`);
    } else if (sampleUser && sampleUser.length > 0) {
      console.log('✅ Sample user record structure:');
      const user = sampleUser[0];
      for (const [key, value] of Object.entries(user)) {
        console.log(`   - ${key}: ${typeof value} = ${value}`);
      }
    } else {
      console.log('❌ No users found in table');
    }
    
  } catch (error) {
    console.error('💥 Error checking schema:', error);
  }
}

// Run if called directly
if (require.main === module) {
  checkSchema().catch(console.error);
}

export { checkSchema }; 