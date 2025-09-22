
'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, PlusCircle, MoreHorizontal, X } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toolkits } from "@/lib/toolkits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Connection } from "@/lib/connections";
import { handleDeleteConnection, handleCreateOrUpdateConnection } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { getAllConnections } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";


const SelectToolkitSheet = ({ onSelect }: { onSelect: (toolkit: any) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);

    const filteredToolkits = toolkits.filter(toolkit => 
        toolkit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (toolkit: any) => {
        onSelect(toolkit);
        setOpen(false);
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Connection
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Select a Skillset</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search skillsets..." 
                            className="pl-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 h-[calc(100vh-10rem)] overflow-y-auto pr-4">
                        {filteredToolkits.sort((a,b) => a.name.localeCompare(b.name)).map(toolkit => (
                            <div key={toolkit.name} onClick={() => handleSelect(toolkit)} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <Image src={`https://logo.clearbit.com/${toolkit.domain}`} alt={toolkit.name} width={32} height={32} className="rounded-md object-contain" />
                                    <span className="font-medium">{toolkit.name}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                    {toolkit.auth.map(authType => (
                                        <Badge key={authType} variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 font-medium py-0.5 px-1.5 text-xs">{authType}</Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

const SkeletonRow = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell>
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-24" />
            </div>
        </TableCell>
        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
)

export default function ConnectionsClient() {
    const router = useRouter();
    const { toast } = useToast();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [toolkitFilter, setToolkitFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    const fetchConnections = async () => {
        setIsLoading(true);
        try {
            const conns = await getAllConnections();
            setConnections(conns);
        } catch (error) {
            console.error("Failed to fetch connections:", error);
            toast({
                variant: "destructive",
                title: "Error fetching connections",
                description: "Could not load connections from the database.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                fetchConnections();
            } else {
                setIsLoading(false);
                setConnections([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSelectToolkit = (toolkit: any) => {
        router.push(`/dashboard/connections/new?toolkitName=${encodeURIComponent(toolkit.name)}&toolkitDomain=${encodeURIComponent(toolkit.domain)}`);
    }

    const handleDeleteConfirm = async () => {
        if (connectionToDelete) {
            const result = await handleDeleteConnection({ id: connectionToDelete.id });
            if (result.success) {
                await fetchConnections(); // Refetch connections
                toast({
                    title: "Connection Deleted",
                    description: `The connection "${connectionToDelete.name}" has been deleted.`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: "Deletion Failed",
                    description: result.error,
                });
            }
            setConnectionToDelete(null);
        }
    }

    const handleDuplicate = async (connectionId: string) => {
        const connectionToDuplicate = connections.find(c => c.id === connectionId);
        if (connectionToDuplicate) {
            const newConnection = {
                ...connectionToDuplicate,
                id: `conn_${Date.now()}`,
                name: `${connectionToDuplicate.name}_copy`,
            };
            
            const result = await handleCreateOrUpdateConnection(newConnection, false);
            if (result.success) {
                await fetchConnections(); // Refetch connections
                toast({
                    title: "Connection Duplicated",
                    description: `Connection "${connectionToDuplicate.name}" has been duplicated.`,
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: "Duplication Failed",
                    description: result.error,
                });
            }
        }
    }

    const handleEdit = (connection: Connection) => {
        const params = new URLSearchParams({
            id: connection.id,
            name: connection.name,
            toolkitName: connection.toolkitName,
            toolkitDomain: connection.toolkitDomain,
        });
        router.push(`/dashboard/connections/new?${params.toString()}`);
    }


    const filteredConnections = useMemo(() => {
        return connections.filter(conn => {
            const searchMatch = conn.name.toLowerCase().includes(searchTerm.toLowerCase()) || conn.toolkitName.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || conn.status.toLowerCase() === statusFilter;
            const toolkitMatch = toolkitFilter === 'all' || conn.toolkitName === toolkitFilter;
            return searchMatch && statusMatch && toolkitMatch;
        });
    }, [connections, searchTerm, statusFilter, toolkitFilter]);

    const availableToolkits = useMemo(() => {
        const uniqueToolkits = new Set(connections.map(c => c.toolkitName));
        return Array.from(uniqueToolkits);
    }, [connections]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setToolkitFilter('all');
    }

    const isFiltered = searchTerm !== '' || statusFilter !== 'all' || toolkitFilter !== 'all';
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold">Connections</h1>
                <SelectToolkitSheet onSelect={handleSelectToolkit} />
            </div>

            <div className="flex gap-2 mb-6">
                 <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or skillset..." 
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
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Connected">Connected</SelectItem>
                        <SelectItem value="Disconnected">Disconnected</SelectItem>
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
                                <TableHead className="w-[180px]">Skillset</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="w-[120px]">Auth Type</TableHead>
                                <TableHead>Created At</TableHead>
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
            ) : filteredConnections.length > 0 ? (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead className="w-[180px]">Skillset</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="w-[120px]">Auth Type</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="w-[50px] text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredConnections.map(conn => (
                                <TableRow key={conn.id}>
                                    <TableCell className="font-medium">{conn.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Image src={`https://logo.clearbit.com/${conn.toolkitDomain}`} alt={conn.toolkitName} width={20} height={20} className="rounded-sm" />
                                            <span>{conn.toolkitName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={conn.status === 'Connected' ? 'default' : 'destructive'} className={conn.status === 'Connected' ? 'bg-green-100 text-green-800' : ''}>
                                            {conn.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 font-medium py-0.5 px-1.5 text-xs">
                                            {conn.authType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{conn.createdAt}</TableCell>
                                    <TableCell className="text-right">
                                       <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(conn)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicate(conn.id)}>Duplicate</DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600"
                                                    onClick={() => setConnectionToDelete(conn)}
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
                <div className="flex-grow flex items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 py-16" >
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">No Connections Here</h3>
                        <p className="text-muted-foreground text-sm mt-1">{isFiltered ? "No results. Try different filters." : "Connect a skillset to get started."}</p>
                    </div>
                </div>
            )}
             <AlertDialog open={!!connectionToDelete} onOpenChange={(open) => !open && setConnectionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the connection
                                "{connectionToDelete?.name}". This action is irreversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConnectionToDelete(null)}>Nvm</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
