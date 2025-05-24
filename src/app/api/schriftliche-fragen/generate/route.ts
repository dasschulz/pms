import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nicht autorisiert' 
      }, { status: 401 });
    }

    const { topic, context, specificFocus } = await request.json();

    if (!topic?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Thema ist erforderlich' 
      }, { status: 400 });
    }

    // Build the prompt for AI generation following GOBT rules
    const systemPrompt = `Du bist ein Experte für parlamentarische Schriftliche Fragen nach der Geschäftsordnung des Bundestages (GOBT). 

WICHTIGE REGELN FÜR SCHRIFTLICHE FRAGEN:
1. Überschriften sind UNZULÄSSIG
2. Begründungen, Einleitungen oder Vorbemerkungen sind UNZULÄSSIG
3. Nur Fragesätze sind erlaubt, keine Aussagesätze
4. Maximal 1800 Zeichen
5. Maximal zwei Unterfragen in einem sachlichen Zusammenhang
6. Fragen müssen sachlich und bestimmt sein
7. Keine unsachlichen, beleidigenden oder polemischen Formulierungen
8. Fragen dürfen nur den Verantwortungsbereich der Bundesregierung betreffen
9. Keine Dreiecksfragen (Bewertung Dritter durch Bundesregierung)
10. Quellenangaben in Klammern direkt nach der Textstelle

Erstelle eine gültige schriftliche Frage, die alle diese Regeln befolgt.`;

    const userPrompt = `Thema: ${topic}
${context ? `Kontext: ${context}` : ''}
${specificFocus ? `Spezifischer Fokus: ${specificFocus}` : ''}

Erstelle eine schriftliche Frage zu diesem Thema, die alle GOBT-Regeln befolgt. Die Frage sollte:
- Direkt als Fragesatz beginnen
- Sachlich und präzise formuliert sein
- Im Verantwortungsbereich der Bundesregierung liegen
- Unter 1800 Zeichen bleiben
- Keine Einleitung oder Begründung enthalten`;

    // Make request to OpenAI API
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

    return NextResponse.json({
      success: true,
      question: {
        question: generatedQuestion,
        characterCount,
        isValid,
        validationIssues,
        suggestions
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Serverfehler bei der Fragengenerierung'
    }, { status: 500 });
  }
} 