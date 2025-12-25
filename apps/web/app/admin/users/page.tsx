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

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">User Management</h1>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-zinc-500 text-xs uppercase tracking-wider bg-black/20">
                            <th className="p-4 font-medium">User</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium text-right">Stats</th>
                            <th className="p-4 font-medium text-right">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((user) => (
                            <tr key={user.id} className="text-zinc-300 hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="font-medium text-white">{user.name || "Unnamed"}</div>
                                    <div className="text-sm text-zinc-500">{user.email}</div>
                                </td>
                                <td className="p-4 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-sm text-zinc-500">
                                    <div>{user._count.posts} posts</div>
                                    <div>{user._count.reports} reports</div>
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`px-2 py-1 rounded text-xs ${user.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => toggleBlock(user.id)}
                                        className={`p-2 rounded-lg transition-colors ${user.isBlocked ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
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
