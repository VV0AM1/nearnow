"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Bookmark, CalendarDays, Check, CheckCheck, Flag, Map as MapIcon, MapPin, Share2, ThumbsUp, Trash2, UserCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CommentSection from "@/components/features/feed/CommentSection";
import ReportModal from "@/components/features/reports/ReportModal";
import { CategoryBadge, ITEM_TYPE_LABEL, TrustLine } from "@/components/features/feed/PostStatus";
import { usePostInteractions } from "@/components/features/feed/Post/usePostInteractions";
import type { Post } from "@/components/features/feed/Post/Post.types";
import { apiFetch, mediaUrl } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Banner, Button, Card, Dialog, EmptyState, IconButton, Skeleton } from "@/components/nn";
import { cn } from "@/lib/utils";

type Confirmation = "STILL_HAPPENING" | "NO_LONGER_PRESENT";

/** Posts this browser said it can't confirm; the question is not shown again. */
const CANT_KEY = "nn-cant-confirm";
function readCant(): string[] {
    try {
        const v = JSON.parse(localStorage.getItem(CANT_KEY) || "[]");
        return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    } catch {
        return [];
    }
}
function addCant(id: string) {
    try {
        localStorage.setItem(CANT_KEY, JSON.stringify([id, ...readCant().filter((x) => x !== id)].slice(0, 200)));
    } catch {
        // storage unavailable: only hidden for this visit
    }
}

function Meta({ icon: IconC, children }: { icon: typeof MapPin; children: React.ReactNode }) {
    return (
        <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
            <IconC className="size-4 shrink-0" aria-hidden />
            <span>{children}</span>
        </p>
    );
}

