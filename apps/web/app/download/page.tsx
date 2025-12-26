"use client";

import Link from "next/link";
import { ArrowLeft, Check, Smartphone } from "lucide-react";
import Footer from "../../components/layout/Footer";

export default function DownloadPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    Back to Home
                </Link>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    NearNow
                </span>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 w-full grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
                        Safety in your <br />
                        <span className="text-primary">Pocket.</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-lg">
                        Get real-time alerts, report incidents instantly, and keep your loved ones safe with the NearNow mobile app.
                    </p>

                    <div className="space-y-4">
                        {['Instant Push Notifications', 'Live GPS Tracking', 'SOS Emergency Mode', 'Neighborhood Chat'].map((feat) => (
                            <div key={feat} className="flex items-center gap-3 text-lg font-medium">
                                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                    <Check className="h-4 w-4" />
                                </div>
                                {feat}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                            <span className="text-2xl"></span>
                            <div className="text-left leading-tight">
                                <div className="text-[10px] uppercase font-bold text-zinc-600">Download on the</div>
                                <div className="text-sm">App Store</div>
                            </div>
                        </button>
                        <button className="flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 border border-white/10 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                            <Smartphone className="h-6 w-6" />
                            <div className="text-left leading-tight">
                                <div className="text-[10px] uppercase font-bold text-zinc-400">Get it on</div>
                                <div className="text-sm">Google Play</div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="relative z-10 mx-auto w-64 md:w-80 h-[500px] md:h-[600px] bg-black border-4 border-zinc-800 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                        {/* Mock Phone Screen */}
                        <div className="bg-zinc-900 h-full w-full flex flex-col items-center justify-center text-zinc-600 space-y-4 p-8 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                                <span className="text-3xl">🛡️</span>
                            </div>
                            <h3 className="text-white font-bold text-xl">NearNow</h3>
                            <p>Loading your neighborhood...</p>
                            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
