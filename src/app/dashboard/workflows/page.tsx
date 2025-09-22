
'use client';

import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getAllWorkflows } from "@/lib/api";
import { handleDeleteWorkflow } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { WorkflowSchema } from "@/lib/api";
import { formatDistanceToNow } from 'date-fns';
import { auth } from "@/lib/auth";

type Workflow = z.infer<typeof WorkflowSchema>;


const SkeletonRow = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-64" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-10" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
)

export default function WorkflowsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWorkflows = async () => {
        setIsLoading(true);
        try {
            const fetchedWorkflows = await getAllWorkflows();
            setWorkflows(fetchedWorkflows);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to load workflows',
                description: 'Could not fetch workflows from the database. Please try again later.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                fetchWorkflows();
            } else {
                setIsLoading(false);
                setWorkflows([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleCreateWorkflow = () => {
        router.push('/editor/new');
    }
    
    const handleEditWorkflow = (workflowId: string) => {
        router.push(`/editor/${workflowId}`);
    }

    const handleDeleteConfirm = async () => {
        if (workflowToDelete) {
            const result = await handleDeleteWorkflow({ id: workflowToDelete.id });
            if (result.success) {
                toast({
                    title: 'Workflow Deleted',
                    description: `The workflow "${workflowToDelete.name}" has been deleted.`
                });
                await fetchWorkflows(); // Refetch
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Deletion failed',
                    description: result.error
                });
            }
            setWorkflowToDelete(null);
        }
    }

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
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold">Workflows</h1>
                <Button onClick={handleCreateWorkflow}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Workflow
                </Button>
            </div>

            {isLoading ? (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Steps</TableHead>
                                <TableHead>Last Edited</TableHead>
                                <TableHead className="w-[50px] text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                        </TableBody>
                    </Table>
                </div>
            ) : workflows.length > 0 ? (
                 <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Steps</TableHead>
                                <TableHead>Last Edited</TableHead>
                                <TableHead className="w-[50px] text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workflows.map(workflow => (
                                <TableRow key={workflow.id} className="cursor-pointer" onClick={() => handleEditWorkflow(workflow.id)}>
                                    <TableCell className="font-medium">{workflow.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={workflow.status === 'Active' ? 'default' : 'secondary'} className={workflow.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                                            {workflow.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{workflow.stepCount}</TableCell>
                                    <TableCell>{formatLastEdited(workflow.lastEdited)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditWorkflow(workflow.id); }}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Duplicate</DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600"
                                                     onClick={(e) => { e.stopPropagation(); setWorkflowToDelete(workflow); }}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 py-16 text-center">
                    <div>
                        <h3 className="text-lg font-semibold">No Workflows Yet</h3>
                        <p className="text-muted-foreground text-sm mt-1 mb-4">
                            Create your first workflow to automate complex tasks.
                        </p>
                        <Button onClick={handleCreateWorkflow}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Workflow
                        </Button>
                    </div>
                </div>
            )}
            
            <AlertDialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the workflow
                                "{workflowToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setWorkflowToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
