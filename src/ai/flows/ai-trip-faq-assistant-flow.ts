'use server';
/**
 * @fileOverview An AI-powered assistant for Al-Awajan Travel to answer questions about bus routes, booking policies, luggage allowances, and destination information.
 *
 * - aiTripFAQAssistant - A function that handles natural language questions about travel.
 * - AITripFAQAssistantInput - The input type for the aiTripFAQAssistant function.
 * - AITripFAQAssistantOutput - The return type for the aiTripFAQAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AITripFAQAssistantInputSchema = z.object({
  question: z
    .string()
    .describe(
      "The user's natural language question about bus travel, routes, policies, or destinations for Al-Awajan Travel."
    ),
});
export type AITripFAQAssistantInput = z.infer<
  typeof AITripFAQAssistantInputSchema
>;

const AITripFAQAssistantOutputSchema = z.object({
  answer: z
    .string()
    .describe(
      "The AI-powered assistant's answer to the user's question."
    ),
});
export type AITripFAQAssistantOutput = z.infer<
  typeof AITripFAQAssistantOutputSchema
>;

export async function aiTripFAQAssistant(
  input: AITripFAQAssistantInput
): Promise<AITripFAQAssistantOutput> {
  return aiTripFAQAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTripFAQAssistantPrompt',
  input: {schema: AITripFAQAssistantInputSchema},
  output: {schema: AITripFAQAssistantOutputSchema},
  prompt: `You are an AI-powered assistant for Al-Awajan Travel, a bus booking service operating routes between Riyadh, Jordan, and Syria. Your goal is to provide quick, accurate, and relevant answers to user questions.

Users will ask natural language questions about:
- Bus routes between Riyadh, Jordan, and Syria.
- Booking policies (e.g., how to book, cancellation, changes).
- Luggage allowances.
- General destination information for Riyadh, Jordan, and Syria.

Be helpful, concise, and professional. If you don't know the answer, politely state that you cannot provide the information.

User Question: {{{question}}}`,
});

const aiTripFAQAssistantFlow = ai.defineFlow(
  {
    name: 'aiTripFAQAssistantFlow',
    inputSchema: AITripFAQAssistantInputSchema,
    outputSchema: AITripFAQAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
