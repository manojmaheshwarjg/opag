
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

type Log = {
    id: string;
    tool: string;
    action: string;
    status: 'Success' | 'Failed';
    timestamp: string;
}

export const RecentActivity = ({ logs }: { logs: Log[] }) => {
    const router = useRouter();

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A log of the latest skills performed by your agents.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {logs.map(log => (
                        <div key={log.id} className="flex items-center">
                            <div className="flex-grow">
                                <p className="text-sm font-medium">
                                    <span className="font-semibold">{log.tool}</span>: {log.action}
                                </p>
                                <p className="text-xs text-muted-foreground">{timeAgo(log.timestamp)}</p>
                            </div>
                            <Badge variant={log.status === 'Success' ? 'default' : 'destructive'} className={log.status === 'Success' ? 'bg-green-100 text-green-800' : ''}>
                                {log.status}
                            </Badge>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                    )}
                </div>
                 <Button
                    variant="outline"
                    className="w-full mt-6"
                    onClick={() => router.push('/dashboard/activity')}
                >
                    View all activity
                </Button>
            </CardContent>
        </Card>
    )
}

    