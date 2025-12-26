"use client";

import Link from "next/link";
import LandingHero from "./LandingHero";
import LandingFeatures from "./LandingFeatures";
import LandingSafety from "./LandingSafety";
import LandingCTA from "./LandingCTA";
import Footer from "../../layout/Footer";

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

            {/* New Stats Section */}
            <section className="py-20 border-y border-white/5 bg-black/50 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl" />
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
                    {[
                        { label: 'Active Users', value: '50k+' },
                        { label: 'Alerts Resolved', value: '120k' },
                        { label: 'Cities', value: '15' },
                        { label: 'Safety Score', value: '4.8/5' }
                    ].map((stat, i) => (
                        <div key={i} className="space-y-2">
                            <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                                {stat.value}
                            </div>
                            <div className="text-sm font-bold tracking-widest text-primary uppercase">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <LandingFeatures />
            <LandingSafety />
            <LandingCTA />

            <Footer />
        </div>
    );
}
