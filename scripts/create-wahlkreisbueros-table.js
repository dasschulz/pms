const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTable() {
  try {
    console.log('Testing table access...');
    
    const { data, error } = await supabase
      .from('wahlkreisbueros')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error accessing table:', error);
      return false;
    }

    console.log('Table is accessible! Record count:', data?.length || 0);
    return true;
  } catch (error) {
    console.error('Error testing table:', error);
    return false;
  }
}

async function createTestRecord() {
  try {
    console.log('Creating test record...');
    
    // Try to insert a test record to see what happens
    const { data, error } = await supabase
      .from('wahlkreisbueros')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        name: 'Test Wahlkreisbüro',
        strasse: 'Teststraße',
        hausnummer: '1',
        plz: '12345',
        ort: 'Testort'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test record:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('Test record created successfully:', data);
    
    // Clean up test record
    const { error: deleteError } = await supabase
      .from('wahlkreisbueros')
      .delete()
      .eq('id', data.id);
      
    if (deleteError) {
      console.error('Error deleting test record:', deleteError);
    } else {
      console.log('Test record cleaned up');
    }
    
    return true;
  } catch (error) {
    console.error('Error in test record creation:', error);
    return false;
  }
}

async function main() {
  console.log('Starting wahlkreisbueros table diagnostics...');
  
  // First test if table already exists
  if (await testTable()) {
    console.log('✅ Table already exists and is accessible!');
    
    // Try to create a test record
    if (await createTestRecord()) {
      console.log('✅ Table is fully functional!');
    } else {
      console.log('❌ Table exists but has access restrictions');
    }
    return;
  }

  console.log('❌ Table does not exist or is not accessible');
  console.log('');
  console.log('Please create the table manually in Supabase SQL Editor with:');
  console.log('');
  console.log(`CREATE TABLE IF NOT EXISTS public.wahlkreisbueros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  strasse VARCHAR(255) NOT NULL,
  hausnummer VARCHAR(20) NOT NULL,
  plz VARCHAR(10) NOT NULL,
  ort VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wahlkreisbueros_user_id ON public.wahlkreisbueros(user_id);

ALTER TABLE public.wahlkreisbueros DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.wahlkreisbueros TO authenticated;
GRANT ALL ON public.wahlkreisbueros TO anon;`);
}

main().catch(console.error); 