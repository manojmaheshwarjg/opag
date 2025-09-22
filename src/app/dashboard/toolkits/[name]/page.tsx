
'use client'

import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getToolkit } from '@/lib/toolkits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function ToolkitDetailPage() {
    const router = useRouter();
    const params = useParams();
    const name = typeof params.name === 'string' ? params.name : '';
    const toolkit = getToolkit(decodeURIComponent(name));

    if (!toolkit) {
        return (
            <div className="text-center py-10">
                <p>Skillset not found.</p>
                <Button variant="link" onClick={() => router.push('/dashboard/toolkits')}>
                    Back to Marketplace
                </Button>
            </div>
        )
    }

    const handleConnect = () => {
        router.push(`/dashboard/connections/new?toolkitName=${encodeURIComponent(toolkit.name)}&toolkitDomain=${encodeURIComponent(toolkit.domain)}`);
    }

    return (
        <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <Card>
                <CardHeader className="flex-row items-start gap-6 space-y-0">
                    <Image src={`https://logo.clearbit.com/${toolkit.domain}`} alt={toolkit.name} width={64} height={64} className="rounded-lg" />
                    <div className="flex-grow">
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-2xl">{toolkit.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    {toolkit.auth.map(authType => (
                                        <Badge key={authType} variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 font-medium">{authType}</Badge>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleConnect}>Connect</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                   <Tabs defaultValue="actions" className="mt-4">
                        <TabsList>
                            <TabsTrigger value="actions">Skills ({toolkit.actions?.length || 0})</TabsTrigger>
                            <TabsTrigger value="triggers">Reactions ({toolkit.triggers?.length || 0})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="actions">
                            <div className="rounded-lg border mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Skill</TableHead>
                                            <TableHead>Description</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {toolkit.actions && toolkit.actions.length > 0 ? toolkit.actions.map((action: any) => (
                                            <TableRow key={action.name}>
                                                <TableCell className="font-mono text-sm text-purple-600">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn({ 'line-through': action.deprecated })}>{action.name}</span>
                                                        {action.deprecated && <Badge variant="destructive" className="text-xs">Deprecated</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{action.description}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                                    No skills available for this skillset.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                         <TabsContent value="triggers">
                             <div className="rounded-lg border mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reaction</TableHead>
                                            <TableHead>Description</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {toolkit.triggers && toolkit.triggers.length > 0 ? toolkit.triggers.map(trigger => (
                                            <TableRow key={trigger.name}>
                                                <TableCell className="font-mono text-sm text-blue-600">{trigger.name}</TableCell>
                                                <TableCell>{trigger.description}</TableCell>
                                            </TableRow>
                                        )) : (
                                             <TableRow>
                                                <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                                    No reactions available for this skillset.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

    