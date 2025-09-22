
'use server';

import { suggestActionDescription } from '@/ai/flows/suggest-action-description';
import { invokeAgent as invokeAgentFlow } from '@/ai/flows/agent';
import { orchestrateWorkflow } from '@/ai/flows/workflow-orchestrator';
import { getAiHelp as getAiHelpFlow } from '@/ai/flows/get-ai-help';
import { z } from 'zod';
import { toolkits } from '@/lib/toolkits';
import { 
    createComponent, 
    updateComponent,
    deleteComponentById,
    updateConnection,
    createConnection,
    deleteConnectionById,
    getConnectionById,
    updateWorkflow,
    createWorkflow,
    getWorkflowById,
    deleteWorkflowById,
    ComponentSchema, 
    WorkflowSchema 
} from '@/lib/api';
import type { Connection } from '@/lib/connections';
import { ConnectionSchema } from '@/lib/api';
import type { AgentInput } from '@/ai/flows/agent';
import type { OrchestratorInput, OrchestratorOutput } from '@/ai/flows/workflow-orchestrator';
import type { GetAiHelpInput } from '@/ai/flows/get-ai-help';


const ComponentFormSchema = z.object({
    id: z.string().optional(), // Add ID for editing
    componentName: z.string().min(1, "Component name is required.").refine(val => /^[a-z_]+$/.test(val), {
        message: "Name must be in snake_case (e.g., my_component_name).",
    }),
    parameters: z.string().optional(),
    description: z.string().min(1, "Description is required."),
    toolkit: z.string().min(1, "Skillset is required."),
    type: z.enum(["action", "trigger"]),
    isEditMode: z.boolean().optional(),
    originalComponentName: z.string().optional(),
});

export async function handleSuggestDescription(actionName: string, parameters: string) {
  try {
    const paramsArray = parameters.split(',').map(p => p.trim()).filter(p => p);
    const result = await suggestActionDescription({ actionName, parameters: paramsArray });
    return { description: result.description };
  } catch (error) {
    console.error('Error suggesting description:', error);
    return { error: 'Failed to generate a suggestion. Please try again.' };
  }
}

function getServiceCallExample(toolkit: string, componentName: string, paramsArray: string[]): string {
    const toolkitLower = toolkit.toLowerCase();
    
    switch (toolkit) {
        case 'GitHub':
            if (componentName === 'create_issue') {
                return `
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
    return { success: true, data: result };`;
            }
            break;
        case 'Slack':
             if (componentName === 'send_message') {
                return `
    const result = await slackService.sendMessage({
        apiKey: input.apiKey,
        channel: input.channel,
        text: input.text,
    });
    return { success: true, data: result };`;
            }
            break;
        case 'Airtable':
             if (componentName === 'create_record') {
                return `
    // The 'fields' parameter should be a JSON string.
    let fields;
    try {
        fields = JSON.parse(input.fields);
    } catch (e) {
        return { success: false, message: "Invalid 'fields' format. Expected a JSON string." };
    }

    const result = await airtableService.createRecord({
        apiKey: input.apiKey,
        baseId: input.baseId,
        tableName: input.tableName,
        fields,
    });
    return { success: true, data: result };`;
            }
            break;
    }

    // Default placeholder for other actions/toolkits
    const serviceCallParams = ['apiKey: input.apiKey', ...paramsArray.map(p => `${p}: input.${p}`)].join(',\n      ');
    return `
    // This is a placeholder implementation.
    // You will need to implement the corresponding service in src/services/${toolkitLower}.ts
    // and then call it from here.
    /*
    const result = await ${toolkitLower}Service.${componentName}({
      ${serviceCallParams}
    });
    return { success: true, data: result };
    */
    
    console.log('Executing ${componentName} with input:', input);

    // This is a placeholder response.
    return {
      success: true,
      message: '${componentName} executed successfully.',
      data: input,
    };`;
}


