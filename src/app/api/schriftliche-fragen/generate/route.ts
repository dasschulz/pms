import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nicht autorisiert' 
      }, { status: 401 });
    }

    const userId = session.user.id; // Supabase UUID
    console.log('Schriftliche Fragen Generate: Processing for user:', userId);

    // Verify user exists in Supabase
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.log('Schriftliche Fragen Generate: User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const { context, specificFocus } = await request.json();

    // Build the prompt for AI generation following GOBT rules
    const systemPrompt = `Du bist ein Experte für parlamentarische Schriftliche Fragen nach der Geschäftsordnung des Bundestages (GOBT). 

WICHTIGE REGELN FÜR SCHRIFTLICHE FRAGEN:
1. Überschriften sind UNZULÄSSIG
2. Begründungen, Einleitungen oder Vorbemerkungen sind UNZULÄSSIG
3. Nur Fragesätze sind erlaubt, keine Aussagesätze
4. Maximal 1800 Zeichen
5. Maximal zwei Unterfragen in einem sachlichen Zusammenhang
6. Fragen müssen sachlich und bestimmt sein
7. Keine unsachlichen, beleidigenden, wertenden oder polemischen Formulierungen
8. Fragen dürfen nur den Verantwortungsbereich der Bundesregierung betreffen
9. Keine Dreiecksfragen (Bewertung Dritter durch Bundesregierung)
10. Quellenangaben in Klammern direkt nach der Textstelle
11. Maximal ein Satz
12. Falls möglich, beginnen mit "Welche Kenntnisse hat die Bundesregierung über...", "Welche Informationen liegen der Bundesregierung zu..."

Erstelle eine gültige schriftliche Frage, die alle diese Regeln befolgt.`;

    const userPrompt = `${context ? `Kontext: ${context}` : ''}
${specificFocus ? `Zielstellung: ${specificFocus}` : ''}

Erstelle eine schriftliche Frage zu diesem Thema, die alle GOBT-Regeln befolgt. Die Frage sollte:
- Direkt als Fragesatz beginnen
- Sachlich und präzise formuliert sein
- Im Verantwortungsbereich der Bundesregierung liegen
- Nur einen Satz lang sein
- Unter 1800 Zeichen bleiben
- Keine Einleitung oder Begründung enthalten`;

    // Make request to OpenAI API
    console.log('Schriftliche Fragen Generate: Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', openaiResponse.status, openaiResponse.statusText);
      return NextResponse.json({
        success: false,
        error: 'Fehler bei der KI-Generierung'
      }, { status: 500 });
    }

    const openaiData = await openaiResponse.json();
    const generatedQuestion = openaiData.choices[0]?.message?.content?.trim();

    if (!generatedQuestion) {
      return NextResponse.json({
        success: false,
        error: 'Keine Frage generiert'
      }, { status: 500 });
    }

    console.log('Schriftliche Fragen Generate: Question generated successfully');

    // Validate the generated question
    const characterCount = generatedQuestion.length;
    const validationIssues: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (characterCount > 1800) {
      validationIssues.push(`Überschreitung der Zeichengrenze: ${characterCount}/1800 Zeichen`);
      suggestions.push('Frage kürzen und prägnanter formulieren');
    }

    if (!generatedQuestion.trim().endsWith('?')) {
      validationIssues.push('Muss mit einem Fragezeichen enden');
      suggestions.push('Fragezeichen am Ende hinzufügen');
    }

    // Check for forbidden elements
    if (generatedQuestion.includes('Begründung:') || 
        generatedQuestion.includes('Einleitung:') ||
        generatedQuestion.includes('Vorbemerkung:')) {
      validationIssues.push('Begründungen und Einleitungen sind unzulässig');
      suggestions.push('Einleitende Phrasen entfernen und direkt zur Frage übergehen');
    }

    // Check for statements vs questions
    const sentences = generatedQuestion.split(/[.!]/).filter((s: string) => s.trim().length > 0);
    const questionSentences = generatedQuestion.split('?').filter((s: string) => s.trim().length > 0);
    
    if (sentences.length > questionSentences.length) {
      validationIssues.push('Nur Fragesätze sind zulässig, keine Aussagesätze');
      suggestions.push('Aussagesätze in Fragesätze umformulieren');
    }

    // Check for too many sub-questions
    const questionMarks = (generatedQuestion.match(/\?/g) || []).length;
    if (questionMarks > 2) {
      validationIssues.push('Maximal zwei Unterfragen erlaubt');
      suggestions.push('Frage aufteilen oder Unterfragen reduzieren');
    }

    // Additional helpful suggestions
    if (characterCount < 100) {
      suggestions.push('Frage könnte spezifischer und detaillierter formuliert werden');
    }

    if (!generatedQuestion.includes('Bundesregierung')) {
      suggestions.push('Sicherstellen, dass die Frage den Verantwortungsbereich der Bundesregierung betrifft');
    }

    const isValid = validationIssues.length === 0 && characterCount <= 1800;

    // Save to Supabase if valid
    let recordId: string | null = null;
    if (isValid) {
      try {
        // Generate a title based on the first few words of the question
        const titleMatch = generatedQuestion.match(/^(.{1,80})/);
        const title = titleMatch ? `${titleMatch[1]}${generatedQuestion.length > 80 ? '...' : ''}` : 'Schriftliche Frage';

        const { data: record, error: createError } = await supabase
          .from('schriftliche_fragen')
          .insert({
            user_id: userId,
            title: title,
            content: generatedQuestion,
          })
          .select()
          .single();

        if (createError) {
          console.error('Schriftliche Fragen Generate: Error saving to Supabase:', createError);
          // Don't fail the request if save fails - just log it
        } else {
          recordId = record.id;
          console.log('Schriftliche Fragen Generate: Question saved to Supabase:', recordId);
        }
      } catch (supabaseError) {
        console.error('Schriftliche Fragen Generate: Supabase save error:', supabaseError);
        // Don't fail the request if save fails
      }
    }

    return NextResponse.json({
      success: true,
      question: {
        id: recordId,
        question: generatedQuestion,
        characterCount,
        isValid,
        validationIssues,
        suggestions
      }
    });

  } catch (error) {
    console.error('Schriftliche Fragen Generate: Error in generate:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Serverfehler bei der Fragengenerierung'
    }, { status: 500 });
  }
} 