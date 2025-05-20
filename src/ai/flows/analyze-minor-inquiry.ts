'use server';

/**
 * @fileOverview An AI agent for analyzing responses to minor inquiries.
 *
 * - analyzeMinorInquiry - A function that handles the analysis process.
 * - AnalyzeMinorInquiryInput - The input type for the analyzeMinorInquiry function.
 * - AnalyzeMinorInquiryOutput - The return type for the analyzeMinorInquiry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMinorInquiryInputSchema = z.object({
  inquiryText: z.any().describe('The PDF file of the minor inquiry response from the government.'),
  responseText: z.string().describe('User-defined focus points for the analysis.'),
});
export type AnalyzeMinorInquiryInput = z.infer<typeof AnalyzeMinorInquiryInputSchema>;

const AnalyzeMinorInquiryOutputSchema = z.object({
  keyData: z.string().describe('Key data extracted from the response.'),
  potentialIssues: z.string().describe('Potential issues identified in the response.'),
  summary: z.string().describe('A concise summary of the response and its implications.'),
});
export type AnalyzeMinorInquiryOutput = z.infer<typeof AnalyzeMinorInquiryOutputSchema>;

export async function analyzeMinorInquiry(input: AnalyzeMinorInquiryInput): Promise<AnalyzeMinorInquiryOutput> {
  return analyzeMinorInquiryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMinorInquiryPrompt',
  input: {schema: AnalyzeMinorInquiryInputSchema},
  output: {schema: AnalyzeMinorInquiryOutputSchema},
  prompt: `You are an expert political analyst specializing in German politics.

You will analyze the response to a minor inquiry (Kleine Anfrage) and extract key data, identify potential issues, and provide a concise summary.

Inquiry: {{{inquiryText}}}
Response: {{{responseText}}}

Key Data:
{{field_description keyData}}

Potential Issues:
{{field_description potentialIssues}}

Summary:
{{field_description summary}}`,
});

const analyzeMinorInquiryFlow = ai.defineFlow(
  {
    name: 'analyzeMinorInquiryFlow',
    inputSchema: AnalyzeMinorInquiryInputSchema,
    outputSchema: AnalyzeMinorInquiryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
