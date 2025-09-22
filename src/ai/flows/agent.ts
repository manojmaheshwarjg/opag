
'use server';
/**
 * @fileOverview An agent that can use tools to answer questions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executeAction } from '@/app/actions';
import { ComponentSchema } from '@/lib/api';

const AgentMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ConnectionSchema = z.object({
  id: z.string(),
  apiKey: z.string(),
});

const AgentInputSchema = z.object({
  messages: z.array(AgentMessageSchema),
  tools: z.array(ComponentSchema),
  connection: ConnectionSchema.optional(),
});
export type AgentInput = z.infer<typeof AgentInputSchema>;

const AgentOutputSchema = z.string();
export type AgentOutput = z.infer<typeof AgentOutputSchema>;

const invokeAgentFlow = ai.defineFlow(
  {
    name: 'invokeAgentFlow',
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async (input) => {
    const { messages, tools, connection } = input;

    // If there are no tools, just act as a simple chatbot.
    if (tools.length === 0) {
      const llmResponse = await ai.generate({
        prompt: `You are a helpful assistant. The user has not provided you with any tools. Please respond to their last message.`,
        history: messages,
      });
      return llmResponse.text;
    }

    // Dynamically define Genkit tools from the provided components.
    const genkitTools = await Promise.all(
        tools.map(async (tool) => {
            const parameterSchema = z.object(
                tool.parameters.reduce((acc, param) => {
                    acc[param] = z.string();
                    return acc;
                }, {} as Record<string, z.ZodString>)
            );

            return ai.defineTool(
              {
                name: tool.name,
                description: tool.description,
                inputSchema: parameterSchema,
                outputSchema: z.any(),
              },
              async (params) => {
                console.log(`Agent executing tool: ${tool.name}`, params);
                try {
                    const result = await executeAction({
                        actionName: tool.name,
                        toolkitName: tool.toolkit,
                        params: params,
                        connectionId: connection?.id
                    });
                    
                    if (result.error) {
                        return { error: result.error };
                    }
                    return result.result;
                } catch(e: any) {
                    return { error: e.message };
                }
              }
            );
        })
    );


    const llmResponse = await ai.generate({
      prompt: `You are a helpful assistant. Please respond to the user's request. You have access to the following tools. Use them if required.`,
      history: messages,
      tools: genkitTools,
      config: {
        // Lower temperature for more predictable tool usage.
        temperature: 0.1,
      },
    });

    return llmResponse.text;
  }
);


// This is the only exported function, which is an async function.
export async function invokeAgent(input: AgentInput): Promise<AgentOutput> {
    return invokeAgentFlow(input);
}
