"use client";

import Link from "next/link";
import LandingHero from "./LandingHero";
import LandingFeatures from "./LandingFeatures";
import LandingSafety from "./LandingSafety";
import LandingCTA from "./LandingCTA";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar (Landing Version) */}
            <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        NearNow
                    </span>
                    <div className="flex gap-4">
                        <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
                            Log In
                        </Link>
                        <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <LandingHero />
            <LandingFeatures />
            <LandingSafety />
            <LandingCTA />

            <footer className="py-12 px-6 border-t border-white/10 text-center text-sm text-muted-foreground">
                <p>&copy; 2025 NearNow Inc. San Francisco, CA.</p>
            </footer>
        </div>
    );
}
