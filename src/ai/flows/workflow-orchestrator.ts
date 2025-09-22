
'use server';

/**
 * @fileOverview A Genkit flow for orchestrating workflow steps.
 * This flow decides the next step in a workflow based on the goal and previous step outputs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ComponentSchema } from '@/lib/api';

const OrchestratorInputSchema = z.object({
  goal: z.string().describe('The overall objective of the workflow.'),
  availableSkills: z.array(ComponentSchema).describe('The list of all available skills the workflow can use.'),
  history: z.array(z.object({
    skill: z.string().describe('The name of the skill that was executed.'),
    output: z.any().describe('The JSON output from the executed skill.'),
    error: z.string().optional().describe('Any error message that occurred during execution.'),
  })).describe('The history of skills executed so far in the workflow.'),
  lastStepOutput: z.any().optional().describe('The output of the most recently completed step.'),
  lastStepError: z.string().optional().describe('The error from the most recently completed step, if any.'),
  memory: z.record(z.any()).optional().describe('A key-value store for the workflow to remember information across steps.'),
  graph: z.any().optional().describe('A JSON representation of the workflow graph from JointJS.'),
});
export type OrchestratorInput = z.infer<typeof OrchestratorInputSchema>;

const OrchestratorOutputSchema = z.object({
  nextSkill: z.string().optional().describe('The name of the next skill to execute.'),
  parameters: z.record(z.any()).optional().describe('The parameters to pass to the next skill.'),
  reasoning: z.string().describe('The reasoning behind choosing the next skill or finishing.'),
  isFinished: z.boolean().describe('Whether the workflow should be considered complete.'),
  updatedGoal: z.string().optional().describe("If the AI determines the goal needs to be refined or updated for the next step, it should be provided here."),
  confidenceScore: z.number().min(0).max(1).describe("A score from 0 to 1 indicating the AI's confidence in its decision."),
  memory: z.record(z.any()).optional().describe('The complete, updated memory object for the next step.'),
});
export type OrchestratorOutput = z.infer<typeof OrchestratorOutputSchema>;

export async function orchestrateWorkflow(input: OrchestratorInput): Promise<OrchestratorOutput> {
  return workflowOrchestratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workflowOrchestratorPrompt',
  input: { schema: OrchestratorInputSchema },
  output: { schema: OrchestratorOutputSchema },
  prompt: `You are an expert workflow orchestrator. Your job is to intelligently decide the next step in a workflow to achieve a given goal.

Workflow Goal: {{{goal}}}
{{#if graph}}
Workflow Graph: Here is a JSON representation of the user-defined workflow graph. Use this as a strong hint for the intended sequence of operations, but you have the autonomy to deviate if necessary to achieve the goal.
{{{JSON.stringify graph}}}
{{/if}}

Available Skills:
{{#each availableSkills}}
- {{name}}: {{description}}
{{/each}}

Current Memory:
{{{JSON.stringify memory}}}

Execution History (skill, output, error):
{{#each history}}
- Ran {{skill}}, got: {{{JSON.stringify output}}}{{#if error}}, error: "{{error}}"{{/if}}
{{/each}}

The last step produced this output:
{{{JSON.stringify lastStepOutput}}}
{{#if lastStepError}}
The last step failed with this error: "{{lastStepError}}"
If the last step failed, analyze the error and decide if you can recover. You can try the same skill again with different parameters, try a different skill, or finish the workflow if the error is unrecoverable.
{{/if}}

Based on the goal, the provided graph, memory, and history, what is the next logical step?
- Analyze the user's goal. If it is too vague, refine it into a more concrete, actionable goal and set it in 'updatedGoal'.
- Your primary objective is to complete the 'Workflow Goal'. Use the 'Workflow Graph' as a guide for the user's intended path.
- If the goal is complete, set isFinished to true.
- If there is a logical next skill to run, specify it in 'nextSkill' and provide the necessary 'parameters'.
- If you cannot determine a next step or the goal is unachievable, set isFinished to true and explain why in 'reasoning'.
- Map outputs from previous steps and data from memory to the inputs of the next skill if appropriate.
- Update the 'memory' field with any new, relevant information that should be persisted for future steps. Return the complete, updated memory object.
- Provide a 'confidenceScore' between 0 and 1 for your decision.
`,
});


const workflowOrchestratorFlow = ai.defineFlow(
  {
    name: 'workflowOrchestratorFlow',
    inputSchema: OrchestratorInputSchema,
    outputSchema: OrchestratorOutputSchema,
  },
  async (input) => {
    // For complex logic, you could add pre-processing here.
    // For example, fetching additional context or filtering skills.
    
    const { output } = await prompt(input);
    return output!;
  }
);
