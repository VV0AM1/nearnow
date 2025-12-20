"use client";

import { motion } from "framer-motion";
import { Map, Bell, Shield } from "lucide-react";
import { fadeInUp, stagger } from "./animations";
import FeatureCard from "./FeatureCard";

export default function LandingFeatures() {
    return (
        <section className="py-24 px-6 bg-secondary/5 relative">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                    className="text-center mb-16"
                >
                    <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-4">Why NearNow?</motion.h2>
                    <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        We bridge the gap between official alerts and what neighbors actually see.
                    </motion.p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: Map, title: "Hyper-Local Radar", desc: "Set your radius. Only see alerts that matter to your street, not the whole city." },
                        { icon: Bell, title: "Instant Alerts", desc: "Get notified the second someone posts about safety issues nearby." },
                        { icon: Shield, title: "Verified Community", desc: "Real neighbors, verified accounts. No bots, no spam." }
                    ].map((feature, i) => (
                        <FeatureCard
                            key={i}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.desc}
                            delay={i * 0.2}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
