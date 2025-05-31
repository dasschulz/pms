import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup of duplicate user preferences...');

    // Get all preference records grouped by user_id
    const { data: allRecords, error: fetchError } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .order('user_id, last_update', { ascending: true });

    if (fetchError) {
      console.error('Error fetching preferences:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    console.log(`Found ${allRecords?.length || 0} total preference records`);

    // Group records by user_id
    const userGroups: { [userId: string]: any[] } = {};
    allRecords?.forEach(record => {
      if (!userGroups[record.user_id]) {
        userGroups[record.user_id] = [];
      }
      userGroups[record.user_id].push(record);
    });

    let totalDeleted = 0;
    let usersProcessed = 0;

    // For each user, keep only the most recent record
    for (const [userId, records] of Object.entries(userGroups)) {
      if (records.length > 1) {
        // Sort by last_update to find the most recent
        records.sort((a, b) => new Date(b.last_update).getTime() - new Date(a.last_update).getTime());
        
        const mostRecent = records[0];
        const toDelete = records.slice(1);

        console.log(`User ${userId}: Keeping record ${mostRecent.id}, deleting ${toDelete.length} duplicates`);

        // Delete all except the most recent
        const idsToDelete = toDelete.map(r => r.id);
        
        const { error: deleteError } = await supabaseAdmin
          .from('user_preferences')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error(`Error deleting duplicates for user ${userId}:`, deleteError);
        } else {
          totalDeleted += toDelete.length;
        }
      }
      usersProcessed++;
    }

    console.log(`✅ Cleanup complete: Processed ${usersProcessed} users, deleted ${totalDeleted} duplicate records`);

    return NextResponse.json({
      success: true,
      usersProcessed,
      recordsDeleted: totalDeleted,
      message: `Cleaned up ${totalDeleted} duplicate preference records for ${usersProcessed} users`
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 