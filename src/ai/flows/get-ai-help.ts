
'use server';

/**
 * @fileOverview A Genkit flow for providing contextual AI help within the application.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAiHelpInputSchema = z.object({
  currentPage: z.string().describe('The path of the page the user is currently on (e.g., /dashboard/components).'),
  query: z.string().describe('The user\'s question or command.'),
});
export type GetAiHelpInput = z.infer<
  typeof GetAiHelpInputSchema
>;

const GetAiHelpOutputSchema = z.object({
  response: z.string().describe('The AI\'s helpful response.'),
});
export type GetAiHelpOutput = z.infer<
  typeof GetAiHelpOutputSchema
>;

export async function getAiHelp(
  input: GetAiHelpInput
): Promise<GetAiHelpOutput> {
  return getAiHelpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAiHelpPrompt',
  input: {schema: GetAiHelpInputSchema},
  output: {schema: GetAiHelpOutputSchema},
  prompt: `You are a helpful AI assistant integrated into a web application for building AI agents and workflows.

Your goal is to provide concise, helpful, and context-aware responses to user queries.

The user is currently on this page: {{{currentPage}}}
Their question is: {{{query}}}

Based on the user's location and query, provide a helpful response.
- If they ask for help or how to do something, provide clear, step-by-step instructions.
- If they ask what a page is for, give a brief explanation of its purpose.
- If they give a command like "go to components", suggest the correct navigation path.
- Keep your answers short and to the point.
- The user can create Components (Skills or Triggers), Connections (for auth), and Workflows.
- The Playground is where they can test agents with their created skills.
`,
});

const getAiHelpFlow = ai.defineFlow(
  {
    name: 'getAiHelpFlow',
    inputSchema: GetAiHelpInputSchema,
    outputSchema: GetAiHelpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    