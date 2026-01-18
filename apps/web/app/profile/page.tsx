"use client";

import { User as UserIcon, LogOut, Mail, ChevronLeft, Trophy, Medal, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/config";
import { logout } from "../../lib/auth";
import { useProfile } from "@/hooks/useProfile";
import NotificationSettings from "@/components/features/profile/NotificationSettings";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FeedList from "@/components/features/feed/FeedList";
import FeedListSkeleton from "@/components/ui/loading/FeedListSkeleton";
import { useUserPosts } from "@/hooks/useUserPosts";
import { calculateGamification, calculateBadges, RANK_ICONS, RANK_COLORS } from "@/lib/gamification";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, loading, error } = useProfile();
    const [activeTab, setActiveTab] = useState<'overview' | 'posts'>('overview');

    if (loading) return <div className="min-h-screen pt-24 text-center animate-pulse">Loading Profile...</div>;
    if (error) return <div className="min-h-screen pt-24 text-center text-red-500">{error}</div>;
    if (!user) return null;

    const stats = calculateGamification(user.reputation || 0);
    const badges = calculateBadges(user);

    return (
        <DashboardLayout>
            <div className="pb-20 max-w-4xl mx-auto">
                {/* Header / Nav */}
                <div className="pt-8 px-4 mb-6 flex items-center justify-between">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white" onClick={() => window.location.href = '/'}>
                        <ChevronLeft className="h-4 w-4" />
                        Back Home
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            logout();
                            window.location.href = '/login';
                        }}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>

                {/* Identity Card */}
                <div className="relative mx-4 mb-8">
                    {/* Banner */}
                    <div className="h-48 w-full rounded-t-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    </div>

                    {/* Glass Content */}
                    <div className="relative -mt-12 bg-secondary/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="h-28 w-28 rounded-full border-4 border-background bg-zinc-900 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-300">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar.includes('http') ? user.avatar : user.avatar}
                                            alt={user.name || 'User'}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="h-12 w-12 text-primary" />
                                    )}

                                    {/* Upload Overlay */}
                                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                                        <span className="text-xs text-white font-bold uppercase tracking-wider">Change</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                try {
                                                    const token = document.cookie.split('; ').find(row => row.startsWith('nearnow_token='))?.split('=')[1];
                                                    await fetch(`${API_URL}/users/avatar`, {
                                                        method: 'POST',
                                                        headers: { 'Authorization': `Bearer ${token}` },
                                                        body: formData
                                                    });
                                                    window.location.reload();
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 border border-white/10 shadow-lg text-yellow-500">
                                    {RANK_ICONS[stats.rank] || <Star className="h-4 w-4" />}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 space-y-2 mb-2">
                                <h1 className="text-3xl font-black text-white tracking-tight">{user.name || 'Anonymous Neighbor'}</h1>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className={`px-2 py-0.5 rounded-full border ${RANK_COLORS[stats.rank]} bg-opacity-10 text-xs font-bold uppercase`}>
                                        {stats.rank} Category
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Shield className="h-3 w-3" />
                                        Level {stats.level}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {user.email}
                                    </span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="hidden md:flex gap-6 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-white">{user.reputation || 0}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Reputation</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{stats.nextLevelPoints - (user.reputation || 0)}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">To Next Lvl</div>
                                </div>
                            </div>
                        </div>

                        {/* Gamification Progress */}
                        <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    <span className="font-bold text-sm">Level Progress</span>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground">{stats.progress.toFixed(0)}%</span>
                            </div>
                            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-all duration-1000 ease-out"
                                    style={{ width: `${stats.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mx-4 mb-6 flex gap-6 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "pb-4 text-sm font-medium transition-colors relative",
                            activeTab === 'overview' ? "text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Overview
                        {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={cn(
                            "pb-4 text-sm font-medium transition-colors relative",
                            activeTab === 'posts' ? "text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Post History
                        {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                    </button>
                </div>

                {/* Content */}
                <div className="mx-4">
                    {activeTab === 'overview' ? (
                        <div className="space-y-6">
                            {/* Badges */}
                            {badges.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {badges.map(badge => (
                                        <div key={badge.id} className={`p-4 rounded-xl border bg-secondary/5 hover:bg-secondary/10 transition-colors flex flex-col items-center justify-center text-center gap-3 ${badge.color}`}>
                                            <div className="p-3 rounded-full bg-background/50 shadow-inner">
                                                <span className="text-2xl">{badge.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{badge.label}</p>
                                                <p className="text-xs text-muted-foreground">{badge.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                                    <Medal className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                    <p className="text-muted-foreground">Keep participating to earn badges!</p>
                                </div>
                            )}

                            {/* Notifications */}
                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
                                <NotificationSettings />
                            </div>
                        </div>
                    ) : (
                        <UserPostHistory userId={user.id} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function UserPostHistory({ userId }: { userId: string }) {
    const { posts, loading, error } = useUserPosts(userId);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    if (loading) return <FeedListSkeleton />;
    if (error) return <div className="text-red-500 p-4 border border-red-500/20 rounded-xl bg-red-500/10">Failed to load history</div>;
    if (posts.length === 0) return <div className="text-muted-foreground text-center py-12">No posts yet.</div>;

    const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
    const paginatedPosts = posts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <FeedList
                posts={paginatedPosts}
                onPostClick={() => { }}
                onNext={() => handlePageChange(page + 1)}
                onPrev={() => handlePageChange(page - 1)}
                hasMore={page < totalPages}
                hasPrev={page > 1}
                loading={loading}
                page={page}
            />
        </div>
    );
}
