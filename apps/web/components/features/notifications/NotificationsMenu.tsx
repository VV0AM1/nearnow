"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellOff, GitCompare, Info, Mail, MapPin, MessageCircle, RefreshCw, Smile, AlertCircle, type LucideIcon } from "lucide-react";
import { useNotifications } from "../../../context/NotificationContext";
import { IconButton } from "@/components/nn";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
    POST_NEARBY: MapPin,
    ALERT: AlertCircle,
    COMMENT: MessageCircle,
    POST_UPDATE: RefreshCw,
    MATCH_SUGGESTION: GitCompare,
    CONTACT_REQUEST: Mail,
    WELCOME: Smile,
    INFO: Info,
};

/** Bell with unread badge and a popover list; Escape or an outside click closes it. */
export default function NotificationsMenu() {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={root} className="relative">
            <IconButton icon={Bell} label="Notifications" badge={unreadCount} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((v) => !v)} />
            {open ? (
                <div role="dialog" aria-label="Notifications" className="animate-in absolute right-0 top-12 z-[900] flex max-h-[min(480px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[18px] bg-elevated shadow-[var(--shadow-float)]">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <h2 className="text-[15px] font-semibold">Notifications</h2>
                        {unreadCount ? <span className="text-[13px] text-muted-foreground">{unreadCount} unread</span> : null}
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-1.5">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                                <BellOff className="size-7 text-subtle" aria-hidden />
                                <p className="text-[15px] font-semibold">No notifications yet</p>
                                <p className="text-[13px] text-muted-foreground">Turn on alerts in Profile to hear about posts in your area.</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const IconC = ICONS[n.type] ?? Bell;
                                return (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => {
                                            void markAsRead(n.id);
                                            setOpen(false);
                                            const postId = n.post?.id ?? n.postId;
                                            if (postId) router.push(`/post/${postId}`);
                                        }}
                                        className="flex w-full gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                                    >
                                        <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", n.read ? "bg-surface-2 text-muted-foreground" : "bg-primary-soft text-primary")}>
                                            <IconC className="size-4" aria-hidden />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={cn("block text-sm", n.read ? "font-normal" : "font-semibold")}>{n.title || "Notification"}</span>
                                            <span className="line-clamp-2 block text-[13px] text-muted-foreground">{n.message}</span>
                                            <span className="mt-0.5 block text-xs text-subtle">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                                        </span>
                                        {!n.read ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
