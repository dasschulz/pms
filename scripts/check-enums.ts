#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnumValues() {
  console.log('🔍 Checking enum values in Supabase...');


  try {
    // Check task_manager priority values
    const { data: priorities, error: priorityError } = await supabase
      .from('task_manager')
      .select('priority')
      .not('priority', 'is', null);

    if (priorityError) {
      console.error('❌ Error fetching priorities:', priorityError);
    } else {
      const uniquePriorities = [...new Set(priorities?.map(p => p.priority))];
      console.log('📋 Task priorities found:', uniquePriorities);
    }

    // Check task_manager status values
    const { data: statuses, error: statusError } = await supabase
      .from('task_manager')
      .select('status')
      .not('status', 'is', null);

    if (statusError) {
      console.error('❌ Error fetching statuses:', statusError);
    } else {
      const uniqueStatuses = [...new Set(statuses?.map(s => s.status))];
      console.log('📊 Task statuses found:', uniqueStatuses);
    }

    // Check BPA trip statuses
    const { data: tripStatuses, error: tripError } = await supabase
      .from('bpa_fahrten')
      .select('status_fahrt')
      .not('status_fahrt', 'is', null);

    if (tripError) {
      console.error('❌ Error fetching trip statuses:', tripError);
    } else {
      const uniqueTripStatuses = [...new Set(tripStatuses?.map(t => t.status_fahrt))];
      console.log('🚌 BPA trip statuses found:', uniqueTripStatuses);
    }

    console.log('✅ Enum check completed');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkEnumValues(); 