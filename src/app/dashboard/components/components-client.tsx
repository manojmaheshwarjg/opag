
'use client';

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Search, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import React, { useState, useMemo, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toolkits } from "@/lib/toolkits";
import { deleteComponent } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { getAllComponents, ComponentSchema as Component } from "@/lib/api";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";

type Component = z.infer<typeof Component>;


const SkeletonRow = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-64" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
)

export default function ComponentsClient() {
    const router = useRouter();
    const { toast } = useToast();
    const [components, setComponents] = useState<Component[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [toolkitFilter, setToolkitFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const fetchComponents = async () => {
        setIsLoading(true);
        try {
            const allComponents = await getAllComponents();
            setComponents(allComponents);
        } catch (error) {
            console.error("Failed to fetch components:", error);
            toast({
                variant: "destructive",
                title: "Error fetching components",
                description: "Could not load components from the database.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                fetchComponents();
            } else {
                setIsLoading(false);
                setComponents([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleCreate = () => {
        router.push('/dashboard/new-component');
    }

    const handleDeleteConfirm = async () => {
        if (componentToDelete) {
            const result = await deleteComponent({ id: componentToDelete.id, name: componentToDelete.name });
             if (result.success) {
                toast({
                    title: "Component Deleted",
                    description: `The component "${componentToDelete.name}" is gone forever.`,
                });
                fetchComponents(); // Refetch components after deletion
            } else {
                toast({
                    variant: "destructive",
                    title: "Deletion Failed",
                    description: result.error,
                });
            }
            setComponentToDelete(null);
        }
    }

    const handleEdit = (component: Component) => {
        const params = new URLSearchParams({
            id: component.id,
            name: component.name,
            description: component.description,
            parameters: component.parameters.join(','),
            toolkit: component.toolkit,
            type: component.type,
        });
        router.push(`/dashboard/new-component?${params.toString()}`);
    }

    const filteredComponents = useMemo(() => {
        return components.filter(component => {
            const searchMatch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                component.description.toLowerCase().includes(searchTerm.toLowerCase());
            const toolkitMatch = toolkitFilter === 'all' || component.toolkit === toolkitFilter;
            const typeMatch = typeFilter === 'all' || component.type === typeFilter;
            return searchMatch && toolkitMatch && typeMatch;
        });
    }, [components, searchTerm, toolkitFilter, typeFilter]);

    const availableToolkits = useMemo(() => {
        const uniqueToolkits = new Set(components.map(c => c.toolkit));
        return Array.from(uniqueToolkits);
    }, [components]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setToolkitFilter('all');
        setTypeFilter('all');
    }

    const isFiltered = searchTerm !== '' || toolkitFilter !== 'all' || typeFilter !== 'all';

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold">Components</h1>
                <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Component
                </Button>
            </div>

             <div className="flex gap-2 mb-6">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or description..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={toolkitFilter} onValueChange={setToolkitFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All skillsets" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All skillsets</SelectItem>
                        {availableToolkits.map(toolkit => (
                            <SelectItem key={toolkit} value={toolkit}>{toolkit}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="action">Skill</SelectItem>
                        <SelectItem value="trigger">Reaction</SelectItem>
                    </SelectContent>
                </Select>
                 {isFiltered && (
                    <Button variant="ghost" onClick={handleClearFilters}>
                        Clear <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            
            {isLoading ? (
                <div className="rounded-lg border">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[120px]">Type</TableHead>
                                <TableHead className="w-[150px]">Skillset</TableHead>
                                <TableHead className="w-[50px] text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                        </TableBody>
                    </Table>
                </div>
            ) : filteredComponents.length > 0 ? (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[120px]">Type</TableHead>
                                <TableHead className="w-[150px]">Skillset</TableHead>
                                <TableHead className="w-[50px] text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredComponents.map(component => (
                                <TableRow key={component.id}>
                                    <TableCell className="font-mono text-sm">{component.name}</TableCell>
                                    <TableCell>{component.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={component.type === 'trigger' ? 'outline' : 'secondary'} className={component.type === 'trigger' ? 'text-blue-600 border-blue-200' : ''}>
                                             {component.type === 'trigger' && <Zap className="mr-1 h-3 w-3"/>}
                                            {component.type === 'action' ? 'Skill' : 'Reaction'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{component.toolkit}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(component)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600"
                                                    onClick={() => setComponentToDelete(component)}
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
                        <h3 className="text-lg font-semibold">No Components Yet</h3>
                        <p className="text-muted-foreground text-sm mt-1 mb-4">
                            {isFiltered ? "No results. Try different filters." : "Create a component to give your agent a new skill."}
                        </p>
                         {!isFiltered && (
                            <Button onClick={handleCreate}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Component
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <AlertDialog open={!!componentToDelete} onOpenChange={(open) => !open && setComponentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This is permanent. You're about to delete the component
                                "{componentToDelete?.name}" and its flow file for good. No take-backs.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setComponentToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
