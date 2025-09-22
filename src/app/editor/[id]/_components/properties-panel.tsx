
'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export const PropertiesPanel = ({ 
    open, 
    onOpenChange, 
    selectedNode,
    onDeleteNode 
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    selectedNode: any | null,
    onDeleteNode: (nodeId: string) => void
}) => {
    const [paramValues, setParamValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (selectedNode?.get) {
            setParamValues(selectedNode.get('configValues') || {});
        }
    }, [selectedNode]);

    if (!selectedNode || !selectedNode.get) return null;

    const step = selectedNode.get('step');
    const parameters = step.parameters || [];

    const handleParamChange = (paramName: string, value: string) => {
        const newValues = { ...paramValues, [paramName]: value };
        setParamValues(newValues);
        selectedNode.set('configValues', newValues);
    }
    
    const handleDelete = () => {
        onDeleteNode(selectedNode.id);
        onOpenChange(false);
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Configure: {step.name}</SheetTitle>
                    <SheetDescription>{step.description}</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4 h-[calc(100vh-150px)] flex flex-col">
                    <div className="flex-grow space-y-4 overflow-y-auto pr-4">
                        <h3 className="font-medium text-sm text-muted-foreground">Parameters</h3>
                        {parameters.length > 0 ? parameters.map((param: string) => (
                            <div key={param} className="space-y-2">
                                <Label htmlFor={param}>{param}</Label>
                                <Input
                                    id={param}
                                    value={paramValues[param] || ''}
                                    onChange={(e) => handleParamChange(param, e.target.value)}
                                    placeholder={`Enter value for ${param}`}
                                />
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground">This {step.type} has no parameters to configure.</p>
                        )}
                    </div>
                    <div className="flex-shrink-0 pt-4 border-t">
                        <Button variant="destructiveOutline" size="sm" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete Step
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
