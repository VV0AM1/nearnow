"use client";

import { useState } from "react";
import { Bookmark, ExternalLink, MapPin, Clock } from "lucide-react";
import styles from "./Saved.module.css";
import { cn } from "@/lib/utils";

// Mock Data for visualization if actual data is empty/loading
// In real app, replace with useFetch or props
const SAVED_ITEMS = [
    {
        id: 1,
        title: "Hidden rooftop garden in downtown",
        category: "Discovery",
        image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=1000",
        location: "Downtown • 0.5km",
        time: "Saved 2 days ago"
    },
    {
        id: 2,
        title: "Best late-night ramen spot",
        category: "Food",
        image: "https://images.unsplash.com/photo-1569937745351-1a021980f77a?auto=format&fit=crop&q=80&w=1000",
        location: "Little Tokyo • 2km",
        time: "Saved 5 days ago"
    },
    {
        id: 3,
        title: "Street Art Exhibition: 'Neon Dreams'",
        category: "Event",
        image: "https://images.unsplash.com/photo-1549887534-1541e932b29e?auto=format&fit=crop&q=80&w=1000",
        location: "Arts District • 3.2km",
        time: "Saved 1 week ago"
    },
    {
        id: 4,
        title: "Quiet study spot with great wifi",
        category: "Place",
        image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&q=80&w=1000",
        location: "Westside • 5km",
        time: "Saved 2 weeks ago"
    },
    {
        id: 5,
        title: "Sunset view point at Griffith",
        category: "View",
        image: "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?auto=format&fit=crop&q=80&w=1000",
        location: "Griffith Park • 8km",
        time: "Saved 3 weeks ago"
    },
];

export default function SavedPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Saved Collection</h1>
                <p className={styles.subtitle}>Your personally curated list of favorite spots and events.</p>
            </div>

            <div className={styles.galleryGrid}>
                {SAVED_ITEMS.map((item) => (
                    <div key={item.id} className={styles.bookmarkCard}>
                        {/* Background Image */}
                        <img src={item.image} alt={item.title} className={styles.cardImage} />

                        {/* Gradient Overlay */}
                        <div className={styles.overlay} />

                        {/* Top Action */}
                        <button className={styles.actionButton}>
                            <ExternalLink className="h-4 w-4" />
                        </button>

                        {/* Content */}
                        <div className={styles.cardContent}>
                            <span className={styles.categoryTag}>{item.category}</span>
                            <h3 className={styles.cardTitle}>{item.title}</h3>

                            <div className={styles.cardMeta}>
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.location}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.time}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Placeholder (Optional, triggers a search or map) */}
                <div className="group relative aspect-[4/5] rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 flex flex-col items-center justify-center text-muted-foreground hover:text-white transition-all cursor-pointer bg-white/5 hover:bg-white/10">
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Bookmark className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-sm">Discover More</span>
                </div>
            </div>
        </div>
    );
}
