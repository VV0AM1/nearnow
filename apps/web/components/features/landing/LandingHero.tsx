"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { fadeInUp, stagger } from "./animations";

export default function LandingHero() {
    return (
        <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="space-y-8"
                >
                    <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live in San Francisco & New York
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold leading-tight">
                        Know What’s Happening <br />
                        <span className="text-primary">Right Here, Right Now.</span>
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-lg">
                        The hyper-local safety network powered by your neighbors. Real-time alerts for crime, safety, and community events.
                    </motion.p>

                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                        <Link href="/signup" className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                            Join Your Neighborhood
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/map" className="px-8 py-4 bg-secondary/50 border border-white/10 rounded-xl font-bold text-lg hover:bg-secondary transition-all flex items-center justify-center">
                            View Live Map
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Hero Graphic / Map Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative hidden lg:block"
                >
                    <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-2">
                        {/* Mock UI */}
                        <div className="bg-slate-900 aspect-square rounded-xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/15/5241/12661.png')] bg-cover opacity-50" />
                            {/* Animated Dots */}
                            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />

                            <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                            <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-blue-500 rounded-full" />

                            {/* Floating Card */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur border border-white/10 p-4 rounded-xl"
                            >
                                <div className="flex gap-3">
                                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-red-400">Suspicious Activity</p>
                                        <p className="text-xs text-muted-foreground">Reported 2m ago • 0.2 miles away</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
