
export type Connection = {
    id: string;
    name: string;
    toolkitName: string;
    toolkitDomain: string;
    status: 'Connected' | 'Disconnected';
    authType: string;
    createdAt: string;
    apiKey?: string;
}

// The static array has been removed and will be managed in Firestore.
export const connections: Connection[] = [];

export const addConnection = (connection: Connection) => {
    // This function is no longer used and can be removed.
    // Data is now managed via connectionService and Firestore.
}
