require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'present' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'present' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function addMissingColumns() {
  console.log('Adding missing columns to wahlkreisbueros table...');
  
  // First, let's check if exec_sql function exists and create it if needed
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'OK';
    END;
    $$;
  `;
  
  console.log('Creating exec_sql function...');
  const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
  if (functionError) {
    console.log('Function may already exist, continuing...');
  }
  
  const queries = [
    `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS telefon VARCHAR(50);`,
    `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
    `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS website TEXT;`,
    `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS barrierefreiheit BOOLEAN DEFAULT false;`,
    `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS notizen TEXT;`
  ];

  for (const query of queries) {
    console.log(`Executing: ${query}`);
    const { data, error } = await supabase.rpc('exec_sql', { sql: query });
    
    if (error) {
      console.error(`Error executing query: ${query}`, error);
    } else {
      console.log('✓ Query executed successfully:', data);
    }
  }
  
  console.log('Migration completed!');
}

// Execute if run directly
if (require.main === module) {
  addMissingColumns().catch(console.error);
}

module.exports = { addMissingColumns }; 