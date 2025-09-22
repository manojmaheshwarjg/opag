
'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Play, Trash2, ZoomIn, ZoomOut, Frame, Wand2, HelpCircle, BrainCircuit } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import 'jointjs/dist/joint.css';
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { handleSaveWorkflow, handleGetWorkflow, handleDeleteWorkflow, executeAction, runOrchestrator, getAiHelp } from "@/app/actions";
import { NodeLibrary } from "./_components/node-library";
import { RightPanel } from "./_components/right-panel";
import { WorkflowCanvas } from "./_components/workflow-canvas";
import { PropertiesPanel } from "./_components/properties-panel";
import { cn } from "@/lib/utils";
import { getAllComponents } from "@/lib/api";
import { auth } from "@/lib/auth";
import { toolkits } from "@/lib/toolkits";
import Image from 'next/image';

let CustomNode: any;

type Step = {
    id: string;
    name: string;
    description: string;
    parameters: string[];
    toolkit: string;
    type: 'action' | 'trigger';
};

type TestResult = {
    nodeId: string;
    nodeName: string;
    status: 'success' | 'error';
    output: any;
    duration: number;
    reasoning?: string;
    confidenceScore?: number;
}


export default function WorkflowEditorPage() {
    const router = useRouter();
    const params = useParams();
    const workflowId = params.id as string;

    const { toast } = useToast();
    const [workflowName, setWorkflowName] = useState("Untitled Workflow");
    const [workflowGoal, setWorkflowGoal] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [allComponents, setAllComponents] = useState<any[]>([]);

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    // Refs for JointJS objects managed by the canvas component
    const graphRef = useRef<any>(null);
    const paperRef = useRef<any>(null);
    
    const [selectedCell, setSelectedCell] = useState<any | null>(null);
    const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
    const [canvasNodes, setCanvasNodes] = useState<any[]>([]);
    const [initialGraphData, setInitialGraphData] = useState(null);

    const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
    const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
    const [memory, setMemory] = useState<Record<string, any>>({});
    const [isAnalyzingError, setIsAnalyzingError] = useState(false);
    const [lastError, setLastError] = useState<any>(null);


    const selectedNode = selectedCell?.isElement() ? selectedCell : null;
    
    useEffect(() => {
        const joint = (window as any).joint;
        if (joint && !CustomNode) {
            CustomNode = joint.dia.Element.define('opag.CustomNode', {
                attrs: {
                    body: {
                        refWidth: '100%',
                        refHeight: '100%',
                        rx: 8,
                        ry: 8,
                        strokeWidth: 1,
                        fill: 'hsl(var(--card))',
                        stroke: 'hsl(var(--border))',
                    },
                    icon: {
                        'xlink:href': '',
                        width: 20,
                        height: 20,
                        x: 12,
                        y: 12,
                    },
                    label: {
                        x: 40,
                        y: 15,
                        text: '',
                        fontSize: 14,
                        fontWeight: 'bold',
                        fill: 'hsl(var(--card-foreground))',
                        fontFamily: 'var(--font-sans)',
                    },
                    description: {
                        x: 40,
                        y: 38,
                        text: '',
                        fontSize: 12,
                        fill: 'hsl(var(--muted-foreground))',
                         fontFamily: 'var(--font-sans)',
                    },
                },
                 ports: {
                    groups: {
                        'in': {
                            position: 'left',
                            attrs: { portBody: { magnet: true, r: 5, fill: 'hsl(var(--background))', stroke: 'hsl(var(--muted-foreground))', 'stroke-width': 1.5 } },
                            markup: '<circle r="5" class="port-body"/>'
                        },
                        'out': {
                            position: 'right',
                            attrs: { portBody: { magnet: true, r: 5, fill: 'hsl(var(--background))', stroke: 'hsl(var(--muted-foreground))', 'stroke-width': 1.5 } },
                            markup: '<circle r="5" class="port-body"/>'
                        }
                    },
                }
            }, {
                 markup: [{
                    tagName: 'rect',
                    selector: 'body',
                }, {
                    tagName: 'image',
                    selector: 'icon'
                }, {
                    tagName: 'text',
                    selector: 'label'
                }, {
                    tagName: 'text',
                    selector: 'description'
                }]
            });
        }


        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const components = await getAllComponents();
                    setAllComponents(components);

                    if (workflowId !== 'new') {
                        const workflowData = await handleGetWorkflow(workflowId);
                        if (workflowData) {
                            setWorkflowName(workflowData.name);
                            setWorkflowGoal(workflowData.goal || '');
                            if (workflowData.graph) {
                                setInitialGraphData(workflowData.graph);
                            }
                        } else {
                            toast({ variant: 'destructive', title: 'Workflow not found'});
                            router.push('/dashboard/workflows');
                        }
                    } else {
                        setInitialGraphData({ cells: [] });
                    }
                } catch (error) {
                    console.error("Error loading workflow editor data:", error);
                    toast({ variant: 'destructive', title: 'Failed to load editor data' });
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [workflowId, router, toast]);

    const addStepToCanvas = useCallback((step: Step, position?: {x: number, y: number}) => {
        const paper = paperRef.current;
        const graph = graphRef.current;
        const joint = (window as any).joint; 

        if (!paper || !graph || !joint || !CustomNode) {
            console.error("JointJS objects not available");
            return;
        }

        const existingTrigger = graph.getElements().find((el: any) => el.get('step')?.type === 'trigger');
        if (step.type === 'trigger' && existingTrigger) {
            toast({
                variant: 'destructive',
                title: 'Reaction Already Exists',
                description: 'A workflow can only have one reaction (trigger) step.',
            });
            return;
        }
        
        const isTrigger = step.type === 'trigger';
        const toolkit = toolkits.find(t => t.name === step.toolkit);
        const iconUrl = toolkit ? `https://logo.clearbit.com/${toolkit.domain}` : '';
        
        const node = new CustomNode({
            position: position ? { x: position.x - 125, y: position.y - 35 } : { x: 100, y: 100 },
            size: { width: 250, height: 70 },
            attrs: {
                icon: { 'xlink:href': iconUrl },
                label: { text: step.name },
                description: { text: step.toolkit }
            }
        });
        
        const portItems = isTrigger ? [{ group: 'out', id: `${node.id}-out` }] : [{ group: 'in', id: `${node.id}-in` }, { group: 'out', id: `${node.id}-out` }];
        node.addPorts(portItems);

        node.set('step', step);
        graph.addCell(node);
    }, [toast]);

    const onSaveWorkflow = useCallback(async () => {
        if (!workflowName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Workflow name is required',
                description: 'Please enter a name for your workflow before saving.',
            });
            return;
        }

        if (graphRef.current) {
            setIsSaving(true);
            const jsonGraph = graphRef.current.toJSON();
            const stepCount = graphRef.current.getElements().length;

            const result = await handleSaveWorkflow({
                id: workflowId,
                name: workflowName,
                goal: workflowGoal,
                graph: jsonGraph,
                status: 'Active',
                stepCount: stepCount,
            });
            setIsSaving(false);

            if (result.success && result.id) {
                toast({
                    title: 'Workflow Saved!',
                    description: `The workflow "${workflowName}" has been saved.`,
                });
                if (workflowId === 'new') {
                    router.replace(`/editor/${result.id}`);
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Save Failed',
                    description: result.error,
                });
            }
        }
    }, [workflowId, workflowName, workflowGoal, router, toast]);
    
    const handleDeleteWorkflow = useCallback(async () => {
        if (workflowId !== 'new') {
            const result = await handleDeleteWorkflow({ id: workflowId });
            if (result.success) {
                toast({
                    title: 'Workflow Deleted',
                    description: 'The workflow has been permanently deleted.'
                });
                router.push('/dashboard/workflows');
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Deletion Failed',
                    description: result.error
                });
            }
        }
        setIsDeleteAlertOpen(false);
    }, [workflowId, router, toast]);

    const handleDeleteNode = (nodeId: string) => {
        const graph = graphRef.current;
        const cell = graph?.getCell(nodeId);
        if(cell) {
            cell.remove();
        }
        setSelectedCell(null);
    }
    
    const handleCellSelect = useCallback((cell: any | null) => {
        setSelectedCell(cell);
    }, []);
    
    const handleDoubleClick = (cellView: any) => {
        if (cellView.model.isElement()) {
            setSelectedCell(cellView.model);
            setIsPropertiesPanelOpen(true);
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedCell) {
                 e.preventDefault();
                 if (selectedCell.isLink()) {
                    selectedCell.remove();
                 } else {
                    handleDeleteNode(selectedCell.id);
                 }
                 setSelectedCell(null);
            }
             if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSaveWorkflow();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell, onSaveWorkflow]);


    const handleRunWorkflow = async () => {
        const graph = graphRef.current;
        if (!graph) return;

        setIsRunning(true);
        setTestResults([]);
        setLastError(null);

        const triggerNode = graph.getElements().find((el: any) => el.get('step')?.type === 'trigger');
        if (!triggerNode) {
            toast({ variant: 'destructive', title: 'No Trigger Found', description: 'A workflow must have a trigger step to run.' });
            setIsRunning(false);
            return;
        }

        let localMemory = {};
        setMemory({});
        const executionHistory: any[] = [];
        let lastStepOutput: any = { message: "Workflow started" };
        let lastStepError: string | undefined = undefined;
        let isFinished = false;
        let orchestratorResult;

        while (!isFinished) {
            try {
                orchestratorResult = await runOrchestrator({
                    goal: workflowGoal,
                    availableSkills: allComponents.filter(c => c.type === 'action'),
                    history: executionHistory,
                    lastStepOutput,
                    lastStepError,
                    memory: localMemory,
                    graph: graph.toJSON(),
                });

                isFinished = orchestratorResult.isFinished;
                localMemory = orchestratorResult.memory || {};
                setMemory(localMemory);
                lastStepError = undefined;

                if (orchestratorResult.nextSkill) {
                    const nextSkill = orchestratorResult.nextSkill;
                    const parameters = orchestratorResult.parameters || {};
                    const startTime = Date.now();

                    const component = allComponents.find(c => c.name === nextSkill);
                    if (!component) {
                        const errorMsg = `Orchestrator tried to run unknown skill: ${nextSkill}`;
                        lastStepOutput = { error: errorMsg };
                        lastStepError = errorMsg;
                        setTestResults(prev => [...prev, { nodeId: 'orchestrator_error', nodeName: 'Orchestrator Error', status: 'error', output: lastStepOutput, duration: 0, reasoning: orchestratorResult.reasoning, confidenceScore: orchestratorResult.confidenceScore }]);
                        setLastError(lastStepOutput);
                        break;
                    }

                    const executionResult = await executeAction({
                        actionName: nextSkill,
                        toolkitName: component.toolkit,
                        params: parameters
                    });
                    
                    const duration = Date.now() - startTime;

                    if (executionResult.error) {
                        lastStepOutput = null;
                        lastStepError = executionResult.error;
                        setTestResults(prev => [...prev, { nodeId: nextSkill, nodeName: nextSkill, status: 'error', output: { error: lastStepError }, duration, reasoning: orchestratorResult.reasoning, confidenceScore: orchestratorResult.confidenceScore }]);
                        setLastError({ error: lastStepError, skill: nextSkill });
                        // Let the orchestrator decide if it can recover
                    } else {
                        lastStepOutput = executionResult.result;
                        setTestResults(prev => [...prev, { nodeId: nextSkill, nodeName: nextSkill, status: 'success', output: lastStepOutput, duration, reasoning: orchestratorResult.reasoning, confidenceScore: orchestratorResult.confidenceScore }]);
                    }
                    
                    executionHistory.push({ skill: nextSkill, output: lastStepOutput, error: lastStepError });

                } else {
                    setTestResults(prev => [...prev, { nodeId: 'orchestrator_finish', nodeName: 'Orchestrator', status: 'success', output: { reasoning: orchestratorResult.reasoning }, duration: 0, reasoning: orchestratorResult.reasoning, confidenceScore: orchestratorResult.confidenceScore }]);
                    break;
                }
            } catch (e: any) {
                const errorMsg = `Orchestrator failed: ${e.message}`;
                lastStepOutput = null;
                lastStepError = errorMsg;
                setTestResults(prev => [...prev, { nodeId: 'orchestrator_crash', nodeName: 'Orchestrator Crash', status: 'error', output: { error: errorMsg }, duration: 0 }]);
                setLastError({ error: errorMsg, skill: 'Orchestrator' });
                isFinished = true; // Stop execution on orchestrator crash
            }
        }
        
        setIsRunning(false);
    }
    
    const handleZoom = (factor: number) => {
        const paper = paperRef.current;
        if (paper) {
            const newScale = paper.scale().sx * factor;
            paper.scale(newScale, newScale);
        }
    }

    const handleFitToScreen = () => {
        const paper = paperRef.current;
        if (paper) {
            paper.scaleContentToFit({ padding: 40 });
        }
    }

     const handleAiHelp = async () => {
        const result = await getAiHelp({
            currentPage: '/editor',
            query: `The user needs help with their workflow. Goal: "${workflowGoal}". Graph: ${JSON.stringify(graphRef.current?.toJSON())}`
        });

        if(result.success) {
            toast({
                title: "AI Suggestion",
                description: result.response,
            })
        } else {
            toast({ variant: 'destructive', title: "AI Help Failed" })
        }
    }

    const handleSuggestGoal = async () => {
        const result = await getAiHelp({
            currentPage: '/editor',
            query: 'Suggest three potential workflow goals for a new workflow. Format as a bulleted list.'
        });
        if (result.success) {
            toast({ title: "Goal Suggestions", description: result.response });
        }
    }

    const handleSuggestName = async () => {
        const result = await getAiHelp({
            currentPage: '/editor',
            query: `Suggest a short, descriptive name for a workflow with this goal: "${workflowGoal}"`
        });
        if (result.success && result.response) {
            setWorkflowName(result.response.replace(/["']/g, ""));
            toast({ title: "Name Suggested!", description: `Set name to "${result.response}"` });
        }
    }
    
    const handleAnalyzeError = async () => {
        if (!lastError) return;
        setIsAnalyzingError(true);
        const result = await getAiHelp({
            currentPage: '/editor',
            query: `Analyze this workflow execution error and suggest a fix. The goal was "${workflowGoal}". The error occurred in the skill "${lastError.skill}". The error was: ${lastError.error}. The full execution history is ${JSON.stringify(testResults)}.`
        });
        if (result.success) {
            toast({ title: "AI Error Analysis", description: result.response, duration: 10000 });
        } else {
            toast({ variant: 'destructive', title: "Analysis Failed" });
        }
        setIsAnalyzingError(false);
    }

    return (
        <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this workflow?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently delete the workflow "{workflowName}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWorkflow} variant="destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <PropertiesPanel
                open={isPropertiesPanelOpen}
                onOpenChange={setIsPropertiesPanelOpen}
                selectedNode={selectedNode}
                onDeleteNode={handleDeleteNode}
            />

            <header className="flex-shrink-0 border-b z-20 bg-background">
                <div className="flex items-center justify-between p-2 px-4">
                     <div className="flex items-center gap-2 flex-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/dashboard/workflows')}>
                           <ArrowLeft className="h-4 w-4" />
                        </Button>
                         <div className="flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Untitled Workflow"
                                className="text-lg font-medium border-0 shadow-none focus-visible:ring-0 h-auto p-1 max-w-sm"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                            />
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSuggestName}><Wand2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-md border p-1">
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleZoom(1.2)}><ZoomIn className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleZoom(0.8)}><ZoomOut className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFitToScreen}><Frame className="h-4 w-4" /></Button>
                        </div>
                         <Button variant="ghost" size="sm" onClick={handleAiHelp}><HelpCircle className="mr-2 h-4 w-4" /> AI Help</Button>
                        <Button variant="outline" size="sm" onClick={onSaveWorkflow} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                         {workflowId !== 'new' && (
                            <Button variant="destructiveOutline" size="icon" className="h-9 w-9" onClick={() => setIsDeleteAlertOpen(true)} disabled={isSaving}>
                               <Trash2 className="h-4 w-4"/>
                            </Button>
                        )}
                    </div>
                </div>
            </header>
            
            <main className="flex-grow flex min-h-0">
                <NodeLibrary 
                    onStepSelect={addStepToCanvas} 
                    isCollapsed={isLeftPanelCollapsed} 
                    onToggle={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                />
                <div className="flex-grow relative flex flex-col">
                    <div className="p-2 border-b flex items-center gap-2 flex-shrink-0">
                         <Input
                            placeholder="Describe the goal for your workflow... e.g., 'Summarize today's top news and send it to Slack'"
                            className="text-sm border-0 shadow-none focus-visible:ring-0 h-auto p-1 text-muted-foreground"
                            value={workflowGoal}
                            onChange={(e) => setWorkflowGoal(e.target.value)}
                        />
                        <Button variant="ghost" size="sm" onClick={handleSuggestGoal}><Wand2 className="mr-2 h-4 w-4" />Suggest</Button>
                    </div>
                    <div className="flex-grow relative">
                        {(isLoading || !initialGraphData) ? (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                           <WorkflowCanvas
                                initialGraphData={initialGraphData}
                                graphRef={graphRef}
                                paperRef={paperRef}
                                onSelectionChange={handleCellSelect}
                                onNodesChange={setCanvasNodes}
                                onDoubleClick={handleDoubleClick}
                                onDrop={addStepToCanvas}
                            />
                        )}
                    </div>
                </div>
                <RightPanel 
                    nodes={canvasNodes} 
                    onNodeSelect={handleCellSelect}
                    onRunWorkflow={handleRunWorkflow}
                    isRunning={isRunning}
                    testResults={testResults}
                    isCollapsed={isRightPanelCollapsed}
                    onToggle={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                />
            </main>
        </div>
    );

    
}

    