function PostDetail({ initial }: { initial: Post }) {
    const router = useRouter();
    const { toast } = useToast();
    const [post, setPost] = useState(initial);
    const { likes, voted, saved, handleVote, handleSave } = usePostInteractions(post);
    const [reporting, setReporting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    // Impact receipt: real counts returned by the server after an answer.
    const [receipt, setReceipt] = useState<string | null>(null);
    const [skipped, setSkipped] = useState(false);
    useEffect(() => setSkipped(readCant().includes(initial.id)), [initial.id]);
    const [resolveOpen, setResolveOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const image = mediaUrl(post.imageUrl);
    const isAuthor = !!post.viewer?.isAuthor;
    const active = post.status === "ACTIVE";
    const answer = post.viewer?.confirmation ?? null;

    const confirm = async (state: Confirmation) => {
        if (confirming) return;
        setConfirming(true);
        try {
            const res = await apiFetch<{ confirmations: Post["confirmations"]; verificationStatus: Post["verificationStatus"] }>(`/posts/${post.id}/confirm`, { method: "POST", json: { state } });
            setPost((p) => ({
                ...p,
                confirmations: res.confirmations,
                verificationStatus: res.verificationStatus,
                isStale: state === "STILL_HAPPENING" ? false : p.isStale,
                lastConfirmedAt: state === "STILL_HAPPENING" ? new Date().toISOString() : p.lastConfirmedAt,
                viewer: p.viewer ? { ...p.viewer, confirmation: state } : p.viewer,
            }));
            const n = state === "STILL_HAPPENING" ? res.confirmations?.stillHappening ?? 0 : res.confirmations?.noLongerPresent ?? 0;
            setReceipt(`Update recorded. “${state === "STILL_HAPPENING" ? "Still happening" : "No longer happening"}” answers in the last 24 hours: ${n}.`);
        } catch (e) {
            toast({ title: "Answer not saved", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
        } finally {
            setConfirming(false);
        }
    };

    const resolve = async () => {
        setBusy(true);
        try {
            setPost(await apiFetch<Post>(`/posts/${post.id}/resolve`, { method: "PATCH", json: {} }));
            setResolveOpen(false);
        } catch (e) {
            toast({ title: "Not updated", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        try {
            await apiFetch(`/posts/${post.id}`, { method: "DELETE" });
            toast({ title: "Post deleted" });
            router.push("/");
        } catch (e) {
            toast({ title: "Not deleted", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
            setBusy(false);
        }
    };

    const share = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: `NearNow: ${post.title}`, url });
                return;
            } catch {
                // fall back to copying
            }
        }
        await navigator.clipboard.writeText(url).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const place = [post.neighborhood?.name, post.distanceKm !== undefined ? `${post.distanceKm < 1 ? post.distanceKm.toFixed(1) : Math.round(post.distanceKm)} km away` : null, post.isApproximateLocation ? "approximate location" : null]
        .filter(Boolean)
        .join(" · ");

    return (
        <article className="mx-auto max-w-2xl space-y-5">
            <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[15px] font-medium text-primary hover:underline">
                <ArrowLeft className="size-4" aria-hidden /> Back
            </button>

            {post.status === "REMOVED" ? <Banner tone="danger" message="This post was removed by a moderator." /> : null}

            <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CategoryBadge category={post.category} />
                    {post.lostFound ? (
                        <span className="text-[13px] font-semibold text-muted-foreground">
                            {post.lostFound.direction === "LOST" ? "Lost" : "Found"} · {ITEM_TYPE_LABEL[post.lostFound.itemType] ?? post.lostFound.itemType}
                        </span>
                    ) : null}
                </div>
                <h1 className="text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]">{post.title}</h1>
                <TrustLine post={post} />
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="max-h-[520px] w-full rounded-[16px] bg-surface-2 object-cover" />
                ) : null}
                {post.content ? <p className="whitespace-pre-line break-words text-[17px] leading-relaxed">{post.content}</p> : null}
                <div className="space-y-1.5">
                    {place ? <Meta icon={MapPin}>{place}</Meta> : null}
                    {post.lostFound?.occurredFrom && post.lostFound.occurredTo ? (
                        <Meta icon={CalendarDays}>
                            Between {format(new Date(post.lostFound.occurredFrom), "d MMM, HH:mm")} and {format(new Date(post.lostFound.occurredTo), "d MMM, HH:mm")}
                        </Meta>
                    ) : null}
                    {post.author ? <Meta icon={UserCircle}>Posted by {post.author.name}</Meta> : null}
                </div>
                {post.resolvedAt ? <Banner tone="success" icon={CheckCheck} message={`Marked resolved${post.resolutionNote ? ` — ${post.resolutionNote}` : ""}`} /> : null}

                <div className="-mx-2 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                    <Button variant={voted ? "tinted" : "plain"} size="sm" icon={ThumbsUp} onClick={handleVote} aria-pressed={voted}>
                        Helpful · {likes}
                    </Button>
                    <Button variant={saved ? "tinted" : "plain"} size="sm" icon={Bookmark} onClick={handleSave} aria-pressed={saved}>
                        {saved ? "Saved" : "Save"}
                    </Button>
                    <Button variant="plain" size="sm" icon={copied ? Check : Share2} onClick={share}>
                        {copied ? "Link copied" : "Share"}
                    </Button>
                    <Button variant="plain" size="sm" icon={MapIcon} href={`/map?focus=${post.id}&lat=${post.latitude}&lng=${post.longitude}`}>
                        Map
                    </Button>
                    {!isAuthor ? <IconButton icon={Flag} label="Report" size="sm" className="ml-auto" onClick={() => setReporting(true)} /> : null}
                </div>
            </Card>

            {active && !isAuthor && post.category !== "LOST_FOUND" && (!skipped || answer) ? (
                <Card className="space-y-3">
                    <h2 className="text-[17px] font-semibold">Is this still happening?</h2>
                    <p className="text-[13px] text-muted-foreground">Your answer updates how fresh this post looks to everyone nearby.</p>
                    <div className="grid grid-cols-2 gap-2">
                        {(
                            [
                                ["STILL_HAPPENING", "Still happening"],
                                ["NO_LONGER_PRESENT", "No longer there"],
                            ] as const
                        ).map(([state, label]) => (
                            <Button key={state} variant={answer === state ? "filled" : "tinted"} icon={answer === state ? Check : undefined} disabled={confirming} onClick={() => confirm(state)}>
                                {label}
                            </Button>
                        ))}
                    </div>
                    {!answer ? (
                        <Button
                            variant="plain"
                            size="sm"
                            onClick={() => {
                                addCant(post.id);
                                setSkipped(true);
                                toast({ title: "No problem", description: "Only answer when you have seen it yourself." });
                            }}
                        >
                            I can't confirm
                        </Button>
                    ) : null}
                    {receipt ? (
                        <p role="status" className="flex items-start gap-2 rounded-[12px] bg-success-soft p-3 text-[15px]">
                            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                            {receipt}
                        </p>
                    ) : null}
                </Card>
            ) : null}

            {isAuthor ? (
                <Card className="flex flex-wrap gap-2">
                    {post.status === "ACTIVE" || post.status === "EXPIRED" ? (
                        <Button variant="tinted" icon={CheckCheck} onClick={() => setResolveOpen(true)}>
                            {post.lostFound ? "Mark as returned" : "Mark as resolved"}
                        </Button>
                    ) : null}
                    <Button variant="destructiveTinted" icon={Trash2} onClick={() => setDeleteOpen(true)}>
                        Delete post
                    </Button>
                </Card>
            ) : null}

            <Card>
                <CommentSection postId={post.id} canComment={post.status !== "REMOVED"} />
            </Card>

            <ReportModal isOpen={reporting} onClose={() => setReporting(false)} postId={post.id} />
            <Dialog
                open={resolveOpen}
                onClose={() => setResolveOpen(false)}
                title={post.lostFound ? "Mark as returned?" : "Mark as resolved?"}
                size="sm"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="plain" onClick={() => setResolveOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={resolve} loading={busy}>
                            Confirm
                        </Button>
                    </div>
                }
            >
                <p className="text-[15px] text-muted-foreground">The post stays visible with a “Resolved” label, so neighbours know it is over.</p>
            </Dialog>
            <Dialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete this post?"
                size="sm"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="plain" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={remove} loading={busy}>
                            Delete
                        </Button>
                    </div>
                }
            >
                <p className="text-[15px] text-muted-foreground">The post, its photo and its location are removed. This cannot be undone.</p>
            </Dialog>
        </article>
    );
}

export default function PostPage(props: { params: Promise<{ id: string }> }) {
    const { id } = use(props.params);
    const [post, setPost] = useState<Post | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

    const load = useCallback(() => {
        setState("loading");
        apiFetch<Post>(`/posts/${encodeURIComponent(id)}`)
            .then((p) => {
                setPost(p);
                setState("ready");
            })
            .catch((e: Error) => setState(/404|not found/i.test(e.message) ? "missing" : "error"));
    }, [id]);

    useEffect(load, [load]);

    return (
        <DashboardLayout>
            {state === "loading" ? (
                <div className="mx-auto max-w-2xl space-y-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-72 w-full rounded-[20px]" />
                    <Skeleton className="h-40 w-full rounded-[20px]" />
                </div>
            ) : state === "ready" && post ? (
                <PostDetail initial={post} />
            ) : (
                <Card className="mx-auto max-w-lg">
                    <EmptyState
                        icon={MapPin}
                        tone={state === "error" ? "warning" : "accent"}
                        title={state === "missing" ? "This post isn't available" : "Couldn't load this post"}
                        body={state === "missing" ? "It may have been deleted or removed." : "Check your connection and try again."}
                        action={
                            <>
                                {state === "error" ? (
                                    <Button variant="tinted" onClick={load}>
                                        Try again
                                    </Button>
                                ) : null}
                                <Link href="/" className={cn("inline-flex h-11 items-center rounded-xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground")}>
                                    Go to the feed
                                </Link>
                            </>
                        }
                    />
                </Card>
            )}
        </DashboardLayout>
    );
}
