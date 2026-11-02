"use client";

import { useState } from "react";
import { Camera, Check, FileText, Loader2, LogOut, MapPin, Pencil, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { getToken, logout } from "@/lib/auth";
import { useProfile } from "@/hooks/useProfile";
import { useUserPosts } from "@/hooks/useUserPosts";
import { calculateGamification } from "@/lib/gamification";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useDashboard } from "@/context/DashboardContext";
import { useToast } from "@/components/ui/use-toast";
import { useShell } from "@/components/shell/AppShell";
import { Avatar, Banner, Button, Card, Dialog, EmptyState, IconButton, ListGroup, ListRow, PageHeader, SectionTitle, Segmented, Skeleton, TextField } from "@/components/nn";
import { PostCard, PostCardSkeleton } from "@/components/features/feed/PostCard";
import type { Post } from "@/components/features/feed/Post/Post.types";
import NotificationSettings from "./NotificationSettings";
import { BriefSettings } from "../brief/BriefSettings";

export default function ProfileView() {
    const { user, loading, error, refetch } = useProfile();
    const { mode, setMode } = useTheme();
    const { location } = useDashboard();
    const { openAreaPicker } = useShell();
    const { toast } = useToast();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-40 w-full rounded-[20px]" />
                <Skeleton className="h-64 w-full rounded-[20px]" />
            </div>
        );
    }
    if (error || !user) return <Banner tone="warning" message={error ?? "Could not load your profile."} />;

    const stats = calculateGamification(user.reputation || 0);

    const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const form = new FormData();
        form.append("file", file);
        try {
            const res = await fetch(`${API_URL}/users/avatar`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: form });
            if (!res.ok) throw new Error();
            toast({ title: "Photo updated" });
            refetch();
        } catch {
            toast({ title: "Photo not updated", description: "Use a JPEG, PNG or WebP image up to 5 MB.", variant: "destructive" });
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const saveName = async () => {
        const next = name.trim();
        if (!next) return;
        try {
            await apiFetch("/users/me", { method: "PATCH", json: { name: next } });
            setEditing(false);
            toast({ title: "Name updated" });
            refetch();
        } catch (err) {
            toast({ title: "Name not updated", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <PageHeader title="Profile" />

            {/* Identity */}
            <Card className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                <label className="group relative cursor-pointer" aria-label="Change photo">
                    <Avatar src={user.avatar} name={user.name} size={88} />
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full border-[3px] border-surface bg-primary text-primary-foreground">
                        {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
                    </span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadAvatar} disabled={uploading} />
                </label>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                    {editing ? (
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <TextField label="Name" value={name} max={60} autoFocus onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()} />
                            </div>
                            <IconButton icon={Check} label="Save name" variant="filled" onClick={saveName} className="mb-1 text-primary" />
                            <IconButton icon={X} label="Cancel" variant="filled" onClick={() => setEditing(false)} className="mb-1" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1 sm:justify-start">
                            <h2 className="truncate text-[24px] font-bold">{user.name || "Neighbour"}</h2>
                            <IconButton
                                icon={Pencil}
                                label="Edit name"
                                size="sm"
                                onClick={() => {
                                    setName(user.name ?? "");
                                    setEditing(true);
                                }}
                            />
                        </div>
                    )}
                    <p className="text-[15px] text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Level {stats.level} · {stats.rank} · {user.reputation ?? 0} reputation
                    </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
                    <div className="rounded-[14px] bg-surface-2 px-4 py-3 text-center">
                        <p className="text-[22px] font-bold tabular-nums">{user._count?.posts ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div className="rounded-[14px] bg-surface-2 px-4 py-3 text-center">
                        <p className="text-[22px] font-bold tabular-nums">{user._count?.votes ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Helpful votes</p>
                    </div>
                </div>
            </Card>

            <section>
                <SectionTitle>Your area</SectionTitle>
                <ListGroup>
                    <ListRow title="Area you follow" icon={MapPin} iconColor="#34C759" value={location?.label ?? "Not chosen"} onClick={openAreaPicker} />
                </ListGroup>
            </section>

            <section>
                <SectionTitle>Alerts</SectionTitle>
                <NotificationSettings />
            </section>

            <section id="brief" className="scroll-mt-24">
                <SectionTitle>Local brief</SectionTitle>
                <BriefSettings />
            </section>

            <section>
                <SectionTitle>Appearance</SectionTitle>
                <Card padded={false} className="p-3">
                    <Segmented<ThemeMode>
                        label="Appearance"
                        value={mode}
                        onChange={setMode}
                        className="flex w-full"
                        options={[
                            { value: "light", label: "Light" },
                            { value: "dark", label: "Dark" },
                            { value: "system", label: "System" },
                        ]}
                    />
                </Card>
            </section>

            <section>
                <SectionTitle>Your posts</SectionTitle>
                <UserPosts userId={user.id} />
            </section>

            <section>
                <SectionTitle>Account</SectionTitle>
                <ListGroup>
                    <ListRow title="Privacy and terms" icon={FileText} iconColor="#8E8E93" href="/legal" />
                    <ListRow
                        title="Sign out"
                        icon={LogOut}
                        iconColor="#8E8E93"
                        onClick={() => {
                            logout();
                            window.location.href = "/login";
                        }}
                    />
                    <ListRow title="Delete my account" icon={Trash2} destructive onClick={() => setDeleteOpen(true)} />
                </ListGroup>
            </section>

            <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
        </div>
    );
}

function UserPosts({ userId }: { userId: string }) {
    const { posts, loading, error } = useUserPosts(userId);
    const [shown, setShown] = useState(5);
    if (loading)
        return (
            <div className="space-y-4">
                <PostCardSkeleton />
            </div>
        );
    if (error) return <Banner tone="warning" message="Could not load your posts." />;
    if (!posts.length)
        return (
            <Card>
                <EmptyState icon={FileText} title="No posts yet" body="Things you share with your neighbours will appear here." />
            </Card>
        );
    return (
        <div className="space-y-4">
            {(posts as Post[]).slice(0, shown).map((p) => (
                <PostCard key={p.id} post={p} compact />
            ))}
            {shown < posts.length ? (
                <Button variant="tinted" block onClick={() => setShown((n) => n + 5)}>
                    Show more
                </Button>
            ) : null}
        </div>
    );
}

function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const remove = async () => {
        setBusy(true);
        setErr(null);
        try {
            await apiFetch("/users/me", { method: "DELETE", json: { confirm: "DELETE" } });
            logout();
            window.location.href = "/";
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Your account could not be deleted.");
            setBusy(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Delete your account?"
            size="sm"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="plain" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" loading={busy} disabled={text !== "DELETE"} onClick={remove}>
                        Delete account
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <p className="text-[15px] text-muted-foreground">
                    Your posts (with their photos and locations), alerts, saved items and contact requests are deleted. Your comments on other posts stay, shown as “Deleted user”. This cannot be undone.
                </p>
                <TextField label="Type DELETE to confirm" value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="characters" autoComplete="off" />
                {err ? <Banner tone="danger" message={err} /> : null}
            </div>
        </Dialog>
    );
}
