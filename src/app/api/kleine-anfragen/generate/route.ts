import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { generateMinorInquiry } from '@/ai/flows/generate-minor-inquiry';

export async function POST(request: NextRequest) {
  try {
    const { topic, context, desiredOutcome, targetAudience } = await request.json();
    
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const userId = session.user.id; // Supabase UUID

    console.log('Kleine Anfragen Generate: Creating inquiry for user:', userId);

    // Verify user exists in Supabase
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.log('Kleine Anfragen Generate: User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Normalize targetAudience to array of strings
    const taArray: string[] = Array.isArray(targetAudience) ? targetAudience : [targetAudience];

    if (!topic || !context || !desiredOutcome || taArray.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const audienceText = taArray.join(', ');

    console.log('Kleine Anfragen Generate: Creating record for topic:', topic);

    // Create initial record in Supabase
    const inquiryData = {
      user_id: userId,
      title: topic, // Will be updated with AI-generated title
      content: `Hintergrundinfos: ${context}\nPrompt: ${desiredOutcome}\nBeteiligte MdB: ${audienceText}`,
      category: audienceText,
    };

    const { data: record, error: createError } = await supabase
      .from('kleine_anfragen')
      .insert(inquiryData)
      .select()
      .single();

    if (createError) {
      console.error('Kleine Anfragen Generate: Error creating record:', createError);
      return NextResponse.json({ error: 'Failed to create inquiry record' }, { status: 500 });
    }

    const recordId = record.id;
    console.log('Kleine Anfragen Generate: Record created:', recordId);

    // Generate inquiry via AI flow
    console.log('Kleine Anfragen Generate: Generating AI content');
    const aiResult = await generateMinorInquiry({ topic, context, desiredOutcome, targetAudience: audienceText });

    // Update record with AI result
    const { data: updatedRecord, error: updateError } = await supabase
      .from('kleine_anfragen')
      .update({
        title: aiResult.title,
        content: aiResult.inquiryText,
      })
      .eq('id', recordId)
      .select()
      .single();

    if (updateError) {
      console.error('Kleine Anfragen Generate: Error updating record with AI result:', updateError);
      return NextResponse.json({ error: 'Failed to update inquiry with AI content' }, { status: 500 });
    }

    console.log('Kleine Anfragen Generate: AI content updated successfully');

    return NextResponse.json({ id: recordId, ...aiResult });
  } catch (error) {
    console.error('Kleine Anfragen Generate: Error in generate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 