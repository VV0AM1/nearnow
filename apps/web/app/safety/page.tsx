"use client";

import { Shield, AlertTriangle, Phone, Activity, MapPin } from "lucide-react";
import styles from "./Safety.module.css";
import { cn } from "@/lib/utils";

export default function SafetyPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Safety Center</h1>
                    <p className={styles.subtitle}>Real-time monitoring and emergency response</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <span className={styles.pulseDot}>
                        <span className={styles.pulseDotAnimate}></span>
                        <span className={styles.pulseDotSolid}></span>
                    </span>
                    <span className="text-xs font-semibold text-green-500">SYSTEM OPERATIONAL</span>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Emergency Action */}
                <div className="md:col-span-2 lg:col-span-1">
                    <div className={styles.card}>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Emergency Action
                        </h3>
                        <button className={styles.sosLarge}>
                            <span className="text-3xl mb-2">SOS</span>
                            <span>TRIGGER ALERT</span>
                        </button>
                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            Pressing this will instantly notify nearby users and emergency contacts.
                        </p>
                    </div>
                </div>

                {/* Live Stats */}
                <div className={styles.card}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className={styles.statLabel}>Active Incidents</p>
                            <h2 className={styles.statValue}>12</h2>
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

                <div className={styles.card}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className={styles.statLabel}>Trusted Contacts</p>
                            <h2 className={styles.statValue}>3</h2>
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
                    <div className={styles.card}>
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
