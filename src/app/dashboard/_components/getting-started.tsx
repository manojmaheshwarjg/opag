
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, PlusCircle, PartyPopper } from 'lucide-react';
import { useRouter } from 'next/navigation';


const Step = ({ title, description, isComplete, onAction, actionText, isDisabled = false }: { title: string, description: string, isComplete: boolean, onAction: () => void, actionText: string, isDisabled?: boolean }) => {
    return (
        <div className="flex items-start gap-4">
            <div>
                {isComplete ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                )}
            </div>
            <div className="flex-grow">
                <h3 className="font-semibold text-md">{title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{description}</p>
                 {!isComplete && (
                    <Button variant="secondary" size="sm" className="mt-3" onClick={onAction} disabled={isDisabled}>
                       <PlusCircle className="mr-2 h-4 w-4" /> {actionText}
                    </Button>
                )}
            </div>
        </div>
    )
}

export const GettingStarted = ({ hasComponents, hasConnections }: { hasComponents: boolean, hasConnections: boolean }) => {
    const router = useRouter();
    const allStepsComplete = hasComponents && hasConnections;

    if (allStepsComplete) {
        return (
            <Card className="bg-gradient-to-br from-purple-50 via-white to-green-50">
                <CardHeader>
                    <CardTitle>
                        <div className="flex items-center gap-2">
                           <PartyPopper className="h-6 w-6 text-purple-600" />
                            <span>You're all set!</span>
                        </div>
                    </CardTitle>
                    <CardDescription>You've created your first components and connections. Now you're ready to build agents and workflows in the Playground.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button onClick={() => router.push('/dashboard/playground')}>
                        Go to Playground
                    </Button>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Follow these steps to build and test your first agent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Step 
                    title="1. Create a Skill"
                    description="Components are the building blocks of your agent, defining the skills it can perform (e.g., 'create_github_issue')."
                    isComplete={hasComponents}
                    onAction={() => router.push('/dashboard/new-component')}
                    actionText="Create Skill"
                />
                 <Step 
                    title="2. Create a Connection"
                    description="Securely store authentication credentials (like API keys) for the skillsets your components use."
                    isComplete={hasConnections}
                    onAction={() => router.push('/dashboard/connections')}
                    actionText="New Connection"
                    isDisabled={!hasComponents}
                />
                 <Step 
                    title="3. Test in the Playground"
                    description="Combine your skills and connections in the Playground to chat with your agent and test its abilities."
                    isComplete={allStepsComplete}
                    onAction={() => router.push('/dashboard/playground')}
                    actionText="Go to Playground"
                    isDisabled={!hasComponents || !hasConnections}
                />
            </CardContent>
        </Card>
    );
}

    