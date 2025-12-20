"use client";

import { useAuthContext } from "../../../context/AuthContext";
import LocationSearch from "../feed/LocationSearch";
import { Plus, MapPin } from "lucide-react";

interface HeroSectionProps {
    onLocationSelect: (lat: number, long: number) => void;
    onExplore: () => void;
    onPost: () => void;
    isLoadingLocation: boolean;
}

export default function HeroSection({ onLocationSelect, onExplore, onPost, isLoadingLocation }: HeroSectionProps) {
    const { isAuthenticated } = useAuthContext();

    return (
        <section className="relative pt-24 pb-12 overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl opacity-40 animate-pulse delay-700" />

            <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 animate-in fade-in slide-in-from-bottom-3">
                    🚀 Live Neighborhood Alerts
                </span>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-cyan-200">
                    Know What's Happening <br />
                    <span className="text-primary">Right Now, Near You</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Connect with your neighbors for real-time safety updates, lost & found, events, and local recommendations.
                </p>

                <div className="glass-card p-2 rounded-2xl max-w-xl mx-auto shadow-2xl border border-white/10 mb-8 transform hover:scale-[1.01] transition-transform duration-300">
                    <LocationSearch
                        onLocationSelect={(lat, long) => {
                            onLocationSelect(lat, long);
                            // Optional: Scroll to feed
                            const feed = document.getElementById("feed");
                            if (feed) feed.scrollIntoView({ behavior: 'smooth' });
                        }}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {isAuthenticated ? (
                        <button
                            onClick={onPost}
                            className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Post Alert
                        </button>
                    ) : (
                        <a href="/signup" className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-1 w-full sm:w-auto">
                            Join Your Neighborhood
                        </a>
                    )}
                    <a href="#feed" onClick={onExplore} className="px-8 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-all border border-border w-full sm:w-auto flex items-center justify-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Explore Live Map
                    </a>
                </div>
            </div>
        </section>
    );
}
