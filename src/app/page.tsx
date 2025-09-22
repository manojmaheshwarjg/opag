
'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Github, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signInWithGitHub, signInAnonymously } from '@/lib/auth';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';


const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
);

const DiscordIcon = () => (
    <svg className="size-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.36989C18.7915 3.74689 17.1825 3.24689 15.524 2.88789C15.423 3.11689 15.3325 3.35289 15.2315 3.58289C13.336 3.24689 11.4795 3.24689 9.622 3.58289C9.521 3.35289 9.4305 3.11689 9.3295 2.88789C7.671 3.24689 6.062 3.74689 4.5365 4.36989C1.6895 8.01089 0.850503 11.5369 1.0335 15.0239C2.8855 16.5169 4.7095 17.3489 6.5055 17.9259C6.677 17.6159 6.838 17.2999 6.9885 16.9779C6.4115 16.7119 5.854 16.4259 5.3255 16.1109C5.231 15.8959 5.1505 15.6749 5.0805 15.4519C5.075 15.4389 5.0695 15.4259 5.064 15.4129C9.008 18.0279 14.992 18.0279 18.936 15.4129C18.9305 15.4259 18.925 15.4389 18.9195 15.4519C18.8495 15.6749 18.769 15.8959 18.6745 16.1109C18.146 16.4259 17.5885 16.7119 17.0115 16.9779C17.162 17.2999 17.323 17.6159 17.4945 17.9259C19.2905 17.3489 21.1145 16.5169 22.9665 15.0239C23.1965 10.8419 22.4735 7.42089 20.317 4.36989ZM8.021 12.6319C7.031 12.6319 6.22 11.8319 6.22 10.8419C6.22 9.85189 7.0255 9.05789 8.021 9.05789C9.0165 9.05789 9.827 9.85189 9.8215 10.8419C9.8215 11.8319 9.0165 12.6319 8.021 12.6319ZM15.979 12.6319C14.989 12.6319 14.178 11.8319 14.178 10.8419C14.178 9.85189 14.9835 9.05789 15.979 9.05789C16.9745 9.05789 17.785 9.85189 17.7795 10.8419C17.7795 11.8319 16.9745 12.6319 15.979 12.6319Z" fill="#5865F2"/>
    </svg>
)

const GoogleCalendarIcon = () => (
    <svg className="size-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8ZM12 15H17V20H12V15Z" fill="#4285F4"/>
        <path d="M10 13H5V18H10V13Z" fill="#34A853"/>
        <path d="M12 11H7V13H12V11Z" fill="#FBBC05"/>
        <path d="M17 11H12V13H17V11Z" fill="#EA4335"/>
    </svg>
)


const AbstractLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0L32 16L16 32L0 16L16 0Z" fill="black"/>
        <path d="M16 4L28 16L16 28L4 16L16 4Z" fill="white"/>
        <path d="M16 8L24 16L16 24L8 16L16 8Z" fill="black"/>
    </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<null | 'google' | 'github' | 'magiclink' | 'anonymous'>(null);


  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(provider);
    const user = provider === 'google' ? await signInWithGoogle() : await signInWithGitHub();
    if (user) {
      toast({ title: "Aight, you're in!", description: `Welcome, ${user.displayName || 'friend'}` });
      router.push('/dashboard');
    } else {
      toast({ variant: 'destructive', title: "Login failed", description: `Something went wrong logging in with ${provider}.` });
    }
    setIsLoading(null);
  };

  const handleAnonymousLogin = async () => {
    setIsLoading('anonymous');
    const user = await signInAnonymously();
    if (user) {
      toast({ title: "You're in demo mode!", description: "Go wild. Nothing you do here is saved." });
      router.push('/dashboard');
    } else {
      toast({ variant: 'destructive', title: "Login failed", description: "Couldn't sign you in as a guest. Bummer." });
    }
    setIsLoading(null);
  }

  const handleMagicLinkLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('magiclink');
    // Magic link logic would go here
    setTimeout(() => { // Simulate API call
      toast({ title: "Link sent!", description: "Check your email inbox for the login link." });
      setIsLoading(null);
    }, 1500)
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
          <header className="flex items-center gap-2 absolute top-8 left-8">
              <AbstractLogo />
              <h1 className="text-xl font-semibold">Opag</h1>
          </header>

          <main className="grid md:grid-cols-2 gap-16 items-center min-h-screen">
              <div className="flex flex-col gap-8 max-w-md mx-auto">
                  <div>
                      <h2 className="text-2xl font-semibold mb-4">Build AI agents that actually work.</h2>
                      <p className="text-muted-foreground">Sign in and let's get cookin'.</p>
                  </div>
                  <div className="flex flex-col gap-4">
                      <Button variant="default" className="w-full" onClick={() => handleOAuthLogin('github')} disabled={!!isLoading}>
                         {isLoading === 'github' ? 'Loading...' : <> <Github className="mr-2" /> Continue with GitHub</>}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => handleOAuthLogin('google')} disabled={!!isLoading}>
                         {isLoading === 'google' ? 'Loading...' : <><GoogleIcon /> <span className="ml-2">Continue with Google</span></>}
                      </Button>
                      <Button variant="secondary" className="w-full" onClick={handleAnonymousLogin} disabled={!!isLoading}>
                        {isLoading === 'anonymous' ? 'Loading...' : 'Try the Demo'}
                      </Button>
                  </div>
                  <div className="flex items-center gap-4">
                      <hr className="w-full" />
                      <span className="text-muted-foreground text-sm">or</span>
                      <hr className="w-full" />
                  </div>
                  <form className="flex flex-col gap-4" onSubmit={handleMagicLinkLogin}>
                      <Input type="email" placeholder="name@email.com" disabled={!!isLoading}/>
                      <Button variant="default" type="submit" disabled={!!isLoading}>
                        {isLoading === 'magiclink' ? 'Sending...' : 'Continue with Email'}
                      </Button>
                  </form>
              </div>
              <div className="hidden md:flex justify-center items-center">
                  <div className="aspect-square rounded-xl overflow-hidden shadow-2xl w-full max-w-md">
                      <Image 
                          src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxncmFkaWVudHxlbnwwfHx8fDE3NTMyODQ4NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                          alt="Abstract background"
                          data-ai-hint="abstract gradient"
                          width={800}
                          height={800}
                          className="w-full h-full object-cover"
                      />
                  </div>
              </div>
          </main>
      </div>
    </div>
  );
}
