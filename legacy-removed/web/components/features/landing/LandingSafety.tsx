"use client";

import Link from "next/link";
import { Users } from "lucide-react";

export default function LandingSafety() {
    return (
        <section className="py-24 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-full" />
                    <div className="relative glass-card p-8 border-l-4 border-l-primary/50">
                        <div className="flex gap-4 mb-6">
                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">Community Guidelines</h4>
                                <p className="text-sm text-muted-foreground">We take moderation seriously.</p>
                            </div>
                        </div>
                        <ul className="space-y-4">
                            {["Zero tolerance for hate speech", "No accusations against named people", "Approximate-location option for posts", "Not an emergency service — call 112"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="order-1 md:order-2">
                    <h2 className="text-4xl font-bold mb-6">Accuracy and privacy first.</h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Every post shows when it was reported, whether neighbours confirmed it, and when it was resolved or expired. You choose whether a post shows an exact pin or an approximate (~300 m) location. Community posts do not tell you whether a place is safe.
                    </p>
                    <Link href="/legal" className="text-primary font-medium hover:underline">Read the community guidelines &rarr;</Link>
                </div>
            </div>
        </section>
    );
}
