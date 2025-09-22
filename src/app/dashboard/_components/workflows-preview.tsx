
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { PlusCircle, Workflow } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';

import { z } from 'zod';
import { WorkflowSchema } from '@/lib/api';

type Workflow = z.infer<typeof WorkflowSchema> & { lastEdited: any }; // Allow string for client-side display

export const WorkflowsPreview = ({ workflows }: { workflows: Workflow[] }) => {
    const router = useRouter();

    const formatLastEdited = (date: any) => {
        if (!date) return 'N/A';
        try {
            const dateObj = date.toDate ? date.toDate() : new Date(date);
            return formatDistanceToNow(dateObj, { addSuffix: true });
        } catch (e) {
            return 'Invalid date';
        }
    };


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Workflows</CardTitle>
                    <CardDescription>A list of your most recent workflows.</CardDescription>
                </div>
                 <Button variant="outline" onClick={() => router.push('/dashboard/workflows')}>
                    View all
                </Button>
            </CardHeader>
            <CardContent>
                {workflows.length > 0 ? (
                    <div className="rounded-lg border">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Steps</TableHead>
                                    <TableHead>Last Edited</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workflows.slice(0, 3).map(workflow => (
                                    <TableRow key={workflow.id} className="cursor-pointer" onClick={() => router.push(`/editor/${workflow.id}`)}>
                                        <TableCell className="font-medium">{workflow.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={workflow.status === 'Active' ? 'default' : 'secondary'} className={workflow.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                                                {workflow.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{workflow.stepCount}</TableCell>
                                        <TableCell>{formatLastEdited(workflow.lastEdited)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 ) : (
                    <div className="text-center py-10 rounded-lg border-2 border-dashed bg-muted/50">
                        <Workflow className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Workflows Yet</h3>
                        <p className="text-muted-foreground text-sm mt-1 mb-4">
                            Create your first workflow to automate complex tasks.
                        </p>
                        <Button onClick={() => router.push('/editor/new')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Workflow
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
