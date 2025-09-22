
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { handleSuggestDescription, generateComponentFlow } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Wand2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toolkits } from "@/lib/toolkits";
import Image from "next/image";

const ComponentSchema = z.object({
  id: z.string().optional(),
  componentName: z.string().min(1, "Component name is required.").refine(val => /^[a-z_]+$/.test(val), {
    message: "Name must be in snake_case (e.g., my_component_name).",
  }),
  parameters: z.string().optional(),
  description: z.string().min(1, "Description is required."),
  toolkit: z.string().min(1, "Please select a skillset."),
  type: z.enum(["action", "trigger"], { required_error: "Please select a component type."}),
  isEditMode: z.boolean().optional(),
  originalComponentName: z.string().optional(),
});

export default function NewComponentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const form = useForm<z.infer<typeof ComponentSchema>>({
    resolver: zodResolver(ComponentSchema),
    defaultValues: {
      id: undefined,
      componentName: "",
      parameters: "",
      description: "",
      toolkit: "",
      type: undefined,
      isEditMode: false,
      originalComponentName: "",
    },
  });

  const { setValue, getValues, reset, watch } = form;

  const componentType = watch("type");

  useEffect(() => {
    const componentId = searchParams.get('id');
    if (componentId) {
        const name = searchParams.get('name') || '';
        setIsEditMode(true);
        const type = (searchParams.get('type') as 'action' | 'trigger' | undefined) || undefined;
        reset({
            id: componentId,
            componentName: name,
            parameters: searchParams.get('parameters') || '',
            description: searchParams.get('description') || '',
            toolkit: searchParams.get('toolkit') || '',
            type: type,
            isEditMode: true,
            originalComponentName: name,
        });
    }
  }, [searchParams, reset]);


  const onSuggestDescription = async () => {
    const { componentName, parameters } = getValues();
    if (!componentName) {
      toast({
        variant: "destructive",
        title: "Missing Info",
        description: `Need a ${componentType === 'action' ? 'Skill' : 'Reaction'} name to generate a description.`,
      });
      return;
    }
    setIsSuggesting(true);
    const result = await handleSuggestDescription(componentName, parameters || '');
    setIsSuggesting(false);
    if (result.description) {
      setValue('description', result.description);
      toast({
        title: "Suggestion generated!",
        description: "The description has been filled in. Feel free to edit.",
      });
    } else if (result.error) {
      toast({
        variant: "destructive",
        title: "Suggestion Failed",
        description: result.error,
      });
    }
  };

  async function onSubmit(data: z.infer<typeof ComponentSchema>) {
    setIsSubmitting(true);

    const result = await generateComponentFlow(data);
    
    setIsSubmitting(false);

    if (result.success) {
        toast({
            title: isEditMode ? "Component Updated!" : "Component Created!",
            description: isEditMode ? `Component "${data.componentName}" has been updated.` : `Component "${data.componentName}" has been created and registered.`,
        });
        // The AI will handle the file creation in the background based on the action response.
        router.push('/dashboard/components');
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "An unknown error occurred.",
        });
    }
  }

  const typeName = componentType === 'trigger' ? 'Reaction' : 'Skill';

  return (
    <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>{isEditMode ? `Edit ${typeName}` : `Create New Component`}</CardTitle>
            <CardDescription>
                {isEditMode ? `Tweak the details of your ${componentType}.` : `Define a new component, and we'll generate the boilerplate code for you.`}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Component Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a component type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="action">Skill</SelectItem>
                          <SelectItem value="trigger">Reaction</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        'Skills' do stuff, 'Reactions' start stuff. Can't change this later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {componentType && (
                  <>
                    <FormField
                    control={form.control}
                    name="componentName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{typeName} Name</FormLabel>
                        <FormControl>
                            <Input placeholder={componentType === 'action' ? "e.g., create_github_issue" : "e.g., new_github_commit"} {...field} />
                        </FormControl>
                        <FormDescription>
                            Unique name for the {componentType}. Use snake_case.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={form.control}
                      name="toolkit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skillset</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a skillset" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {toolkits.sort((a,b) => a.name.localeCompare(b.name)).map(toolkit => (
                                <SelectItem key={toolkit.name} value={toolkit.name}>
                                    <div className="flex items-center gap-2">
                                        <Image
                                            src={`https://logo.clearbit.com/${toolkit.domain}`}
                                            alt={toolkit.name}
                                            width={16}
                                            height={16}
                                            className="rounded-sm"
                                        />
                                        <span>{toolkit.name}</span>
                                    </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Group this component under a skillset.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="parameters"
                    render={({ field }) => (
                        <FormItem className={componentType === 'trigger' ? 'hidden' : ''}>
                        <FormLabel>Parameters</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., repo, title, body" {...field} />
                        </FormControl>
                        <FormDescription>
                            Comma-separated list of inputs the skill needs.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <div className="relative">
                            <FormControl>
                            <Textarea
                                placeholder={`Describe what this ${componentType} does...`}
                                className="resize-none pr-24"
                                {...field}
                            />
                            </FormControl>
                            {componentType === 'action' && (
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    size="sm" 
                                    onClick={onSuggestDescription}
                                    disabled={isSuggesting}
                                    className="absolute bottom-2 right-2"
                                >
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    {isSuggesting ? 'Thinking...' : 'Suggest'}
                                </Button>
                            )}
                        </div>
                        <FormDescription>
                            Explain what this {componentType} does. Keep it clear and simple.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (isEditMode ? `Save ${typeName}` : `Create Component`)}
                        </Button>
                    </div>
                  </>
                )}
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}

    