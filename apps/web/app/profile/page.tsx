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
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user, loading, error } = useProfile();
    const [activeTab, setActiveTab] = useState<'overview' | 'posts'>('overview');

    if (loading) return <div className="min-h-screen pt-24 text-center animate-pulse">Loading Profile...</div>;
    if (error) return <div className="min-h-screen pt-24 text-center text-red-500">{error}</div>;
    if (!user) return null;

    const stats = calculateGamification(user.reputation || 0);
    const badges = calculateBadges(user);

    return (
    return (
        <DashboardLayout>
            <div className="h-full flex flex-col overflow-hidden">
                {/* Header Actions - Compact */}
                <div className="flex-none px-6 py-4 flex items-center justify-between z-10 shrink-0">
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

                {/* Main Content Grid */}
                <div className="flex-1 overflow-hidden px-4 md:px-6 pb-6 pt-0">
                    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* LEFT COLUMN: IDENTITY & STATS */}
                        <div className="lg:col-span-5 xl:col-span-4 h-full overflow-y-auto custom-scrollbar rounded-3xl bg-secondary/10 border border-white/5 flex flex-col relative">
                            {/* Banner */}
                            <div className="h-32 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative shrink-0">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            </div>

                            {/* Avatar & Core Info */}
                            <div className="px-6 relative -mt-12 flex flex-col items-center text-center pb-6">
                                {/* Avatar */}
                                <div className="relative group mb-4">
                                    <div className="h-24 w-24 rounded-full border-4 border-background bg-zinc-900 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-300">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar.includes('http') ? user.avatar : user.avatar}
                                                alt={user.name || 'User'}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <UserIcon className="h-10 w-10 text-primary" />
                                        )}

                                        {/* Upload Overlay */}
                                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Edit</span>
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
                                    <div className="absolute bottom-0 right-0 bg-background rounded-full p-1.5 border border-white/10 shadow-lg text-yellow-500">
                                        {RANK_ICONS[stats.rank] || <Star className="h-3 w-3" />}
                                    </div>
                                </div>

                                <h1 className="text-xl font-black text-white">{user.name || 'Anonymous'}</h1>

                                <div className="flex items-center gap-2 mt-2 mb-6">
                                    <span className={`px-2 py-0.5 rounded-full border ${RANK_COLORS[stats.rank]} bg-opacity-10 text-[10px] font-bold uppercase`}>
                                        {stats.rank} Category
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                        <Shield className="h-3 w-3" /> Lvl {stats.level}
                                    </span>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                        <div className="text-lg font-bold text-white">{user.reputation || 0}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Reputation</div>
                                    </div>
                                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                        <div className="text-lg font-bold text-white max-w-full truncate">{stats.nextLevelPoints - (user.reputation || 0)}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">To Level {stats.level + 1}</div>
                                    </div>
                                </div>

                                {/* Gamification Progress */}
                                <div className="w-full p-4 rounded-xl bg-white/5 border border-white/5 mb-6 text-left shadow-inner">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-3 w-3 text-yellow-500" />
                                            <span className="font-bold text-xs">Progress</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-muted-foreground">{stats.progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-[1px]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all duration-1000 ease-out"
                                            style={{ width: `${stats.progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full">
                                    <Mail className="h-3 w-3" /> {user.email}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: CONTENT */}
                        <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col overflow-hidden rounded-3xl bg-secondary/5 border border-white/5 backdrop-blur-sm">
                            {/* Tabs Header */}
                            <div className="flex-none px-6 pt-6 border-b border-white/5">
                                <div className="flex gap-8">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={cn(
                                            "pb-4 text-sm font-bold transition-all relative uppercase tracking-wide",
                                            activeTab === 'overview' ? "text-white" : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        Overview
                                        {activeTab === 'overview' && <motion.div layoutId="activeProfileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('posts')}
                                        className={cn(
                                            "pb-4 text-sm font-bold transition-all relative uppercase tracking-wide",
                                            activeTab === 'posts' ? "text-white" : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        History
                                        {activeTab === 'posts' && <motion.div layoutId="activeProfileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {activeTab === 'overview' ? (
                                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                        {/* Badges Section */}
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                <Medal className="h-4 w-4 text-purple-400" />
                                                Achievements
                                            </h3>
                                            {badges.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {badges.map(badge => (
                                                        <div key={badge.id} className={`p-4 rounded-xl border bg-secondary/5 hover:bg-secondary/10 transition-all hover:scale-[1.02] flex flex-col items-center justify-center text-center gap-3 ${badge.color}`}>
                                                            <div className="p-3 rounded-full bg-background/50 shadow-inner">
                                                                <span className="text-2xl">{badge.icon}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white">{badge.label}</p>
                                                                <p className="text-[10px] text-muted-foreground leading-tight mt-1">{badge.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                                    <Medal className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm text-muted-foreground">Keep participating to earn badges!</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px bg-white/5 w-full" />

                                        {/* Settings Section */}
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-4">Notification Settings</h3>
                                            <NotificationSettings />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <UserPostHistory userId={user.id} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
