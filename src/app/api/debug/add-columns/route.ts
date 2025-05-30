import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('Adding missing columns to wahlkreisbueros table...');
    
    const queries = [
      {
        name: 'telefon',
        sql: `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS telefon VARCHAR(50);`
      },
      {
        name: 'email', 
        sql: `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS email VARCHAR(255);`
      },
      {
        name: 'website',
        sql: `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS website TEXT;`
      },
      {
        name: 'barrierefreiheit',
        sql: `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS barrierefreiheit BOOLEAN DEFAULT false;`
      },
      {
        name: 'notizen',
        sql: `ALTER TABLE public.wahlkreisbueros ADD COLUMN IF NOT EXISTS notizen TEXT;`
      }
    ];

    const results = [];
    
    for (const query of queries) {
      console.log(`Adding column: ${query.name}`);
      
      // Use the connection to execute raw SQL
      const { error } = await supabase
        .from('wahlkreisbueros')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error(`Error with connection test:`, error);
        continue;
      }
      
      // For now, let's just verify the connection works
      // In production, we'd use a proper migration system
      results.push({
        column: query.name,
        status: 'pending',
        message: 'Migration endpoint created - manual execution required'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration endpoint ready',
      results,
      note: 'Please run the actual migration through Supabase dashboard or CLI'
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 