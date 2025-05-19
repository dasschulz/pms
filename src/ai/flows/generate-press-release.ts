'use server';
/**
 * @fileOverview A press release generator AI agent.
 *
 * - generatePressRelease - A function that handles the press release generation process.
 * - GeneratePressReleaseInput - The input type for the generatePressRelease function.
 * - GeneratePressReleaseOutput - The return type for the generatePressRelease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePressReleaseInputSchema = z.object({
  topic: z.string().describe('The main topic of the press release.'),
  tone: z.string().describe('The tone of the press release (e.g., formal, informal, urgent).'),
  style: z.string().describe('The writing style of the press release (e.g., persuasive, informative).'),
  politicalFocus: z.string().describe('The political focus or angle of the press release.'),
  targetAudience: z.string().describe('The intended audience for the press release.'),
  keyMessage: z.string().describe('The core message to convey in the press release.'),
  additionalContext: z.string().optional().describe('Any additional context or information to consider.'),
});
export type GeneratePressReleaseInput = z.infer<typeof GeneratePressReleaseInputSchema>;

const GeneratePressReleaseOutputSchema = z.object({
  title: z.string().describe('The title of the press release.'),
  content: z.string().describe('The generated content of the press release.'),
});
export type GeneratePressReleaseOutput = z.infer<typeof GeneratePressReleaseOutputSchema>;

export async function generatePressRelease(input: GeneratePressReleaseInput): Promise<GeneratePressReleaseOutput> {
  return generatePressReleaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePressReleasePrompt',
  input: {schema: GeneratePressReleaseInputSchema},
  output: {schema: GeneratePressReleaseOutputSchema},
  prompt: `You are a skilled communications specialist for DIE LINKE, adept at crafting impactful press releases.

  Based on the following parameters, generate a press release that is both informative and persuasive, tailored to the specified target audience.

  Topic: {{{topic}}}
Tone: {{{tone}}}
Style: {{{style}}}
Political Focus: {{{politicalFocus}}} Target Audience: {{{targetAudience}}} Key Message: {{{keyMessage}}} Additional Context: {{{additionalContext}}}

  Ensure the press release effectively communicates the key message while maintaining the appropriate tone, style, and political focus.  The press release should have a clear and engaging title.
  `,
});

const generatePressReleaseFlow = ai.defineFlow(
  {
    name: 'generatePressReleaseFlow',
    inputSchema: GeneratePressReleaseInputSchema,
    outputSchema: GeneratePressReleaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
