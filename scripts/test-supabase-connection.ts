import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqpcivtlowdqsyhcwhql.supabase.co';

// Test multiple possible service role keys
const keys = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcGNpdnRsb3dkcXN5aGN3aHFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ2MjQ4MiwiZXhwIjoyMDY0MDM4NDgyfQ.8wST-T49me7NCcPVlEwoXsNvlyDHnXNSdNMipmBt-h0',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
];

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...');
  console.log('📍 URL:', SUPABASE_URL);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key) {
      console.log(`⏭️  Key ${i + 1}: undefined/null`);
      continue;
    }
    
    console.log(`\n🔑 Testing key ${i + 1}: ${key.substring(0, 50)}...`);
    
    try {
      const supabase = createClient(SUPABASE_URL, key);
      
      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Key ${i + 1} failed:`, error.message);
      } else {
        console.log(`✅ Key ${i + 1} works! Connection successful`);
        console.log(`📊 Response:`, data);
        return key;
      }
    } catch (error: any) {
      console.log(`❌ Key ${i + 1} exception:`, error.message);
    }
  }
  
  console.log('\n❌ All keys failed. Please check:');
  console.log('1. Go to https://vqpcivtlowdqsyhcwhql.supabase.co/project/vqpcivtlowdqsyhcwhql/settings/api');
  console.log('2. Copy the complete service_role key');
  console.log('3. Make sure the schema has been applied');
  return null;
}

testSupabaseConnection().then(result => {
  if (result) {
    console.log('\n🎯 Use this key for migration:', result);
  }
}); 