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
        <div className={cn("flex-1 p-8 overflow-y-auto", styles.container)}>
            <div className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Saved Collection</h1>
                <p className="text-muted-foreground">Your personally curated list of favorite spots and events.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {SAVED_ITEMS.map((item) => (
                    <div key={item.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary/10 border border-white/5 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-white/20">
                        {/* Background Image */}
                        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

                        {/* Top Action */}
                        <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 transform scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 hover:bg-white hover:text-black">
                            <ExternalLink className="h-4 w-4" />
                        </button>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider mb-2 backdrop-blur-sm border border-white/10">{item.category}</span>
                            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">{item.title}</h3>

                            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400 opacity-0 transform translate-y-2 transition-all duration-300 delay-75 group-hover:opacity-100 group-hover:translate-y-0">
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
