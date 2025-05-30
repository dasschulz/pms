import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const migrationSQL = `
      -- Add missing columns to wahlkreisbueros table
      ALTER TABLE public.wahlkreisbueros 
      ADD COLUMN IF NOT EXISTS telefon VARCHAR(50),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS website TEXT,
      ADD COLUMN IF NOT EXISTS barrierefreiheit BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS notizen TEXT;
    `;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration SQL ready',
      sql: migrationSQL,
      instructions: [
        '1. Copy the SQL above',
        '2. Go to Supabase Dashboard > SQL Editor',
        '3. Paste and execute the SQL',
        '4. Refresh the application'
      ]
    });
    
  } catch (error) {
    console.error('Migration preparation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 