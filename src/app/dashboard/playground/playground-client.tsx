
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from "zod";
import { PlusCircle, Bot, User, Send, X, Trash2, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';


import type { Connection } from "@/lib/connections";
import { ComponentSchema as Component, getAllConnections, getAllComponents } from "@/lib/api";
import { invokeAgent } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { toolkits } from '@/lib/toolkits';


type Action = z.infer<typeof Component>;
type Message = {
    role: 'user' | 'assistant';
    content: string;
}

const ChatMessage = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
             {!isUser && (
                <div className="bg-primary/10 text-primary rounded-full p-2 flex-shrink-0">
                    <Bot className="h-5 w-5" />
                </div>
            )}
            <div className={`rounded-lg p-3 max-w-xl shadow-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
             {isUser && (
                <div className="bg-muted rounded-full p-2 flex-shrink-0">
                    <User className="h-5 w-5" />
                </div>
            )}
        </div>
    )
};


const AddToolDropdown = ({ tools, selectedTools, onToolToggle, disabled }: { tools: Action[], selectedTools: Action[], onToolToggle: (tool: Action) => void, disabled: boolean }) => {
    const [search, setSearch] = useState('');
    const filteredTools = tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Skill
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="start">
                <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search skills..."
                            className="pl-8 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="h-64">
                    <div className="p-2 space-y-1">
                        {filteredTools.map(tool => (
                            <div
                                key={tool.id}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                                onClick={() => onToolToggle(tool)}
                            >
                                <Checkbox
                                    id={`tool-${tool.id}`}
                                    checked={selectedTools.some(st => st.id === tool.id)}
                                    onCheckedChange={() => onToolToggle(tool)}
                                />
                                <Label htmlFor={`tool-${tool.id}`} className="cursor-pointer font-normal flex-grow">{tool.name}</Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export default function PlaygroundClient() {
    const { toast } = useToast();
    
    const [allActions, setAllActions] = useState<Action[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResponding, setIsResponding] = useState(false);

    const [selectedToolkit, setSelectedToolkit] = useState<string>('');
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    
    const [agentTools, setAgentTools] = useState<Action[]>([]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [conns, customComponents] = await Promise.all([
                getAllConnections(),
                getAllComponents()
            ]);

            setConnections(conns);

            // We can now show all skills from the library plus any custom ones.
            const libraryActions = toolkits.flatMap(t => 
                (t.actions || []).map(a => ({
                    id: `${t.name}-${a.name}`,
                    name: a.name,
                    description: a.description,
                    parameters: a.parameters || [],
                    toolkit: t.name,
                    type: 'action' as const
                }))
            );

            // Combine and remove duplicates, giving precedence to custom components
            const combinedActions = [...customComponents.filter(c => c.type === 'action'), ...libraryActions];
            const uniqueActions = Array.from(new Map(combinedActions.map(item => [item.id, item])).values());
            
            setAllActions(uniqueActions);

        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Failed to load playground",
                description: "Could not fetch necessary data from the database.",
            });
            console.error("Failed to fetch playground data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [toast]);

    useEffect(() => {
        // Find the viewport element within the ScrollArea
        const viewport = scrollAreaRef.current?.querySelector(':scope > div');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTo({
                    top: viewport.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [messages]);
    
    const availableToolkits = useMemo(() => {
        // Show all skillsets from the library
        return toolkits.map(t => t.name).sort();
    }, []);

    const availableConnections = useMemo(() => {
        if (!selectedToolkit) return [];
        return connections.filter(c => c.toolkitName === selectedToolkit);
    }, [selectedToolkit, connections]);
    
    const actionsForSelectedToolkit = useMemo(() => {
        if (!selectedToolkit) return [];
        return allActions.filter(a => a.toolkit === selectedToolkit);
    }, [selectedToolkit, allActions])

    const handleToolkitChange = (value: string) => {
        setSelectedToolkit(value);
        setSelectedConnection('');
        // By default, select all skills for the new skillset
        const defaultTools = allActions.filter(a => a.toolkit === value);
        setAgentTools(defaultTools);
    }

    const handleToolToggle = (tool: Action) => {
        setAgentTools(prev => {
            if (prev.some(t => t.id === tool.id)) {
                return prev.filter(t => t.id !== tool.id);
            } else {
                return [...prev, tool];
            }
        });
    }

    const handleClearChat = () => {
        setMessages([]);
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentInput.trim() || isResponding) return;

        const newUserMessage: Message = { role: 'user', content: currentInput };
        setMessages(prev => [...prev, newUserMessage]);
        setCurrentInput('');
        setIsResponding(true);

        const connectionForAgent = selectedConnection ? connections.find(c => c.id === selectedConnection) : undefined;
        
        if (agentTools.length > 0 && !connectionForAgent) {
             toast({
                variant: 'destructive',
                title: "Connection Required",
                description: `The selected skills require a connection to be configured.`,
            });
             setMessages(prev => prev.filter(m => m !== newUserMessage)); // Remove user message on failure
             setIsResponding(false);
             return;
        }

        const agentInput = {
            messages: [...messages, newUserMessage],
            tools: agentTools,
            connection: connectionForAgent,
        };

        const response = await invokeAgent(agentInput);
        
        setIsResponding(false);

        if (response.success && response.result) {
            setMessages(prev => [...prev, { role: 'assistant', content: response.result }]);
        } else {
            const errorMessage = response.error || "The agent ran into an issue. Please try again.";
             setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
             toast({
                variant: 'destructive',
                title: "Agent Error",
                description: errorMessage,
            });
        }
    }


    if (isLoading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] h-[calc(100vh-12rem)] gap-6">
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Agent Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow flex flex-col">
                        <div className="space-y-2">
                           <Label>1. Select Skillset</Label>
                           <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                           <Label>2. Select Auth</Label>
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex-grow flex flex-col border rounded-lg p-2 space-y-2 min-h-0">
                           <Label>3. Add Skills (0)</Label>
                            <div className="flex-grow flex items-center justify-center text-center text-sm text-muted-foreground">
                                <p>Loading skills...</p>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
                 <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Conversation</CardTitle>
                    </CardHeader>
                    <div className="flex-grow flex items-center justify-center">
                         <div className="text-center">
                            <div className="inline-block bg-primary/10 text-primary p-4 rounded-full">
                                <Bot className="h-10 w-10" />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-foreground">Agent Playground</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Loading configurations...</p>
                        </div>
                    </div>
                     <div className="p-4 border-t">
                        <div className="relative">
                            <Textarea
                                placeholder="Ask your agent to do something..."
                                className="pr-20 min-h-[60px]"
                                disabled
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                <Button type="submit" size="icon" disabled>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                 </Card>
             </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] h-[calc(100vh-12rem)] gap-6">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Agent Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col">
                     <div className="space-y-2">
                        <Label>1. Select Skillset</Label>
                        <Select onValueChange={handleToolkitChange} value={selectedToolkit}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a skillset" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableToolkits.map(toolkit => (
                                    <SelectItem key={toolkit} value={toolkit}>
                                       <div className="flex items-center gap-2">
                                            {toolkits.find(t => t.name === toolkit)?.domain && (
                                            <Image 
                                                    src={`https://logo.clearbit.com/${toolkits.find(t => t.name === toolkit)?.domain}`} 
                                                    alt={toolkit} 
                                                    width={16} 
                                                    height={16} 
                                                    className="rounded-sm"
                                                />
                                            )}
                                            <span>{toolkit}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>2. Select Auth</Label>
                        <Select onValueChange={setSelectedConnection} value={selectedConnection} disabled={!selectedToolkit}>
                            <SelectTrigger>
                                <SelectValue placeholder={!selectedToolkit ? 'First, select a skillset' : (availableConnections.length > 0 ? "Select a connection" : `No connections for ${selectedToolkit}`)} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableConnections.map(conn => (
                                    <SelectItem key={conn.id} value={conn.id}>
                                        {conn.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-grow flex flex-col border rounded-lg p-2 space-y-2 min-h-0">
                        <div className="flex justify-between items-center px-2">
                            <Label>3. Skills ({agentTools.length})</Label>
                             <AddToolDropdown
                                tools={actionsForSelectedToolkit}
                                selectedTools={agentTools}
                                onToolToggle={handleToolToggle}
                                disabled={!selectedToolkit}
                            />
                        </div>
                        <ScrollArea className="flex-grow">
                           <div className="space-y-2 p-2">
                             {agentTools.length > 0 ? agentTools.map(tool => (
                                <div key={tool.id} className="flex items-center justify-between p-2 rounded-md border text-sm bg-muted/50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="flex-shrink-0">
                                            {toolkits.find(c => c.name === tool.toolkit)?.domain ? (
                                                <Image 
                                                    src={`https://logo.clearbit.com/${toolkits.find(c => c.name === tool.toolkit)?.domain}`} 
                                                    alt={tool.toolkit} 
                                                    width={20} 
                                                    height={20} 
                                                    className="rounded-sm"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 bg-muted rounded-sm" />
                                            )}
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-medium truncate">{tool.name}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 flex-shrink-0" onClick={() => handleToolToggle(tool)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                             )) : (
                                <div className="text-center text-xs text-muted-foreground py-4">
                                    <p>{selectedToolkit ? `No skills added for ${selectedToolkit}` : 'Select a skillset to add skills.'}</p>
                                </div>
                             )}
                           </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
                <CardHeader>
                    {messages.length > 0 ? (
                        <div className="flex justify-between items-center">
                            <CardTitle>Conversation</CardTitle>
                            <Button variant="ghost" size="sm" onClick={handleClearChat}>
                                <X className="h-4 w-4 mr-2" /> Clear Chat
                            </Button>
                        </div>
                    ) : (
                        <CardTitle>Conversation</CardTitle>
                    )}
                </CardHeader>
                <ScrollArea className="flex-grow p-6 pt-0" ref={scrollAreaRef}>
                    <div className="space-y-6 h-full">
                        {messages.length > 0 ? (
                            messages.map((msg, index) => <ChatMessage key={index} message={msg} />)
                        ) : (
                            <div className="h-full flex items-center justify-center">
                               <div className="text-center">
                                    <div className="inline-block bg-primary/10 text-primary p-4 rounded-full">
                                        <Bot className="h-10 w-10" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-medium text-foreground">Agent Playground</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">Configure your agent and start a conversation.</p>
                               </div>
                            </div>
                        )}
                        {isResponding && (
                             <div className="flex items-start gap-3">
                                <div className="bg-primary/10 text-primary rounded-full p-2 flex-shrink-0">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="rounded-lg p-3 max-w-lg bg-muted flex items-center space-x-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-sm">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <form onSubmit={handleSubmit} className="relative">
                        <Textarea
                            placeholder="Ask your agent to do something, e.g., 'Create a GitHub issue for me.'"
                            className="pr-20 min-h-[60px]"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                         <div className="absolute top-1/2 -translate-y-1/2 right-3">
                            <Button type="submit" size="icon" disabled={!currentInput.trim() || isResponding}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

        </div>
    );
}
