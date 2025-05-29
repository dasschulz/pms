#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabaseUrl = 'https://vqpcivtlowdqsyhcwhql.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcGNpdnRsb3dkcXN5aGN3aHFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ2MjQ4MiwiZXhwIjoyMDY0MDM4NDgyfQ';

const supabase = createClient(supabaseUrl, serviceKey);

async function applySchema() {
  try {
    console.log('🔄 Reading schema file...');
    const schemaSQL = await fs.readFile('scripts/sql/0001_init.sql', 'utf-8');
    
    console.log('🚀 Applying schema to Supabase...');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 100) + '...');
          
          // Try direct approach
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': serviceKey
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            console.error(`❌ HTTP Error ${response.status}: ${response.statusText}`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
        
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }
    
    console.log('✅ Schema application completed!');
    
  } catch (error) {
    console.error('💥 Failed to apply schema:', error);
    process.exit(1);
  }
}

applySchema(); 