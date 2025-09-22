
'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, type User } from "firebase/auth";
import { HardDrive, Lock, Shield, Users, User as UserIcon } from "lucide-react";


type Member = {
    id: string;
    name: string | null;
    email: string | null;
    photoURL?: string | null;
    role: 'Admin' | 'Member';
    status: 'Joined' | 'Pending';
}

const InviteMemberDialog = ({ onInvite }: { onInvite: (email: string, role: 'Admin' | 'Member') => void }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'Admin' | 'Member'>('Member');
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleInvite = () => {
        if (!email) {
            toast({ variant: 'destructive', title: "Email is required" });
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            toast({ variant: 'destructive', title: "Invalid email address" });
            return;
        }
        onInvite(email, role);
        toast({ title: "Invitation Sent!", description: `${email} has been invited to join.` });
        setIsOpen(false);
        setEmail('');
        setRole('Member');
    }
    
    const roleDescriptions = {
        Member: "Can create and run workflows, but cannot manage members or organization settings.",
        Admin: "Full access to manage the organization, including members, settings, and billing."
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Invite Member</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite a new member</DialogTitle>
                    <DialogDescription>
                        Enter the email of the person you want to invite and choose their role.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={(value) => setRole(value as 'Admin' | 'Member')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Member">Member</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground px-1">{roleDescriptions[role]}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleInvite}>Send Invitation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ProfileSettings = ({ user, isLoading }: { user: User | null, isLoading: boolean}) => {
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

     useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        setIsUpdatingProfile(true);
        try {
            await updateProfile(currentUser, { displayName });
            toast({
                title: "Profile Updated",
                description: "Your name has been updated successfully.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your name and email address.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} disabled />
                        </div>
                         <Button type="submit" disabled={isUpdatingProfile}>
                            {isUpdatingProfile ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

const SecuritySettings = () => {
    const { toast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) return;

        if (!currentPassword || !newPassword) {
            toast({ variant: 'destructive', title: "Missing fields", description: "Please fill in both password fields."});
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            toast({
                title: "Password Updated",
                description: "Your password has been changed successfully.",
            });
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any)             {
             toast({
                variant: "destructive",
                title: "Error updating password",
                description: error.code === 'auth/wrong-password' ? 'The current password you entered is incorrect.' : error.message,
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={isUpdatingPassword}>
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

const OrganizationSettings = ({ user, isLoading } : { user: User | null, isLoading: boolean}) => {
    const { toast } = useToast();
    const [orgName, setOrgName] = useState("");
    const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

    useEffect(() => {
        if (user?.displayName) {
            const firstName = user.displayName.split(' ')[0];
            const possessiveName = firstName.length > 10 ? "My" : `${firstName}'s`;
            setOrgName(`${possessiveName} Opag Studio`);
        } else if (!isLoading) {
            setOrgName("My Opag Studio");
        }
    }, [user, isLoading]);
    
     const handleUpdateOrg = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingOrg(true);
        // In a real app, this would save to a database.
        // For now, we simulate the save and show a toast.
        setTimeout(() => {
            toast({
                title: "Organization Updated",
                description: `Organization name changed to "${orgName}".`
            });
            setIsUpdatingOrg(false);
        }, 1000);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>Change your organization's name.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                     <div className="space-y-4">
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-20" />
                    </div>
                 ) : (
                    <form onSubmit={handleUpdateOrg} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="org-name">Name</Label>
                            <Input id="org-name" value={orgName} onChange={e => setOrgName(e.target.value)} />
                        </div>
                        <Button type="submit" disabled={isUpdatingOrg}>
                            {isUpdatingOrg ? "Saving..." : "Save"}
                        </Button>
                    </form>
                 )}
            </CardContent>
        </Card>
    );
}

const MemberSettings = ({ user, isLoading }: { user: User | null, isLoading: boolean}) => {
    const { toast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    
    const getInitials = (name: string | null | undefined) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

     useEffect(() => {
        if (user) {
             const member: Member = {
                id: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: 'Admin',
                status: 'Joined',
            };
            setMembers([member]);
        }
    }, [user]);

     const handleInviteMember = (email: string, role: 'Admin' | 'Member') => {
        const newMember: Member = {
            id: `pending_${new Date().getTime()}`,
            name: 'Invited User',
            email: email,
            role: role,
            status: 'Pending',
        }
        setMembers(prev => [...prev, newMember]);
    }

    const handleRemoveMember = (memberId: string) => {
        if (user && memberId === user.uid) {
            toast({ variant: "destructive", title: "Cannot remove yourself", description: "You cannot remove yourself from the organization."});
            return;
        }
        setMembers(prev => prev.filter(m => m.id !== memberId));
        toast({ title: "Member Removed" });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Members</CardTitle>
                <CardDescription>Invite and manage members of your workspace.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4">
                    <InviteMemberDialog onInvite={handleInviteMember} />
                </div>
                 <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-4">
                                         <div className="flex items-center gap-4">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : members.length > 0 ? (
                                members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarImage src={member.photoURL || undefined} />
                                                    <AvatarFallback>{getInitials(member.name || member.email)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'} className={member.role === 'Admin' ? '' : 'bg-muted text-muted-foreground'}>
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.status === 'Joined' ? 'default' : 'outline'} className={member.status === 'Joined' ? 'bg-green-100 text-green-800' : ''}>
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                disabled={user?.uid === member.id}
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-red-500 hover:text-red-600 disabled:text-muted-foreground"
                                            >
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No members found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

const navItems = [
    { id: 'profile', label: 'Profile', icon: UserIcon, group: 'personal' },
    { id: 'security', label: 'Security', icon: Lock, group: 'personal' },
    { id: 'organization', label: 'Organization', icon: HardDrive, group: 'organization' },
    { id: 'members', label: 'Members', icon: Users, group: 'organization' },
]

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(currentUser => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings user={user} isLoading={isLoading} />;
            case 'security':
                return <SecuritySettings />;
            case 'organization':
                return <OrganizationSettings user={user} isLoading={isLoading} />;
            case 'members':
                return <MemberSettings user={user} isLoading={isLoading} />;
            default:
                return null;
        }
    }
    
    return (
        <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-10 items-start">
            <nav className="hidden md:flex flex-col gap-4 text-sm text-muted-foreground sticky top-20">
                <div>
                    <h3 className="font-semibold text-primary mb-2">Personal</h3>
                    {navItems.filter(i => i.group === 'personal').map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary w-full text-left",
                                activeTab === item.id && "bg-muted text-primary"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    ))}
                </div>
                 <div>
                    <h3 className="font-semibold text-primary mb-2">Organization</h3>
                    {navItems.filter(i => i.group === 'organization').map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary w-full text-left",
                                activeTab === item.id && "bg-muted text-primary"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>
            <main>
                <div className="md:hidden mb-6">
                    <Select value={activeTab} onValueChange={setActiveTab}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a setting" />
                        </SelectTrigger>
                        <SelectContent>
                             {navItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}
