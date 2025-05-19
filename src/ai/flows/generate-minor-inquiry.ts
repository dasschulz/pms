'use server';

/**
 * @fileOverview A minor inquiry generator AI agent.
 *
 * - generateMinorInquiry - A function that handles the minor inquiry generation process.
 * - GenerateMinorInquiryInput - The input type for the generateMinorInquiry function.
 * - GenerateMinorInquiryOutput - The return type for the generateMinorInquiry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMinorInquiryInputSchema = z.object({
  topic: z.string().describe('The topic of the minor inquiry.'),
  context: z.string().describe('Relevant context or background information.'),
  desiredOutcome: z.string().describe('The desired outcome or goal of the inquiry.'),
  targetAudience: z.string().describe('The intended audience for the inquiry (e.g., specific ministry, committee).'),
});
export type GenerateMinorInquiryInput = z.infer<typeof GenerateMinorInquiryInputSchema>;

const GenerateMinorInquiryOutputSchema = z.object({
  title: z.string().describe('A concise title for the minor inquiry.'),
  inquiryText: z.string().describe('The generated text of the minor inquiry.'),
});
export type GenerateMinorInquiryOutput = z.infer<typeof GenerateMinorInquiryOutputSchema>;

export async function generateMinorInquiry(input: GenerateMinorInquiryInput): Promise<GenerateMinorInquiryOutput> {
  return generateMinorInquiryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMinorInquiryPrompt',
  input: {schema: GenerateMinorInquiryInputSchema},
  output: {schema: GenerateMinorInquiryOutputSchema},
  prompt: `You are an AI assistant tasked with generating drafts for minor inquiries (Kleine Anfrage) for members of DIE LINKE party in the German Bundestag.\n\n  Based on the provided topic, context, desired outcome, and target audience, generate a draft for a minor inquiry. The inquiry should be clear, concise, and politically relevant.\n\n  Topic: {{{topic}}}\n  Context: {{{context}}}\n  Desired Outcome: {{{desiredOutcome}}}\n  Target Audience: {{{targetAudience}}}\n\n  Please provide both a title and the main text of the inquiry.
  Title:\n  Inquiry Text:`,
});

const generateMinorInquiryFlow = ai.defineFlow(
  {
    name: 'generateMinorInquiryFlow',
    inputSchema: GenerateMinorInquiryInputSchema,
    outputSchema: GenerateMinorInquiryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
