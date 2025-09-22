
'use client';

import { executeAction } from "@/app/actions";

type ClientOptions = {
    apiKey: string;
};

export class Client {
    private apiKey: string;
    private toolkitHandlers: Record<string, any>;

    constructor(options: ClientOptions) {
        this.apiKey = options.apiKey;
        this.toolkitHandlers = {};

        // This is the core of the dynamic SDK.
        // We use a Proxy to intercept calls to skillsets that don't exist on the client yet.
        return new Proxy(this, {
            get: (target, prop: string) => {
                if (prop in target) {
                    return (target as any)[prop];
                }

                // If we've already created a handler for this skillset, return it.
                if (this.toolkitHandlers[prop]) {
                    return this.toolkitHandlers[prop];
                }

                // Create a new handler for the requested skillset (e.g., "github").
                // This handler is also a Proxy that intercepts skill calls (e.g., "create_issue").
                const toolkitHandler = new Proxy({}, {
                    get: (toolkitTarget, actionName: string) => {
                        // This is the function that gets called, e.g., client.github.create_issue(...)
                        // It now accepts an optional connectionId
                        return async (params: Record<string, any>, connectionId?: string) => {
                            console.log(`SDK: Calling skill "${actionName}" in skillset "${prop}" with params:`, params);
                            
                            // Here we call the server action to execute the real Genkit flow.
                            const result = await executeAction({
                                toolkitName: prop,
                                actionName,
                                params,
                                connectionId,
                            });
                            
                            if(result.error) {
                                throw new Error(result.error);
                            }

                            return result.result;
                        };
                    }
                });

                this.toolkitHandlers[prop] = toolkitHandler;
                return toolkitHandler;
            }
        });
    }
}

    