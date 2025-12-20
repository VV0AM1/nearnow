"use client";

import { User as UserIcon, LogOut, Mail, Hash, ChevronLeft, ChevronRight } from "lucide-react";
import { logout } from "../../lib/auth";
import Button from "@/components/common/button/Button";
import { useProfile } from "@/hooks/useProfile";
import NotificationSettings from "@/components/features/profile/NotificationSettings";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FeedList from "@/components/features/feed/FeedList";
import FeedListSkeleton from "@/components/ui/loading/FeedListSkeleton";
import { useUserPosts } from "@/hooks/useUserPosts";
import { calculateGamification, calculateBadges, RANK_ICONS, RANK_COLORS } from "@/lib/gamification";
import { useState } from "react";

export default function ProfilePage() {
    const { user, loading, error } = useProfile();

    if (loading) return <div className="min-h-screen pt-24 text-center">Loading...</div>;
    if (error) return <div className="min-h-screen pt-24 text-center text-red-500">{error}</div>;
    if (!user) return null;

    const stats = calculateGamification(user.reputation || 0);
    const badges = calculateBadges(user);

    return (
        <DashboardLayout>
            <div className="pt-8 pb-12 max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <UserIcon className="h-8 w-8 text-primary" />
                    My Profile
                </h1>

                <div className="glass-card p-8 border border-border shadow-xl space-y-6">
                    <div className="flex items-center gap-4 py-4 border-b border-border/50">
                        <div className="relative group">
                            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-primary transition-all cursor-pointer">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar.startsWith('http') ? user.avatar : `http://127.0.0.1:3002${user.avatar}`}
                                        alt={user.name || 'User'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserIcon className="h-8 w-8 text-primary" />
                                )}

                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-xs text-white font-medium">Edit</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            // Optimistic update could go here, but simple reload is safer
                                            try {
                                                const token = document.cookie.split('; ').find(row => row.startsWith('nearnow_token='))?.split('=')[1];
                                                const res = await fetch('http://127.0.0.1:3002/users/avatar', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: formData
                                                });

                                                if (res.ok) {
                                                    window.location.reload();
                                                }
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{user.name || 'Neighbor'}</h2>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                {RANK_ICONS[stats.rank]} {stats.rank} League • Lvl {stats.level}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                        </div>

                        {/* Gamification Card */}
                        <div className={`p-4 rounded-xl border ${RANK_COLORS[stats.rank]}`}>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{RANK_ICONS[stats.rank]}</span>
                                    <div>
                                        <p className="font-bold uppercase tracking-wider text-xs opacity-80">{stats.rank} League</p>
                                        <p className="text-2xl font-bold">{user.reputation || 0} <span className="text-sm font-normal opacity-70">Points</span></p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">Level {stats.level}</p>
                                    <p className="text-xs opacity-70">Next: {stats.nextLevelPoints} pts</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-current transition-all duration-500 ease-out"
                                    style={{ width: `${stats.progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] mt-1.5 opacity-60 text-center">
                                {stats.progress.toFixed(0)}% to Level {stats.level + 1}
                            </p>
                        </div>

                        {/* Badges Section */}
                        {badges.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {badges.map(badge => (
                                    <div key={badge.id} className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 ${badge.color}`}>
                                        <span className="text-2xl">{badge.icon}</span>
                                        <div>
                                            <p className="text-xs font-bold">{badge.label}</p>
                                            <p className="text-[10px] opacity-80 leading-tight">{badge.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-6">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                logout();
                                window.location.href = '/login';
                            }}
                            className="w-full justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* Post History Section */}
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">Post History</h3>
                    <UserPostHistory userId={user.id} />
                </div>

                <div className="mt-8">
                    <NotificationSettings />
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
    if (error) return <div className="text-red-500">Failed to load history</div>;
    if (posts.length === 0) return <div className="text-muted-foreground">No posts yet.</div>;

    const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
    const paginatedPosts = posts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <FeedList posts={paginatedPosts} onPostClick={() => { }} />

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Page</span>
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={page}
                            onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                            className="w-12 h-8 rounded-md border border-border bg-background text-center text-sm"
                        />
                        <span className="text-sm text-muted-foreground">of {totalPages}</span>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
