"use client";

import { useEffect, useState } from "react";
import { Loader2, Ban, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getToken } from "@/lib/auth";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isBlocked: boolean;
    createdAt: string;
    _count: {
        posts: number;
        reports: number;
    };
}

export default function AdminUsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch users");
                const data = await res.json();
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast({ title: "Error", description: "Could not load users", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [toast]);

    const toggleBlock = async (userId: string) => {
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/block`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to update status");

            const updatedUser = await res.json();

            setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: updatedUser.isBlocked } : u));

            toast({
                title: updatedUser.isBlocked ? "User Blocked" : "User Unblocked",
                description: `User ${updatedUser.name} has been ${updatedUser.isBlocked ? 'blocked' : 'unblocked'}.`
            });
        } catch (error) {
            toast({ title: "Error", description: "Action failed", variant: "destructive" });
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-foreground" /></div>;

    return (
        <div>
            <h1 className="sr-only">User Management</h1>

            <div className="bg-surface rounded-[20px] shadow-[var(--shadow-card)] overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider bg-surface-2">
                            <th className="p-4 font-medium">User</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium text-right">Stats</th>
                            <th className="p-4 font-medium text-right">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <tr key={user.id} className="text-foreground hover:bg-surface-2 transition-colors">
                                <td className="p-4">
                                    <div className="font-medium text-foreground">{user.name || "Unnamed"}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </td>
                                <td className="p-4 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted-foreground'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-sm text-muted-foreground">
                                    <div>{user._count.posts} posts</div>
                                    <div>{user._count.reports} reports</div>
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`px-2 py-1 rounded text-xs ${user.isBlocked ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'}`}>
                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => toggleBlock(user.id)}
                                        className={`p-2 rounded-xl transition-colors ${user.isBlocked ? 'bg-success-soft text-success hover:brightness-95' : 'bg-danger-soft text-danger hover:brightness-95'}`}
                                        title={user.isBlocked ? "Unblock User" : "Block User"}
                                    >
                                        {user.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
