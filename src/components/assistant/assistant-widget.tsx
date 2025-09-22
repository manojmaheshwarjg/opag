
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, Send, Loader2, X, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { usePathname } from 'next/navigation';
import { getAiHelp } from '@/app/actions';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';


type Message = {
    role: 'user' | 'assistant';
    content: string;
};

const WelcomeMessage = ({ onSuggestionClick }: { onSuggestionClick: (query: string) => void }) => {
    const suggestions = [
        "How do I create a new skill?",
        "What are connections for?",
        "Take me to the playground",
        "Explain workflows"
    ];

    return (
        <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                    <Bot className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-semibold">How can I help?</h3>
                    <p className="text-sm text-muted-foreground">Ask me anything about the app.</p>
                </div>
            </div>
            <div className="space-y-2">
                {suggestions.map(s => (
                    <button
                        key={s}
                        onClick={() => onSuggestionClick(s)}
                        className="w-full text-left p-2 rounded-md bg-muted hover:bg-muted/80 text-sm"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
};


export function AssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        // Find the viewport element within the ScrollArea
        const viewport = scrollAreaRef.current?.querySelector(':scope > div');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTo({
                    top: viewport.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [messages]);
    
    const handleSuggestionClick = (query: string) => {
        setInput(query);
        handleSubmit(query);
    }

    const handleSubmit = async (queryOverride?: string) => {
        const currentQuery = queryOverride || input;
        if (!currentQuery.trim()) return;

        const newUserMessage: Message = { role: 'user', content: currentQuery };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        const result = await getAiHelp({ currentPage: pathname, query: currentQuery });

        if (result.success && result.response) {
            setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
        } else {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an error. Please try again." }]);
        }
        setIsLoading(false);
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit();
    }
    
    const handleReset = () => {
        setMessages([]);
        setInput('');
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
                >
                    <Sparkles className="h-6 w-6" />
                    <span className="sr-only">Open AI Assistant</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                className="w-[400px] p-0 rounded-xl shadow-2xl mr-4 mb-2"
            >
                <div className="flex flex-col h-[500px]">
                    <div className="p-3 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-sm">AI Assistant</h3>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>

                    <ScrollArea className="flex-grow" ref={scrollAreaRef}>
                        <div className="p-4 space-y-4">
                        {messages.length === 0 ? (
                           <WelcomeMessage onSuggestionClick={handleSuggestionClick} />
                        ) : (
                            messages.map((msg, index) => (
                                 <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                     {msg.role === 'assistant' && (
                                        <Avatar className="h-8 w-8 bg-primary/10 text-primary">
                                            <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                                        </Avatar>
                                     )}
                                     <div className={`rounded-lg p-3 max-w-sm text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        {msg.content}
                                     </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                             <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 bg-primary/10 text-primary">
                                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                                </Avatar>
                                <div className="rounded-lg p-3 max-w-sm text-sm bg-muted">
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        )}
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t">
                        <form onSubmit={handleFormSubmit} className="relative">
                            <Textarea
                                placeholder="Ask a question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleFormSubmit(e);
                                }
                                }}
                                className="pr-12 min-h-[40px]"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8"
                                disabled={isLoading || !input.trim()}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

    