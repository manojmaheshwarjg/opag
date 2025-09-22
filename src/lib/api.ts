
import { z } from 'zod';
import { toolkits } from '@/lib/toolkits';
import { db, auth } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp, collectionGroup } from 'firebase/firestore';
import type { Connection } from '@/lib/connections';


// Schemas for API validation
export const ToolkitSchema = z.object({
  name: z.string(),
  domain: z.string(),
  auth: z.array(z.string()),
  actions: z.array(z.object({ name: z.string(), description: z.string(), parameters: z.array(z.string()).optional(), deprecated: z.boolean().optional() })).optional(),
  triggers: z.array(z.object({ name: z.string(), description: z.string(), parameters: z.array(z.string()).optional() })).optional(),
});

export const ConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  toolkitName: z.string(),
  toolkitDomain: z.string(),
  status: z.enum(['Connected', 'Disconnected']),
  authType: z.string(),
  createdAt: z.string(),
  apiKey: z.string().optional(), // Make API key optional
});

export const ComponentSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    parameters: z.array(z.string()),
    toolkit: z.string(),
    type: z.enum(['action', 'trigger']),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().optional(),
  graph: z.any(),
  status: z.enum(['Active', 'Inactive']),
  stepCount: z.number(),
  lastEdited: z.instanceof(Timestamp),
});


// --- Helper to get user-specific collection path ---
const getUserCollection = (collectionName: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");
    return collection(db, 'users', user.uid, collectionName);
};

const getUserDoc = (collectionName: string, docId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");
    return doc(db, 'users', user.uid, collectionName, docId);
};


// --- Toolkit Functions ---
export const getAllToolkits = async () => toolkits;
export const getToolkitByName = async (name: string) => toolkits.find(t => t.name === name);

// --- Connection Functions ---
export const getAllConnections = async (): Promise<Connection[]> => {
    const snapshot = await getDocs(getUserCollection('connections'));
    return snapshot.docs.map(doc => doc.data() as Connection);
};
export const getConnectionById = async (id: string): Promise<Connection | null> => {
    const snapshot = await getDoc(getUserDoc('connections', id));
    return snapshot.exists() ? snapshot.data() as Connection : null;
};
export const createConnection = async (newConnection: Connection) => {
    const docRef = getUserDoc('connections', newConnection.id);
    await setDoc(docRef, newConnection);
    return newConnection;
};
export const updateConnection = async (updatedConnection: Partial<Connection>) => {
    if (!updatedConnection.id) throw new Error("Connection ID is required for update.");
    const docRef = getUserDoc('connections', updatedConnection.id);
    await updateDoc(docRef, updatedConnection);
    return updatedConnection;
};
export const deleteConnectionById = async (id: string) => {
    await deleteDoc(getUserDoc('connections', id));
    return true;
};

// --- Component (Skill/Reaction) Functions ---
export const getAllComponents = async (): Promise<z.infer<typeof ComponentSchema>[]> => {
    const snapshot = await getDocs(getUserCollection('components'));
    return snapshot.docs.map(doc => doc.data() as z.infer<typeof ComponentSchema>);
};
export const createComponent = async (newComponent: z.infer<typeof ComponentSchema>) => {
    const docRef = getUserDoc('components', newComponent.id);
    await setDoc(docRef, newComponent);
    return newComponent;
};
export const updateComponent = async (updatedComponent: z.infer<typeof ComponentSchema>) => {
    const docRef = getUserDoc('components', updatedComponent.id);
    await updateDoc(docRef, updatedComponent);
    return updatedComponent;
};
export const deleteComponentById = async (id: string) => {
    await deleteDoc(getUserDoc('components', id));
    return true;
};

// --- Workflow Functions ---
export const getAllWorkflows = async (): Promise<z.infer<typeof WorkflowSchema>[]> => {
    const snapshot = await getDocs(getUserCollection('workflows'));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure lastEdited is a Timestamp, default to now if it's missing
      if (!data.lastEdited || !data.lastEdited.toDate) {
          data.lastEdited = Timestamp.now();
      }
      return data as z.infer<typeof WorkflowSchema>;
    });
};
export const getWorkflowById = async (id: string): Promise<z.infer<typeof WorkflowSchema> | null> => {
    if (id === 'new') return null;
    const snapshot = await getDoc(getUserDoc('workflows', id));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (!data.lastEdited || !data.lastEdited.toDate) {
          data.lastEdited = Timestamp.now();
    }
    return data as z.infer<typeof WorkflowSchema>;
};
export const createWorkflow = async (newWorkflow: Omit<z.infer<typeof WorkflowSchema>, 'lastEdited' | 'id'> & {id?: string} ) => {
    const workflowsCol = getUserCollection('workflows');
    const newDocRef = newWorkflow.id ? doc(workflowsCol, newWorkflow.id) : doc(workflowsCol);
    const id = newDocRef.id;

    const workflowData = {
      ...newWorkflow,
      id,
      lastEdited: serverTimestamp(),
    };
    await setDoc(newDocRef, workflowData);
    return id;
};
export const updateWorkflow = async (id: string, updatedWorkflow: Partial<Omit<z.infer<typeof WorkflowSchema>, 'id'>>) => {
    const docRef = getUserDoc('workflows', id);
    await updateDoc(docRef, {
        ...updatedWorkflow,
        lastEdited: serverTimestamp()
    });
    return true;
};
export const deleteWorkflowById = async (id: string) => {
    await deleteDoc(getUserDoc('workflows', id));
    return true;
};
