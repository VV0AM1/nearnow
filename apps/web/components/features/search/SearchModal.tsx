"use client";

import { useEffect, useState, useRef } from "react";
import { Search, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeed } from "../../../hooks/useFeed";
import { useDashboard } from "../../../context/DashboardContext";
import { useRouter } from "next/navigation";
import Skeleton from "../../ui/loading/Skeleton";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const router = useRouter();


    // Search the chosen area on the server (no default city).
    const { location: feedLoc } = useDashboard();

    const [debounced, setDebounced] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setDebounced(query.trim()), 300);
        return () => clearTimeout(id);
    }, [query]);
    // 50 km is the largest radius the API accepts.
    const { posts, loading } = useFeed(debounced ? feedLoc : null, 50, ["ALL"], [], 5, debounced);

    const filteredPosts = debounced ? posts.slice(0, 5) : [];

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -20 }}
                    className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden"
                >
                    <div className="flex items-center px-4 py-3 border-b border-border gap-3">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type to search alerts, neighborhoods..."
                            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground/50"
                        />
                        <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary/20">
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : query === "" ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Start typing to search...</p>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No results found for "{query}"
                            </div>
                        ) : (
                            <div className="py-2">
                                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"> Alerts </div>
                                {filteredPosts.map(post => (
                                    <button
                                        key={post.id}
                                        onClick={() => {
                                            router.push(`/post/${post.id}`);
                                            onClose();
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-secondary/10 flex items-start gap-4 transition-colors"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-1">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{post.title}</h4>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{post.content}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-2 bg-secondary/5 border-t border-border text-xs text-muted-foreground flex justify-between">
                        <span>Search nearby alerts</span>
                        <span className="flex items-center gap-1">Press <kbd className="bg-background border border-border px-1.5 rounded text-[10px] font-mono">ESC</kbd> to close</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
