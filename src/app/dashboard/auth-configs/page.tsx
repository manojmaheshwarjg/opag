
'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, PlusCircle, ListFilter } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toolkits } from "@/lib/toolkits";


const SelectToolkitSheet = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredToolkits = toolkits.filter(toolkit => 
        toolkit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Auth Config
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
                            <div key={toolkit.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer">
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


export default function AuthConfigsPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold">Authentication Vault</h1>
                <SelectToolkitSheet />
            </div>

            <div className="flex gap-2 mb-6">
                 <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search configurations..." className="pl-10" />
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 py-16" >
                <div className="text-center">
                    <h3 className="text-lg font-semibold">No Authentication Configs Found</h3>
                    <p className="text-muted-foreground text-sm mt-1">Create a new configuration to securely connect your agents to skillsets.</p>
                </div>
            </div>
        </div>
    )
}

    