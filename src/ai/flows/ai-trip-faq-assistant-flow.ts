'use server';
/**
 * @fileOverview An AI-powered assistant for Al-Awajan Travel to answer questions about bus routes, booking policies, luggage allowances, and destination information in Arabic.
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
      "The AI-powered assistant's answer to the user's question in Arabic."
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
  prompt: `أنت مساعد ذكي لشركة العوجان للسياحة والسفر، وهي شركة حافلات تعمل بين الرياض والأردن وسوريا. هدفك هو تقديم إجابات سريعة ودقيقة ومفيدة لأسئلة المستخدمين باللغة العربية.

سيطرح المستخدمون أسئلة حول:
- مسارات الحافلات بين الرياض والأردن وسوريا.
- سياسات الحجز (مثل كيفية الحجز، الإلغاء، التغييرات).
- وزن الأمتعة المسموح به.
- معلومات عامة عن الوجهات (الرياض، الأردن، سوريا).

كن مفيداً ومختصراً ومهنياً. إذا لم تكن تعرف الإجابة، اعتذر بلباقة واذكر أنك لا تملك هذه المعلومة حالياً. يجب أن تكون جميع الإجابات باللغة العربية.

سؤال المستخدم: {{{question}}}`,
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
