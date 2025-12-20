"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingCTA() {
    return (
        <section className="py-32 px-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 pointer-events-none" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 max-w-3xl mx-auto"
            >
                <h2 className="text-5xl font-bold mb-8">Ready to feel safer?</h2>
                <p className="text-xl text-muted-foreground mb-12">
                    Join 10,000+ neighbors protecting their communities today. Free for everyone.
                </p>
                <Link href="/signup" className="px-10 py-5 bg-white text-black rounded-full font-bold text-xl hover:scale-105 transition-transform inline-flex items-center gap-2">
                    Get Started Now
                </Link>
            </motion.div>
        </section>
    );
}
