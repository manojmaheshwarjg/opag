
'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { WelcomeHeader } from './_components/welcome-header';
import { StatsCards } from './_components/stats-cards';
import { GettingStarted } from './_components/getting-started';
import { RecentActivity } from './_components/recent-activity';
import { WorkflowsPreview } from './_components/workflows-preview';

import { getAllComponents, getAllConnections, getAllWorkflows } from '@/lib/api';
import { auth } from '@/lib/auth';
import type { ComponentSchema as Component } from "@/lib/api";
import type { Connection } from "@/lib/connections";
import type { z } from 'zod';
import type { WorkflowSchema } from '@/lib/api';

type Workflow = z.infer<typeof WorkflowSchema>;


// Mock data - replace with actual data fetching
const mockLogs = [
    { id: 'log_1', tool: 'Jira', action: 'create_ticket', status: 'Failed', timestamp: '2023-10-27 10:00:00 UTC' },
    { id: 'log_2', tool: 'GitHub', action: 'create_issue', status: 'Success', timestamp: '2023-10-27 10:01:00 UTC' },
    { id: 'log_3', tool: 'Slack', action: 'send_message', status: 'Success', timestamp: '2023-10-27 10:02:00 UTC' },
    { id: 'log_4', tool: 'Google Drive', action: 'upload_file', status: 'Success', timestamp: '2023-10-27 10:05:00 UTC' },
    { id: 'log_5', tool: 'Salesforce', action: 'create_lead', status: 'Success', timestamp: '2023-10-27 10:06:00 UTC' },
];


export default function DashboardPage() {
    const { toast } = useToast();
    const [components, setComponents] = useState<Component[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // For now, using mock data for logs
    const [activityLogs, setActivityLogs] = useState(mockLogs);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const [fetchedComponents, fetchedConnections, fetchedWorkflows] = await Promise.all([
                        getAllComponents(),
                        getAllConnections(),
                        getAllWorkflows(),
                    ]);
                    setComponents(fetchedComponents);
                    setConnections(fetchedConnections);
                    setWorkflows(fetchedWorkflows);
                } catch (error) {
                    console.error("Failed to fetch dashboard data:", error);
                    toast({
                        variant: "destructive",
                        title: "Error fetching dashboard data",
                        description: "Could not load project statistics from the database.",
                    });
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Handle case where user is not logged in
                setIsLoading(false);
                setComponents([]);
                setConnections([]);
                setWorkflows([]);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [toast]);

    const stats = {
        workflows: workflows.length,
        components: components.length,
        connections: connections.length,
    }

    if (isLoading) {
        return (
             <div className="space-y-8">
                <WelcomeHeader />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                         <div className="grid gap-4 md:grid-cols-3">
                            <Skeleton className="h-[108px] rounded-lg" />
                            <Skeleton className="h-[108px] rounded-lg" />
                            <Skeleton className="h-[108px] rounded-lg" />
                        </div>
                        <Skeleton className="h-64 rounded-lg" />
                        <Skeleton className="h-96 rounded-lg" />
                    </div>
                     <div className="lg:col-span-1 space-y-8">
                        <Card>
                             <Skeleton className="h-96 w-full"/>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    const allStepsComplete = stats.components > 0 && stats.connections > 0;

    return (
        <div className="space-y-8">
            <WelcomeHeader />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <StatsCards stats={stats} />
                    { !allStepsComplete && (
                        <GettingStarted 
                            hasComponents={stats.components > 0} 
                            hasConnections={stats.connections > 0} 
                        />
                    )}
                    <WorkflowsPreview workflows={workflows} />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <RecentActivity logs={activityLogs.slice(0, 5)} />
                </div>
            </div>
        </div>
    );
}
