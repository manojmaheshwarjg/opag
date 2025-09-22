
'use client'

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toolkits } from '@/lib/toolkits';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Wand2, Zap, Download } from 'lucide-react';

const ToolkitCard = ({ toolkit }: { toolkit: any }) => {
    const router = useRouter();

    return (
        <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col"
            onClick={() => router.push(`/dashboard/toolkits/${toolkit.name}`)}
        >
            <CardHeader className="flex-row items-start gap-4 space-y-0">
                <div className="w-10 h-10 flex-shrink-0">
                    <Image src={`https://logo.clearbit.com/${toolkit.domain}`} alt={toolkit.name} width={40} height={40} className="rounded-md border p-1 w-full h-full object-contain" />
                </div>
                <div>
                    <CardTitle className="text-base">{toolkit.name}</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase">{toolkit.domain.split('.')[0]}</p>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">
                   {toolkit.description || `The official ${toolkit.name} skillset for all your integration needs.`}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                 <div className="flex gap-1.5 flex-wrap">
                    {toolkit.auth.map((authType: string) => (
                        <Badge key={authType} variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 font-medium py-0.5 px-1.5">{authType}</Badge>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Wand2 className="w-3 h-3"/> {toolkit.actions?.length || 0}</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3"/> {toolkit.triggers?.length || 0}</span>
                </div>
            </CardFooter>
        </Card>
    )
}

export default function ToolkitsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredToolkits = toolkits.filter(toolkit => 
        toolkit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (toolkit.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-semibold">All Skillsets</h1>
                <p className="text-muted-foreground mt-2">All the skillsets, that we support.</p>
            </div>
            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search skillsets by name or description..." 
                        className="pl-10 max-w-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <p className="text-sm text-muted-foreground">{filteredToolkits.length} skillsets</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredToolkits.sort((a, b) => a.name.localeCompare(b.name)).map(toolkit => (
                   <ToolkitCard key={toolkit.name} toolkit={toolkit} />
                ))}
            </div>
        </div>
    )
}

    