
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, ArrowRight, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { signOut, auth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { AssistantWidget } from '@/components/assistant/assistant-widget';


const UserNav = () => {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    }

    if (isLoading) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                        <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.displayName || 'Anonymous User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                           {user?.email || 'No email provided'}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Organization</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const AbstractLogo = () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0L32 16L16 32L0 16L16 0Z" fill="black"/>
        <path d="M16 4L28 16L16 28L4 16L16 4Z" fill="white"/>
        <path d="M16 8L24 16L16 24L8 16L16 8Z" fill="black"/>
    </svg>
);


const OrgSwitcher = () => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const getOrgName = () => {
        if (isLoading) {
            return <Skeleton className="h-5 w-40" />;
        }
        if (user?.displayName) {
            const firstName = user.displayName.split(' ')[0];
            // Handle names that might be too long
            const possessiveName = firstName.length > 10 ? "My" : `${firstName}'s`;
            return `${possessiveName} Opag Studio`;
        }
        return "My Opag Studio";
    }

    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-md border">
                <AbstractLogo />
            </div>
            <div className="font-semibold">{getOrgName()}</div>
        </div>
    )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/workflows', label: 'Workflows' },
    { href: '/dashboard/playground', label: 'Playground' },
    { href: '/dashboard/components', label: 'Components' },
    { href: '/dashboard/connections', label: 'Connections' },
    { href: '/dashboard/toolkits', label: 'Skillsets' },
    { href: '/dashboard/activity', label: 'Activity' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-muted/50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <OrgSwitcher />
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="#">Docs & SDK <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                    <UserNav />
                </div>
            </div>
        </header>
         <nav className="border-b bg-muted/50">
            <div className="container mx-auto px-4">
                <div className="flex h-12 items-center">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center h-full px-3 text-sm font-medium border-b-2
                            ${pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }
                            `}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            {children}
        </main>
        <AssistantWidget />
    </div>
  );
}

    