
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting action descriptions based on input parameters.
 *
 * - suggestActionDescription - A function that takes action parameters as input and returns a suggested description.
 * - SuggestActionDescriptionInput - The input type for the suggestActionDescription function.
 * - SuggestActionDescriptionOutput - The return type for the suggestActionDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestActionDescriptionInputSchema = z.object({
  actionName: z.string().describe('The name of the action.'),
  parameters: z
    .array(z.string())
    .describe('A list of parameters for the action.'),
});
export type SuggestActionDescriptionInput = z.infer<
  typeof SuggestActionDescriptionInputSchema
>;

const SuggestActionDescriptionOutputSchema = z.object({
  description: z.string().describe('A suggested description for the action.'),
});
export type SuggestActionDescriptionOutput = z.infer<
  typeof SuggestActionDescriptionOutputSchema
>;

export async function suggestActionDescription(
  input: SuggestActionDescriptionInput
): Promise<SuggestActionDescriptionOutput> {
  return suggestActionDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestActionDescriptionPrompt',
  input: {schema: SuggestActionDescriptionInputSchema},
  output: {schema: SuggestActionDescriptionOutputSchema},
  prompt: `You are an expert at writing action descriptions.

  Based on the action name and parameters, suggest a comprehensive description for the action.

  Action Name: {{{actionName}}}
  Parameters: {{#each parameters}}{{{this}}}, {{/each}}

  Description:`,
});

const suggestActionDescriptionFlow = ai.defineFlow(
  {
    name: 'suggestActionDescriptionFlow',
    inputSchema: SuggestActionDescriptionInputSchema,
    outputSchema: SuggestActionDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
