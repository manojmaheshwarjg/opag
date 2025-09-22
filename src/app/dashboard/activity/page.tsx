
'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

const logs = [
    { id: 'log_1', tool: 'Jira', action: 'create_ticket', status: 'Failed', timestamp: '2023-10-27 10:00:00 UTC' },
    { id: 'log_2', tool: 'GitHub', action: 'create_issue', status: 'Success', timestamp: '2023-10-27 10:01:00 UTC' },
    { id: 'log_3', tool: 'Slack', action: 'send_message', status: 'Success', timestamp: '2023-10-27 10:02:00 UTC' },
    { id: 'log_4', tool: 'Google Drive', action: 'upload_file', status: 'Success', timestamp: '2023-10-27 10:05:00 UTC' },
    { id: 'log_5', tool: 'Salesforce', action: 'create_lead', status: 'Success', timestamp: '2023-10-27 10:06:00 UTC' },
    { id: 'log_6', tool: 'Stripe', action: 'create_charge', status: 'Failed', timestamp: '2023-10-27 10:08:00 UTC' },
    { id: 'log_7', tool: 'Twilio', action: 'send_sms', status: 'Success', timestamp: '2023-10-27 10:10:00 UTC' },
    { id: 'log_8', tool: 'Asana', action: 'create_task', status: 'Success', timestamp: '2023-10-27 10:12:00 UTC' },
    { id: 'log_9', tool: 'HubSpot', action: 'update_contact', status: 'Success', timestamp: '2023-10-27 10:15:00 UTC' },
    { id: 'log_10', tool: 'Mailchimp', action: 'add_subscriber', status: 'Failed', timestamp: '2023-10-27 10:18:00 UTC' },
    { id: 'log_11', tool: 'Zendesk', action: 'create_ticket', status: 'Success', timestamp: '2023-10-27 10:20:00 UTC' },
    { id: 'log_12', tool: 'Intercom', action: 'send_message', status: 'Success', timestamp: '2023-10-27 10:22:00 UTC' },
    { id: 'log_13', tool: 'Shopify', action: 'create_product', status: 'Success', timestamp: '2023-10-27 10:25:00 UTC' },
    { id: 'log_14', tool: 'Notion', action: 'create_page', status: 'Success', timestamp: '2023-10-27 10:28:00 UTC' },
    { id: 'log_15', tool: 'Discord', action: 'send_channel_message', status: 'Failed', timestamp: '2023-10-27 10:30:00 UTC' },
]

const SkeletonRow = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
    </TableRow>
)


export default function ActivityPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [toolkitFilter, setToolkitFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    // Simulate data fetching
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const searchMatch = log.tool.toLowerCase().includes(searchTerm.toLowerCase()) || log.action.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || log.status.toLowerCase() === statusFilter;
            const toolkitMatch = toolkitFilter === 'all' || log.tool === toolkitFilter;
            return searchMatch && statusMatch && toolkitMatch;
        });
    }, [searchTerm, statusFilter, toolkitFilter]);

     const availableToolkits = useMemo(() => {
        const uniqueToolkits = new Set(logs.map(log => log.tool));
        return Array.from(uniqueToolkits);
    }, []);

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setToolkitFilter('all');
    }

    const isFiltered = searchTerm !== '' || statusFilter !== 'all' || toolkitFilter !== 'all';

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Activity Feed</CardTitle>
                    <CardDescription>A real-time log of all skills performed by your agents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by skillset or skill..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                         <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Success">Success</SelectItem>
                                <SelectItem value="Failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
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
                        {isFiltered && (
                            <Button variant="ghost" onClick={handleClearFilters}>
                                Clear <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Skillset</TableHead>
                                    <TableHead>Skill</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : filteredLogs.length > 0 ? filteredLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.tool}</TableCell>
                                        <TableCell>{log.action}</TableCell>
                                        <TableCell>
                                            <Badge variant={log.status === 'Success' ? 'default' : 'destructive'} className={log.status === 'Success' ? 'bg-green-100 text-green-800' : ''}>
                                                {log.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{log.timestamp}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No recent activity.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

    