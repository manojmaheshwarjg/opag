
'use client';

import { Button } from '@/components/ui/button';
import { Settings2, TestTube2, Play, Loader2, PanelRightClose, PanelRightOpen, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { toolkits } from '@/lib/toolkits';


type TestResult = {
    nodeId: string;
    nodeName: string;
    status: 'success' | 'error';
    output: any;
    duration: number;
    reasoning?: string;
}

export const RightPanel = ({ 
    nodes, 
    onNodeSelect,
    onRunWorkflow,
    isRunning,
    testResults,
    isCollapsed,
    onToggle
}: { 
    nodes: any[], 
    onNodeSelect: (node: any) => void,
    onRunWorkflow: () => void,
    isRunning: boolean,
    testResults: TestResult[],
    isCollapsed: boolean,
    onToggle: () => void
}) => {

    const handleNodeClick = (node: any) => {
        onNodeSelect(node);
    }

    const getResultForNode = (nodeId: string) => {
        return testResults.find(r => r.nodeId === nodeId);
    }

    const getToolkitIcon = (toolkitName: string) => {
        const toolkit = toolkits.find(t => t.name === toolkitName);
        return toolkit ? `https://logo.clearbit.com/${toolkit.domain}` : '';
    }

    return (
        <aside className={cn("border-l bg-muted/50 flex flex-col transition-all duration-300", isCollapsed ? "w-12" : "w-80")}>
            <div className={cn("flex-shrink-0 flex items-center", isCollapsed ? 'justify-center p-2' : 'justify-between p-4')}>
                 {!isCollapsed && <h2 className="text-sm font-semibold text-muted-foreground px-2">INSPECTOR</h2>}
                 <Button variant="ghost" size="icon" onClick={onToggle}>
                    {isCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
                </Button>
            </div>
            
            <Separator />

            {!isCollapsed && (
                <Tabs defaultValue="configure" className="flex-grow flex flex-col p-2 min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="configure">
                             <Settings2 className="h-4 w-4 mr-2" /> Configure
                        </TabsTrigger>
                        <TabsTrigger value="test">
                            <TestTube2 className="h-4 w-4 mr-2" /> Run
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="configure" className="flex-grow overflow-y-auto min-h-0 pt-2">
                         <Accordion type="multiple" className="w-full" defaultValue={nodes.map(n => n.id)}>
                            {nodes.map(node => {
                                const step = node.get('step');
                                if (!step) return null;
                                
                                const iconUrl = getToolkitIcon(step.toolkit);

                                return (
                                    <AccordionItem value={node.id} key={node.id} className="border-b-0">
                                        <AccordionTrigger 
                                            className="py-2 text-sm font-medium hover:no-underline rounded-md px-2 hover:bg-background"
                                            onClick={() => handleNodeClick(node)}
                                            onDoubleClick={() => handleNodeClick(node)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {iconUrl && <Image src={iconUrl} alt={step.toolkit} width={16} height={16} className="rounded-sm" />}
                                                <span className="truncate">{step.name}</span>
                                                <Badge variant="outline" className={cn("text-xs flex-shrink-0", step.type === 'trigger' ? 'text-blue-600 border-blue-200' : 'text-purple-600 border-purple-200')}>{step.type}</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pl-4 text-xs text-muted-foreground">
                                           <p className="text-center italic text-xs py-2">Double-click step to edit.</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                    </TabsContent>
                    <TabsContent value="test" className="flex-grow flex flex-col space-y-4 min-h-0">
                         <div className="p-2 space-y-4 h-full flex flex-col">
                            <Button onClick={onRunWorkflow} disabled={isRunning}>
                                {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                                {isRunning ? 'Running...' : 'Run'}
                            </Button>
                            <Separator />
                             <div className="flex-grow min-h-0">
                                <Label className="text-xs text-muted-foreground">OUTPUT</Label>
                                <ScrollArea className="h-full mt-2">
                                    {testResults.length === 0 ? (
                                        <div className="text-center text-sm text-muted-foreground pt-10">
                                            <p>Run the workflow to see the output.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 pr-4">
                                            {testResults.map(result => (
                                                <Card key={result.nodeId}>
                                                    <CardHeader className="p-3">
                                                         <div className="flex justify-between items-center">
                                                            <CardTitle className="text-sm">{result.nodeName}</CardTitle>
                                                            <Badge variant={result.status === 'success' ? 'default' : 'destructive'} className={cn("text-xs", result.status === 'success' ? 'bg-green-100 text-green-800' : '')}>{result.status}</Badge>
                                                        </div>
                                                         {result.reasoning && (
                                                            <div className="text-xs text-muted-foreground pt-2 flex gap-2 items-start">
                                                                <Sparkles className="h-3 w-3 mt-0.5 text-purple-500 flex-shrink-0" />
                                                                <p className="italic">"{result.reasoning}"</p>
                                                            </div>
                                                        )}
                                                    </CardHeader>
                                                    <CardContent className="p-3 pt-0">
                                                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                                                            {JSON.stringify(result.output, null, 2)}
                                                        </pre>
                                                        <p className="text-xs text-muted-foreground mt-1 text-right">{result.duration}ms</p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </aside>
    )
}

    