function generateFlowContent(values: z.infer<typeof ComponentFormSchema>): string {
    const { componentName, parameters, description, type, toolkit } = values;
    const paramsArray = parameters ? parameters.split(',').map(p => p.trim()).filter(p => p) : [];

    const inputSchemaFields = paramsArray.map(p => `  ${p}: z.any().optional().describe('The ${p} for the action.'),`).join('\n');
    const actionInputSchema = `const ${componentName}InputSchema = z.object({\n  apiKey: z.string().describe('The API key for authentication.'),\n${inputSchemaFields}\n});`;

    const actionOutputSchema = `const ${componentName}OutputSchema = z.object({\n  success: z.boolean(),\n  message: z.string().optional(),\n  data: z.any().optional(),\n});`;

    const triggerOutputSchema = `const ${componentName}OutputSchema = z.object({\n  // Define the output fields that the trigger will provide to the workflow.\n});`;

    const serviceImport = `import * as ${toolkit.toLowerCase()}Service from '@/services/${toolkit.toLowerCase()}';`;

    const flowImplementation = getServiceCallExample(toolkit, componentName, paramsArray);

    const fullFlowImplementation = type === 'action' ? `
  try {
    ${flowImplementation}
  } catch (error: any) {
    return {
      success: false,
      message: \`Failed to execute ${componentName}: \${error.message}\`,
    };
  }` : `
    // This is a placeholder implementation for a trigger.
    console.log('Reaction ${componentName} fired.');
    // In a real scenario, this flow would be invoked by an external event source.
    return {};
    `;


    const flowContent = `'use server';

/**
 * @fileOverview A flow for the ${componentName} ${type}.
 * 
 * @description ${description}
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
${type === 'action' ? serviceImport : ''}

${type === 'action' ? actionInputSchema : `// No input schema needed for this reaction.`}
export type ${componentName}Input = ${type === 'action' ? `z.infer<typeof ${componentName}InputSchema>` : `{}`};

${type === 'action' ? actionOutputSchema : triggerOutputSchema}
export type ${componentName}Output = z.infer<typeof ${componentName}OutputSchema>;

export async function ${componentName}(input: ${componentName}Input): Promise<${componentName}Output> {
  return ${componentName}Flow(input);
}

const ${componentName}Flow = ai.defineFlow(
  {
    name: '${componentName}Flow',
    inputSchema: ${type === 'action' ? `${componentName}InputSchema` : 'z.object({})'},
    outputSchema: ${componentName}OutputSchema,
  },
  async (input) => {
    ${fullFlowImplementation}
  }
);
`;
    return flowContent;
}

export async function generateComponentFlow(values: z.infer<typeof ComponentFormSchema>) {
    const parsedValues = ComponentFormSchema.safeParse(values);
    if (!parsedValues.success) {
        return { error: 'Invalid data provided.' };
    }

    const { data } = parsedValues;
    const flowContent = generateFlowContent(data);
    const filePath = `src/app/flows/${data.componentName}.ts`;

    const isRename = data.isEditMode && data.originalComponentName && data.componentName !== data.originalComponentName;
    const oldFilePath = isRename ? `src/app/flows/${data.originalComponentName}.ts` : null;

    const componentData: z.infer<typeof ComponentSchema> = {
        id: data.id || `${data.toolkit}-${data.componentName}`,
        name: data.componentName,
        description: data.description,
        parameters: data.parameters ? data.parameters.split(',').map(p => p.trim()).filter(p => p) : [],
        toolkit: data.toolkit,
        type: data.type,
    };

    try {
        if (data.isEditMode) {
            await updateComponent(componentData);
        } else {
            await createComponent(componentData);
        }
    } catch (error) {
        console.error("Firestore operation failed:", error);
        return { error: 'Failed to save the component to the database.' };
    }

    return { 
        success: `Flow file for "${data.componentName}" will be created/updated.`,
        filePath,
        fileContent: flowContent,
        oldFilePathToDelete: oldFilePath,
    };
}


const DeleteComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export async function deleteComponent(values: z.infer<typeof DeleteComponentSchema>) {
  const parsedValues = DeleteComponentSchema.safeParse(values);
  if (!parsedValues.success) {
    return { error: 'Invalid data provided for deletion.' };
  }

  const { id, name } = parsedValues.data;
  
  try {
    await deleteComponentById(id);
  } catch (error) {
    console.error("Firestore operation failed:", error);
    return { error: 'Failed to delete component from the database.' };
  }

  const filePathToDelete = `src/app/flows/${name}.ts`;

  return {
    success: `Component "${name}" will be deleted.`,
    filePathToDelete,
  };
}


export async function handleCreateOrUpdateConnection(newConnection: Connection, isEditMode: boolean) {
    const parsedConnection = ConnectionSchema.safeParse(newConnection);
    if (!parsedConnection.success) {
        return { error: 'Invalid connection data provided.' };
    }

    try {
        if (isEditMode) {
            await updateConnection(parsedConnection.data);
        } else {
            await createConnection(parsedConnection.data);
        }
    } catch (error) {
        console.error("Firestore operation failed:", error);
        return { error: 'Failed to save the connection to the database.' };
    }

    return {
        success: true,
    };
}


const DeleteConnectionSchema = z.object({
  id: z.string(),
});

export async function handleDeleteConnection(values: z.infer<typeof DeleteConnectionSchema>) {
    const parsedValues = DeleteConnectionSchema.safeParse(values);
    if (!parsedValues.success) {
        return { error: 'Invalid data provided for deletion.' };
    }

    try {
        await deleteConnectionById(parsedValues.data.id);
    } catch (error: any) {
        console.error("Firestore operation failed:", error);
        return { error: `Failed to delete the connection from the database: ${error.message}` };
    }


    return {
        success: true,
    };
}

const ExecuteActionSchema = z.object({
    actionName: z.string(),
    toolkitName: z.string(),
    params: z.record(z.any()),
    connectionId: z.string().optional(), // Connection ID to fetch API key
});

export async function executeAction(values: z.infer<typeof ExecuteActionSchema>) {
    const parsedValues = ExecuteActionSchema.safeParse(values);
    if (!parsedValues.success) {
        return { error: 'Invalid data provided for execution.' };
    }

    const { actionName, params, connectionId } = parsedValues.data;
    
    console.log(`Executing skill "${actionName}" with params:`, params);

    let apiKey = '';
    if (connectionId) {
        const connection = await getConnectionById(connectionId);
        if (connection?.apiKey) {
            apiKey = connection.apiKey;
        } else {
             // It's okay if there's no API key for some actions
             console.log(`API key not found for connection: ${connectionId}, proceeding without it.`);
        }
    }

    try {
        const flow = await import(`@/app/flows/${actionName}`);
        
        const fullParams = { ...params, apiKey };

        const result = await flow[actionName](fullParams);
        return { success: true, result };
    } catch (error: any) {
        console.error(`Error executing skill ${actionName}:`, error);
        const errorMessage = error.message || "An unknown error occurred during execution.";
        // Check if the error is due to module not found
        if (error.code === 'MODULE_NOT_FOUND') {
            return { error: `Failed to execute skill "${actionName}". The flow file might not exist or has an error.` };
        }
        return { error: `Failed to execute skill "${actionName}": ${errorMessage}` };
    }
}


export async function invokeAgent(input: AgentInput) {
    console.log("Invoking agent with input:", input);
    try {
        const result = await invokeAgentFlow(input);
        return { success: true, result };
    } catch (error: any) {
        console.error("Error invoking agent:", error);
        return { success: false, error: error.message || "An unknown error occurred while invoking the agent." };
    }
}

// Workflow Actions

const SaveWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().optional(),
  graph: z.any(),
  status: z.enum(['Active', 'Inactive']),
  stepCount: z.number(),
});


export async function handleSaveWorkflow(values: z.infer<typeof SaveWorkflowSchema>) {
    const parsedValues = SaveWorkflowSchema.safeParse(values);
    if (!parsedValues.success) {
        return { error: 'Invalid workflow data provided.' };
    }
    
    const { id, ...data } = parsedValues.data;

    try {
        if (id && id !== 'new') {
            await updateWorkflow(id, data);
            return { success: true, id };
        } else {
            const newId = await createWorkflow(data);
            return { success: true, id: newId };
        }
    } catch (error: any) {
        console.error('Error saving workflow:', error);
        return { error: `Failed to save workflow: ${error.message}` };
    }
}

export async function handleGetWorkflow(id: string) {
    try {
        const workflow = await getWorkflowById(id);
        if (workflow) {
            return workflow;
        }
        return null;
    } catch (error: any) {
        console.error('Error fetching workflow:', error);
        return null;
    }
}


const DeleteWorkflowSchema = z.object({
  id: z.string(),
});

export async function handleDeleteWorkflow(values: z.infer<typeof DeleteWorkflowSchema>) {
    const parsedValues = DeleteWorkflowSchema.safeParse(values);
    if (!parsedValues.success) {
        return { error: 'Invalid data provided for deletion.' };
    }

    try {
        await deleteWorkflowById(parsedValues.data.id);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting workflow:', error);
        return { error: `Failed to delete workflow: ${error.message}` };
    }
}

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorOutput> {
    return orchestrateWorkflow(input);
}


export async function getAiHelp(input: GetAiHelpInput) {
    try {
        const result = await getAiHelpFlow(input);
        return { success: true, response: result.response };
    } catch (error: any) {
        console.error("Error getting AI help:", error);
        return { success: false, error: error.message || "An unknown error occurred while getting help." };
    }
}
    

    