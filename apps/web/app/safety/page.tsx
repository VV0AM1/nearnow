"use client";

import { Shield, AlertTriangle, Phone, Activity, MapPin } from "lucide-react";
import styles from "./Safety.module.css";
import { cn } from "@/lib/utils";

export default function SafetyPage() {
    return (
        <div className={cn("flex-1 p-8 overflow-y-auto", styles.container)}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Safety Center</h1>
                    <p className="text-muted-foreground mt-1">Real-time monitoring and emergency response</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-green-500">SYSTEM OPERATIONAL</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Emergency Action */}
                <div className="md:col-span-2 lg:col-span-1">
                    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-secondary/5 backdrop-blur-md p-6 transition-all duration-300 hover:border-white/10 hover:bg-secondary/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Emergency Action
                        </h3>
                        <button className="w-full h-32 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center text-white font-bold text-xl shadow-[0_0_30px_rgba(239,68,68,0.3)] border border-red-400/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] hover:from-red-500 hover:to-red-700 active:scale-[0.98]">
                            <span className="text-3xl mb-2">SOS</span>
                            <span>TRIGGER ALERT</span>
                        </button>
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            Pressing this will instantly notify nearby users and emergency contacts.
                        </p>
                    </div>
                </div>

                {/* Live Stats */}
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-secondary/5 backdrop-blur-md p-6 transition-all duration-300 hover:border-white/10 hover:bg-secondary/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Incidents</p>
                            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mt-2">12</h2>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                            <Activity className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span>Radius: 5km</span>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-secondary/5 backdrop-blur-md p-6 transition-all duration-300 hover:border-white/10 hover:bg-secondary/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Trusted Contacts</p>
                            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mt-2">3</h2>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                            <Phone className="h-6 w-6" />
                        </div>
                    </div>
                    <button className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors border border-white/5">
                        Manage Contacts
                    </button>
                </div>

                {/* Recent Alerts List */}
                <div className="md:col-span-2 lg:col-span-3">
                    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-secondary/5 backdrop-blur-md p-6 transition-all duration-300 hover:border-white/10 hover:bg-secondary/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                        <h3 className="text-lg font-semibold text-white mb-6">Recent Safety Alerts</h3>

                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500/20 transition-colors">
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">Suspicious Activity Reported</h4>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                San Francisco, CA • 2 mins ago
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors">
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
