import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Placeholder for actual OpenAI API call
async function getOpenAIFeedback(systemPrompt: string, userPrompt: string): Promise<string> {
  console.log('Calling Mock OpenAI API for rede-feedback...');
  console.log('System Prompt:', systemPrompt);
  console.log('User Prompt:', userPrompt);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `**Mock Feedback (Rede):**\n\n*   Struktur: Klar und verständlich.\n*   Argumentation: Überzeugend dargelegt.\n*   Verbesserung: Mehr Beispiele könnten die Thesen untermauern.`;
}

function parsePrompts(markdownContent: string): { systemPrompt: string, userPromptTemplate: string } {
  const systemPromptDelimiter = '## System Prompt\n---\n';
  const userPromptDelimiter = '## User Prompt Structure\n---\n';
  const endDelimiter = '\n---';
  let systemPrompt = '';
  let userPromptTemplate = '';

  const systemStartIndex = markdownContent.indexOf(systemPromptDelimiter);
  if (systemStartIndex !== -1) {
    const systemEndIndex = markdownContent.indexOf(endDelimiter, systemStartIndex + systemPromptDelimiter.length);
    if (systemEndIndex !== -1) {
      systemPrompt = markdownContent.substring(systemStartIndex + systemPromptDelimiter.length, systemEndIndex).trim();
    }
  }

  const userStartIndex = markdownContent.indexOf(userPromptDelimiter);
  if (userStartIndex !== -1) {
    const userEndIndex = markdownContent.indexOf(endDelimiter, userStartIndex + userPromptDelimiter.length);
    if (userEndIndex !== -1) {
      userPromptTemplate = markdownContent.substring(userStartIndex + userPromptDelimiter.length, userEndIndex).trim();
    }
  }
  
  if (!systemPrompt || !userPromptTemplate) {
    console.warn('Could not parse system or user prompt from instructions file. Using defaults for rede-feedback.');
    return {
        systemPrompt: 'Du bist ein hilfreicher Assistent für Reden-Feedback.',
        userPromptTemplate: 'Gib Feedback zu diesem Redemanuskript: {{transcript}}'
    }
  }
  return { systemPrompt, userPromptTemplate };
}

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const promptsDir = path.join(process.cwd(), 'prompts');
    const promptFilePath = path.join(promptsDir, 'redefeedback-instructions.md');
    let systemPrompt: string;
    let userPromptTemplate: string;

    try {
      const markdownContent = fs.readFileSync(promptFilePath, 'utf-8');
      const parsed = parsePrompts(markdownContent);
      systemPrompt = parsed.systemPrompt;
      userPromptTemplate = parsed.userPromptTemplate;
    } catch (fileError) {
      console.error('Error reading or parsing prompt file for rede-feedback:', fileError);
      systemPrompt = 'Du bist ein erfahrener Analyst für politische Reden. Gib konstruktives Feedback.';
      userPromptTemplate = 'Redemanuskript:\n{{transcript}}';
    }
    
    const userPrompt = userPromptTemplate.replace('{{transcript}}', transcript);
    const feedback = await getOpenAIFeedback(systemPrompt, userPrompt);
    return NextResponse.json({ feedback });

  } catch (error) {
    console.error('Error in /api/ai/rede-feedback:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 