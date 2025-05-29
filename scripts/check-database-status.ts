#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqpcivtlowdqsyhcwhql.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcGNpdnRsb3dkcXN5aGN3aHFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ2MjQ4MiwiZXhwIjoyMDY0MDM4NDgyfQ.8wST-T49me7NCcPVlEwoXsNvlyDHnXNSdNMipmBt-h0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkDatabaseStatus() {
  console.log('🔍 Checking all tables and their status in Supabase...\n');
  
  // List of tables we know exist based on the codebase
  const knownTables = [
    'users',
    'user_preferences', 
    'data',
    'touranfragen',
    'task_manager',
    'bpa_formular',
    'bpa_fahrten',
    'news',
    'politicians',
    'reden',
    'tagesordnung',
    'bundestag_sessions',
    'kleine_anfragen',
    'schriftliche_fragen',
    'journalisten',
    'referenten',
    'raumbuchungen',
    'pressemitteilungen',
    'wahlkreisbueros'
  ];

  console.log(`📊 Checking status of known tables:\n`);

  for (const tableName of knownTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        const rowCount = count || 0;
        const status = rowCount > 0 ? '✅' : '⚪';
        console.log(`${status} ${tableName}: ${rowCount} rows`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Table might not exist`);
    }
  }

  console.log('\n📋 Legend:');
  console.log('✅ = Table has data (migrated)');
  console.log('⚪ = Table exists but is empty');
  console.log('❌ = Table does not exist or has access issues');
}

// Run if called directly
if (require.main === module) {
  checkDatabaseStatus().catch(console.error);
}

export { checkDatabaseStatus }; 