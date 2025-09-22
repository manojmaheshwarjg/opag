
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow, Plug, ToyBrick } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Stats = {
    workflows: number;
    components: number;
    connections: number;
}

const StatCard = ({ title, value, icon: Icon, href }: { title: string, value: number, icon: React.ElementType, href: string }) => {
    const router = useRouter();
    return (
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(href)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

export const StatsCards = ({ stats }: { stats: Stats }) => {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Workflows" value={stats.workflows} icon={Workflow} href="/dashboard/workflows" />
            <StatCard title="Components" value={stats.components} icon={ToyBrick} href="/dashboard/components" />
            <StatCard title="Connections" value={stats.connections} icon={Plug} href="/dashboard/connections" />
        </div>
    )
}
