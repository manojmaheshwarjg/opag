
'use client';

import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { toolkits } from "@/lib/toolkits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = {
    id: string;
    name: string;
    description: string;
    parameters: string[];
    toolkit: string;
    type: 'action' | 'trigger';
};

const generalSteps: Step[] = [
    { id: 'dest-email', name: 'Send Email', description: 'Send an email to a recipient.', parameters: ['to', 'subject', 'body'], toolkit: 'General', type: 'action' },
    { id: 'dest-api', name: 'API Response', description: 'Respond to the initial API call that triggered the workflow.', parameters: ['statusCode', 'body'], toolkit: 'General', type: 'action' },
    { id: 'dest-exit', name: 'Exit Workflow', description: 'End the workflow gracefully.', parameters: [], toolkit: 'General', type: 'action' },
];


export const NodeLibrary = ({ onStepSelect, isCollapsed, onToggle }: { onStepSelect: (step: Step) => void, isCollapsed: boolean, onToggle: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSelect = (step: Step) => {
        onStepSelect(step);
    }
    
    const filteredToolkits = toolkits.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.actions || []).some(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.triggers || []).some(tr => tr.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredGeneralSteps = generalSteps.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStep = (step: Step) => (
         <div 
            key={step.id} 
            className="p-2 rounded-md text-sm cursor-grab hover:bg-muted/80"
            onClick={() => handleSelect(step)}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(step));
                e.dataTransfer.effectAllowed = 'copy';
            }}
        >
            <p className="font-medium text-foreground">{step.name}</p>
        </div>
    );
    
    return (
        <aside className={cn("border-r bg-muted/50 flex flex-col transition-all duration-300", isCollapsed ? "w-12" : "w-64 p-4")}>
            <div className={cn("flex items-center", isCollapsed ? "justify-center p-2" : "justify-between")}>
                 {!isCollapsed && <h2 className="text-sm font-semibold text-muted-foreground px-2">STEP LIBRARY</h2>}
                 <Button variant="ghost" size="icon" onClick={onToggle}>
                    {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
            </div>
            {!isCollapsed && (
                <>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search..."
                            className="pl-10 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-grow overflow-y-auto -mx-4 px-2 mt-2">
                         <Accordion type="multiple" className="w-full" defaultValue={['General', ...toolkits.map(t => t.name)]}>
                            {filteredGeneralSteps.length > 0 && (
                                <AccordionItem value="General" className="border-b-0">
                                    <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">General</AccordionTrigger>
                                    <AccordionContent className="pl-4">
                                        {filteredGeneralSteps.map(renderStep)}
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            {filteredToolkits.map(toolkit => {
                                const actions = (toolkit.actions || []).filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || toolkit.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                const triggers = (toolkit.triggers || []).filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || toolkit.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                
                                if (actions.length === 0 && triggers.length === 0) return null;

                                return (
                                     <AccordionItem value={toolkit.name} key={toolkit.name} className="border-b-0">
                                        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                                            <div className="flex items-center gap-2">
                                                <span>{toolkit.name}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pl-4">
                                            {triggers.map(trigger => renderStep({
                                                ...trigger, 
                                                id: `${toolkit.name}-${trigger.name}`,
                                                type: 'trigger',
                                                toolkit: toolkit.name,
                                                parameters: trigger.parameters || []
                                            }))}
                                            {actions.map(action => renderStep({
                                                ...action, 
                                                id: `${toolkit.name}-${action.name}`,
                                                type: 'action',
                                                toolkit: toolkit.name,
                                                parameters: action.parameters || []
                                            }))}
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                    </div>
                </>
            )}
        </aside>
    )
}
