
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { handleCreateOrUpdateConnection } from "@/app/actions";
import { getConnectionById } from "@/lib/api";


const ConnectionSchema = z.object({
  connectionName: z.string().min(1, "Connection name is required."),
  apiKey: z.string().min(1, "API Key is required."),
});

export default function NewConnectionPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  
  const toolkitName = searchParams.get('toolkitName') || 'Unknown Skillset';
  const toolkitDomain = searchParams.get('toolkitDomain') || '';


  const form = useForm<z.infer<typeof ConnectionSchema>>({
    resolver: zodResolver(ConnectionSchema),
    defaultValues: {
      connectionName: "",
      apiKey: "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
        setIsEditMode(true);
        setConnectionId(id);
        const name = searchParams.get('name') || '';

        const fetchConnectionDetails = async () => {
            const conn = await getConnectionById(id);
            reset({
                connectionName: name,
                // In edit mode, we don't want to expose the key.
                // The user must re-enter it if they want to change it.
                apiKey: conn?.apiKey ? '********' : '', 
            });
        }
        fetchConnectionDetails();
    }
  }, [searchParams, reset]);


  async function onSubmit(data: z.infer<typeof ConnectionSchema>) {
    setIsSubmitting(true);
    
    let connectionData: any = {
        id: connectionId || `conn_${Date.now()}`,
        name: data.connectionName,
        toolkitName: toolkitName,
        toolkitDomain: toolkitDomain,
        status: 'Connected',
        authType: 'API_KEY',
    };

    // Only include the API key if it has been changed from the placeholder
    if (data.apiKey && data.apiKey !== '********') {
        connectionData.apiKey = data.apiKey;
    }

    if (!isEditMode) {
      connectionData.createdAt = new Date().toLocaleString();
    }

    const result = await handleCreateOrUpdateConnection(connectionData, isEditMode);

    setIsSubmitting(false);

     if (result.success) {
        toast({
            title: isEditMode ? "Connection Updated!" : "Connection Created!",
            description: `Your connection to ${toolkitName} is all set.`,
        });
        router.push('/dashboard/connections');
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "An unknown error occurred.",
        });
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
            {toolkitDomain && <Image src={`https://logo.clearbit.com/${toolkitDomain}`} alt={toolkitName} width={40} height={40} className="rounded-md" />}
            <div>
                <CardTitle>{isEditMode ? "Edit Connection" : "New Connection"}</CardTitle>
                <CardDescription>{isEditMode ? `Update your connection to ${toolkitName}.` : `Connect to ${toolkitName} to unlock its features.`}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="connectionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., My Personal GitHub" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique name so you know what this is later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={isEditMode ? "Leave blank to keep unchanged" : "Enter your API Key"} {...field} />
                  </FormControl>
                  <FormDescription>
                    Your secret handshake with {toolkitName}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : (isEditMode ? "Save Changes" : "Create Connection")}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
