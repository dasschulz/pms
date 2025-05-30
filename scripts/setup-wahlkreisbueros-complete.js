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

const sqlStatements = [
  // Create storage bucket for office photos
  `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'wahlkreisbuero-photos',
     'wahlkreisbuero-photos',
     true,
     5242880,
     ARRAY['image/jpeg', 'image/png', 'image/webp']
   ) ON CONFLICT (id) DO NOTHING;`,

  // Create policy for wahlkreisbuero photos
  `CREATE POLICY IF NOT EXISTS "Wahlkreisbuero photos are publicly accessible" ON storage.objects
   FOR SELECT USING (bucket_id = 'wahlkreisbuero-photos');`,

  `CREATE POLICY IF NOT EXISTS "Users can upload wahlkreisbuero photos" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'wahlkreisbuero-photos' 
     AND auth.role() = 'authenticated'
   );`,

  `CREATE POLICY IF NOT EXISTS "Users can update their wahlkreisbuero photos" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'wahlkreisbuero-photos' 
     AND auth.role() = 'authenticated'
   );`,

  `CREATE POLICY IF NOT EXISTS "Users can delete their wahlkreisbuero photos" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'wahlkreisbuero-photos' 
     AND auth.role() = 'authenticated'
   );`,

  // Mitarbeiter table
  `CREATE TABLE IF NOT EXISTS public.wahlkreisbuero_mitarbeiter (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     wahlkreisbuero_id UUID REFERENCES public.wahlkreisbueros(id) ON DELETE CASCADE,
     name VARCHAR(255) NOT NULL,
     funktion VARCHAR(255) DEFAULT 'Mitarbeiter',
     telefon VARCHAR(50),
     email VARCHAR(255),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );`,

  // Öffnungszeiten table
  `CREATE TABLE IF NOT EXISTS public.wahlkreisbuero_oeffnungszeiten (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     wahlkreisbuero_id UUID REFERENCES public.wahlkreisbueros(id) ON DELETE CASCADE,
     wochentag INTEGER NOT NULL CHECK (wochentag >= 1 AND wochentag <= 7),
     von_zeit TIME,
     bis_zeit TIME,
     geschlossen BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(wahlkreisbuero_id, wochentag)
   );`,

  // Sprechstunden table (für MdB)
  `CREATE TABLE IF NOT EXISTS public.wahlkreisbuero_sprechstunden (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     wahlkreisbuero_id UUID REFERENCES public.wahlkreisbueros(id) ON DELETE CASCADE,
     mdb_name VARCHAR(255) NOT NULL,
     wochentag INTEGER CHECK (wochentag >= 1 AND wochentag <= 7),
     von_zeit TIME,
     bis_zeit TIME,
     beschreibung TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );`,

  // Create enum for beratung types
  `DO $$ BEGIN
     CREATE TYPE beratung_typ AS ENUM (
       'schuldenberatung',
       'buergergeldberatung', 
       'mietrechtsberatung',
       'arbeitsrechtsberatung'
     );
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;`,

  // Beratungsangebote table ("Die Linke hilft")
  `CREATE TABLE IF NOT EXISTS public.wahlkreisbuero_beratungen (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     wahlkreisbuero_id UUID REFERENCES public.wahlkreisbueros(id) ON DELETE CASCADE,
     typ beratung_typ NOT NULL,
     anbieter VARCHAR(255) NOT NULL,
     wochentag INTEGER CHECK (wochentag >= 1 AND wochentag <= 7),
     von_zeit TIME,
     bis_zeit TIME,
     beschreibung TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );`,

  // Enable RLS on new tables
  `ALTER TABLE public.wahlkreisbuero_mitarbeiter ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.wahlkreisbuero_oeffnungszeiten ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.wahlkreisbuero_sprechstunden ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.wahlkreisbuero_beratungen ENABLE ROW LEVEL SECURITY;`,

  // RLS Policies for mitarbeiter
  `CREATE POLICY IF NOT EXISTS "Users can view all mitarbeiter" ON public.wahlkreisbuero_mitarbeiter
   FOR SELECT USING (true);`,

  `CREATE POLICY IF NOT EXISTS "Users can manage mitarbeiter of their wahlkreisbueros" ON public.wahlkreisbuero_mitarbeiter
   FOR ALL USING (
     wahlkreisbuero_id IN (
       SELECT id FROM public.wahlkreisbueros WHERE user_id = auth.uid()
     )
   );`,

  // RLS Policies for öffnungszeiten
  `CREATE POLICY IF NOT EXISTS "Users can view all öffnungszeiten" ON public.wahlkreisbuero_oeffnungszeiten
   FOR SELECT USING (true);`,

  `CREATE POLICY IF NOT EXISTS "Users can manage öffnungszeiten of their wahlkreisbueros" ON public.wahlkreisbuero_oeffnungszeiten
   FOR ALL USING (
     wahlkreisbuero_id IN (
       SELECT id FROM public.wahlkreisbueros WHERE user_id = auth.uid()
     )
   );`,

  // RLS Policies for sprechstunden
  `CREATE POLICY IF NOT EXISTS "Users can view all sprechstunden" ON public.wahlkreisbuero_sprechstunden
   FOR SELECT USING (true);`,

  `CREATE POLICY IF NOT EXISTS "Users can manage sprechstunden of their wahlkreisbueros" ON public.wahlkreisbuero_sprechstunden
   FOR ALL USING (
     wahlkreisbuero_id IN (
       SELECT id FROM public.wahlkreisbueros WHERE user_id = auth.uid()
     )
   );`,

  // RLS Policies for beratungen
  `CREATE POLICY IF NOT EXISTS "Users can view all beratungen" ON public.wahlkreisbuero_beratungen
   FOR SELECT USING (true);`,

  `CREATE POLICY IF NOT EXISTS "Users can manage beratungen of their wahlkreisbueros" ON public.wahlkreisbuero_beratungen
   FOR ALL USING (
     wahlkreisbuero_id IN (
       SELECT id FROM public.wahlkreisbueros WHERE user_id = auth.uid()
     )
   );`,

  // Triggers for updated_at on new tables
  `CREATE TRIGGER IF NOT EXISTS update_wahlkreisbuero_mitarbeiter_updated_at 
   BEFORE UPDATE ON public.wahlkreisbuero_mitarbeiter 
   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`,

  `CREATE TRIGGER IF NOT EXISTS update_wahlkreisbuero_oeffnungszeiten_updated_at 
   BEFORE UPDATE ON public.wahlkreisbuero_oeffnungszeiten 
   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`,

  `CREATE TRIGGER IF NOT EXISTS update_wahlkreisbuero_sprechstunden_updated_at 
   BEFORE UPDATE ON public.wahlkreisbuero_sprechstunden 
   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`,

  `CREATE TRIGGER IF NOT EXISTS update_wahlkreisbuero_beratungen_updated_at 
   BEFORE UPDATE ON public.wahlkreisbuero_beratungen 
   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`,

  // Function to geocode address (placeholder for future API integration)
  `CREATE OR REPLACE FUNCTION public.geocode_address(
     p_strasse TEXT,
     p_hausnummer TEXT,
     p_plz TEXT,
     p_ort TEXT
   )
   RETURNS JSON AS $$
   DECLARE
     result JSON;
   BEGIN
     -- This is a placeholder function
     -- In real implementation, this would call a geocoding API like:
     -- - Google Maps Geocoding API
     -- - OpenStreetMap Nominatim
     -- - Here Geocoding API
     -- For now, return null coordinates
     result := json_build_object(
       'latitude', NULL,
       'longitude', NULL,
       'success', false,
       'message', 'Geocoding not yet implemented - add API integration here'
     );
     
     RETURN result;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;`,

  // Indexes for better performance
  `CREATE INDEX IF NOT EXISTS idx_wahlkreisbuero_mitarbeiter_buero_id ON public.wahlkreisbuero_mitarbeiter(wahlkreisbuero_id);`,
  `CREATE INDEX IF NOT EXISTS idx_wahlkreisbuero_oeffnungszeiten_buero_id ON public.wahlkreisbuero_oeffnungszeiten(wahlkreisbuero_id);`,
  `CREATE INDEX IF NOT EXISTS idx_wahlkreisbuero_sprechstunden_buero_id ON public.wahlkreisbuero_sprechstunden(wahlkreisbuero_id);`,
  `CREATE INDEX IF NOT EXISTS idx_wahlkreisbuero_beratungen_buero_id ON public.wahlkreisbuero_beratungen(wahlkreisbuero_id);`,
  `CREATE INDEX IF NOT EXISTS idx_wahlkreisbueros_coordinates ON public.wahlkreisbueros(latitude, longitude);`,

  // Grant necessary permissions
  `GRANT ALL ON public.wahlkreisbuero_mitarbeiter TO authenticated;`,
  `GRANT ALL ON public.wahlkreisbuero_oeffnungszeiten TO authenticated;`,
  `GRANT ALL ON public.wahlkreisbuero_sprechstunden TO authenticated;`,
  `GRANT ALL ON public.wahlkreisbuero_beratungen TO authenticated;`
];

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('SQL Error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Execution Error:', error);
    return false;
  }
}

