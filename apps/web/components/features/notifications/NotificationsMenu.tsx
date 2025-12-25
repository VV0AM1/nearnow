"use client";

import { useState } from "react";
import { useNotifications } from "../../../hooks/useNotifications";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function NotificationsMenu() {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-secondary/20 transition-colors"
                title="Notifications"
            >
                <Bell className="h-6 w-6 text-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border border-background animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-[2999]" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl z-[3000] overflow-hidden flex flex-col max-h-[400px]"
                        >
                            <div className="p-3 border-b border-border font-semibold text-sm bg-muted/50">
                                Notifications
                            </div>

                            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                markAsRead(n.id);
                                                if (n.post) window.location.href = `/post/${n.post.id}`;
                                            }}
                                            className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${n.read ? 'opacity-60 hover:bg-secondary/10' : 'bg-primary/10 hover:bg-primary/20 border-l-2 border-primary'
                                                }`}
                                        >
                                            <p className="font-medium line-clamp-1">
                                                {n.type === 'POST_NEARBY' ? "New Activity Nearby" : "Reply to your post"}
                                            </p>
                                            {n.post && <p className="text-xs text-muted-foreground line-clamp-1">{n.post.title}</p>}
                                            <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                                                {new Date(n.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
