'use server';

/**
 * @fileOverview AI tool to assist in creating short video scripts.
 *
 * - generateVideoScript - A function that handles the video script generation process.
 * - GenerateVideoScriptInput - The input type for the generateVideoScript function.
 * - GenerateVideoScriptOutput - The return type for the generateVideoScript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVideoScriptInputSchema = z.object({
  strengths: z.string().describe('The strengths of the speaker.'),
  weaknesses: z.string().describe('The weaknesses of the speaker.'),
  speakingStyle: z.string().describe('The speaking style of the speaker.'),
  populismLevel: z.string().describe('The level of populism to incorporate in the script.'),
  keyTopics: z.string().describe('The key topics to cover in the video script.'),
});
export type GenerateVideoScriptInput = z.infer<typeof GenerateVideoScriptInputSchema>;

const GenerateVideoScriptOutputSchema = z.object({
  script: z.string().describe('The generated short video script.'),
});
export type GenerateVideoScriptOutput = z.infer<typeof GenerateVideoScriptOutputSchema>;

export async function generateVideoScript(input: GenerateVideoScriptInput): Promise<GenerateVideoScriptOutput> {
  return generateVideoScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVideoScriptPrompt',
  input: {schema: GenerateVideoScriptInputSchema},
  output: {schema: GenerateVideoScriptOutputSchema},
  prompt: `You are an AI assistant specialized in creating short video scripts.

  Based on the following parameters, generate a compelling and engaging video script:

  Strengths: {{{strengths}}}
  Weaknesses: {{{weaknesses}}}
  Speaking Style: {{{speakingStyle}}}
  Populism Level: {{{populismLevel}}}
  Key Topics: {{{keyTopics}}}

  The script should be concise and suitable for a short video format.
  `,
});

const generateVideoScriptFlow = ai.defineFlow(
  {
    name: 'generateVideoScriptFlow',
    inputSchema: GenerateVideoScriptInputSchema,
    outputSchema: GenerateVideoScriptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
