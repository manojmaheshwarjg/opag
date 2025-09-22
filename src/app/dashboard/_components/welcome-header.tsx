
'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import type { User } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const WelcomeHeader = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const getFirstName = () => {
        if (user?.displayName) {
            return `, ${user.displayName.split(' ')[0]}`;
        }
        return '';
    }

    return (
        <div className="flex justify-between items-center">
            <div className="max-w-prose">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-5 w-80" />
                    </div>
                ) : (
                     <>
                        <h1 className="text-2xl font-semibold">Yo{getFirstName()}! Let's build something sick.</h1>
                        <p className="text-muted-foreground mt-2">This is your command center. Go cook something up in the playground.</p>
                    </>
                )}
            </div>
             <Button onClick={() => router.push('/dashboard/playground')} disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Go to Playground
            </Button>
        </div>
    )
}
