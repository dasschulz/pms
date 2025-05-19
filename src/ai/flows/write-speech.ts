'use server';
/**
 * @fileOverview An AI agent for generating speech drafts.
 *
 * - writeSpeech - A function that generates speech drafts based on user-defined parameters.
 * - WriteSpeechInput - The input type for the writeSpeech function.
 * - WriteSpeechOutput - The return type for the writeSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WriteSpeechInputSchema = z.object({
  topic: z.string().describe('The main topic of the speech.'),
  tone: z.string().describe('The tone of the speech (e.g., formal, informal, persuasive).'),
  style: z.string().describe('The writing style of the speech (e.g., academic, journalistic).'),
  politicalFocus: z.string().describe('The political focus of the speech (e.g., economic policy, social justice).'),
  targetAudience: z.string().describe('The target audience of the speech.'),
  keyMessage: z.string().describe('The key message to convey in the speech.'),
});

export type WriteSpeechInput = z.infer<typeof WriteSpeechInputSchema>;

const WriteSpeechOutputSchema = z.object({
  speechDraft: z.string().describe('The generated speech draft.'),
});

export type WriteSpeechOutput = z.infer<typeof WriteSpeechOutputSchema>;

export async function writeSpeech(input: WriteSpeechInput): Promise<WriteSpeechOutput> {
  return writeSpeechFlow(input);
}

const prompt = ai.definePrompt({
  name: 'writeSpeechPrompt',
  input: {schema: WriteSpeechInputSchema},
  output: {schema: WriteSpeechOutputSchema},
  prompt: `You are an AI assistant specialized in writing speeches.

  Based on the following parameters, generate a speech draft:

  Topic: {{{topic}}}
  Tone: {{{tone}}}
  Style: {{{style}}}
  Political Focus: {{{politicalFocus}}}
  Target Audience: {{{targetAudience}}}
  Key Message: {{{keyMessage}}}

  Speech Draft:
  `,
});

const writeSpeechFlow = ai.defineFlow(
  {
    name: 'writeSpeechFlow',
    inputSchema: WriteSpeechInputSchema,
    outputSchema: WriteSpeechOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