async function createSQLFunction() {
  // First create the exec_sql function if it doesn't exist
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result json;
    BEGIN
      EXECUTE sql;
      result := json_build_object('success', true);
      RETURN result;
    EXCEPTION
      WHEN OTHERS THEN
        result := json_build_object(
          'success', false, 
          'error', SQLERRM,
          'code', SQLSTATE
        );
        RETURN result;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (error && !error.message.includes('does not exist')) {
      return true; // Function already exists
    }
    return true;
  } catch (error) {
    // Function doesn't exist, we'll need to create it differently
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up complete Wahlkreisbüros infrastructure...\n');

  // Check if we can use RPC functions
  const canUseRPC = await createSQLFunction();
  
  if (!canUseRPC) {
    console.log('❌ Cannot execute SQL via RPC. Please run the following SQL manually in Supabase SQL Editor:\n');
    console.log('-- COMPLETE WAHLKREISBÜROS SETUP');
    console.log('-- Copy and paste this entire block into Supabase SQL Editor\n');
    sqlStatements.forEach((sql, index) => {
      console.log(`-- Statement ${index + 1}`);
      console.log(sql);
      console.log('');
    });
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const statementNum = i + 1;
    
    console.log(`⏳ Executing statement ${statementNum}/${sqlStatements.length}...`);
    
    const success = await executeSQL(sql);
    if (success) {
      console.log(`✅ Statement ${statementNum} completed`);
      successCount++;
    } else {
      console.log(`❌ Statement ${statementNum} failed`);
      errorCount++;
    }
  }

  console.log('\n📊 Setup Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📋 Total: ${sqlStatements.length}`);

  if (errorCount === 0) {
    console.log('\n🎉 Complete Wahlkreisbüros setup finished successfully!');
    console.log('\n📋 What was created:');
    console.log('• 📁 Storage bucket: wahlkreisbuero-photos (5MB limit, images only)');
    console.log('• 👥 Table: wahlkreisbuero_mitarbeiter (staff management)');
    console.log('• 🕒 Table: wahlkreisbuero_oeffnungszeiten (opening hours)');
    console.log('• 📅 Table: wahlkreisbuero_sprechstunden (MdB consultation hours)');
    console.log('• 🆘 Table: wahlkreisbuero_beratungen (consultation services)');
    console.log('• 🗺️  Function: geocode_address (placeholder for coordinates)');
    console.log('• 🔒 RLS policies for all tables');
    console.log('• 📈 Performance indexes');
    
    console.log('\n🔄 Next steps:');
    console.log('1. Update the API to use ?include=relations again');
    console.log('2. Add photo upload functionality');
    console.log('3. Implement geocoding API integration');
    console.log('4. Create management interfaces for staff, hours, etc.');
  } else {
    console.log('\n⚠️  Some statements failed. Check the errors above.');
    console.log('You may need to run the failed statements manually in Supabase SQL Editor.');
  }
}

main().catch(console.error); 