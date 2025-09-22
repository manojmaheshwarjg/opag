
'use server';

/**
 * @fileOverview A flow for the create_github_issue action.
 * 
 * @description Creates a new issue in a repository.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as githubService from '@/services/github';

const create_github_issueInputSchema = z.object({
  apiKey: z.string().describe('The API key for authentication.'),
  repo: z.string().describe('The repository to create the issue in (e.g., owner/repo).'),
  title: z.string().describe('The title of the issue.'),
  body: z.string().optional().describe('The body content of the issue.'),
});
export type create_github_issueInput = z.infer<typeof create_github_issueInputSchema>;

const create_github_issueOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});
export type create_github_issueOutput = z.infer<typeof create_github_issueOutputSchema>;

export async function create_github_issue(input: create_github_issueInput): Promise<create_github_issueOutput> {
  return create_github_issueFlow(input);
}

const create_github_issueFlow = ai.defineFlow(
  {
    name: 'create_github_issueFlow',
    inputSchema: create_github_issueInputSchema,
    outputSchema: create_github_issueOutputSchema,
  },
  async (input) => {
    
  try {
    
    const [owner, repo] = input.repo.split('/');
    if (!owner || !repo) {
        return { success: false, message: "Invalid 'repo' format. Expected 'owner/repo'." };
    }
    const result = await githubService.createIssue({
      apiKey: input.apiKey,
      owner,
      repo,
      title: input.title,
      body: input.body,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to execute create_github_issue: ${error.message}`,
    };
  }
  }
);
