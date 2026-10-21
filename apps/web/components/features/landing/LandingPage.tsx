"use client";

import { ArrowRight, Bell, Building2, CheckCheck, Clock, EyeOff, Flag, MapPin, MessageCircle, Phone, ShieldCheck, ThumbsUp, Users } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import { Badge, Button, Card } from "@/components/nn";
import { getCategory } from "@/config/categories";
import { PILOT_CITY } from "@/lib/config";

/** A static, clearly labelled example — never presented as a real report. */
function ExampleCard({ category, title, text, meta, confirmed, rotate }: { category: string; title: string; text: string; meta: string; confirmed?: number; rotate?: string }) {
    const c = getCategory(category);
    return (
        <Card className={`w-full space-y-3 shadow-[var(--shadow-float)] ${rotate ?? ""}`}>
            <div className="flex items-center justify-between">
                <Badge label={c.label} icon={c.icon} color={c.hex} />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Example</span>
            </div>
            <p className="text-[17px] font-semibold leading-snug">{title}</p>
            <p className="text-[15px] text-muted-foreground">{text}</p>
            <p className="text-[13px] text-muted-foreground">{meta}</p>
            {confirmed ? <Badge icon={CheckCheck} tone="accent" label={`Confirmed by ${confirmed}`} /> : null}
            <div className="flex items-center gap-4 border-t border-border pt-2.5 text-muted-foreground" aria-hidden>
                <ThumbsUp className="size-[18px]" />
                <MessageCircle className="size-[18px]" />
            </div>
        </Card>
    );
}

const PRINCIPLES = [
    { icon: Clock, title: "Fresh", text: "Every post shows when it was posted and when someone last confirmed it. Old posts expire." },
    { icon: CheckCheck, title: "Honest", text: "Neighbours confirm what is still happening or mark it over. No ratings of “safe” streets." },
    { icon: EyeOff, title: "Private", text: "Share an approximate location. Lost & found contact stays private until you accept." },
];

const STEPS = [
    { icon: MapPin, title: "Choose your area", text: "A city or your current location — used only for the area you pick." },
    { icon: Bell, title: "Turn on the alerts you want", text: "Pick categories and a distance. Nothing is sent until you opt in." },
    { icon: Users, title: "Post, confirm, help", text: "Share a useful update, confirm one that is still happening, or return something lost." },
];

export default function LandingPage() {
    return (
        <MarketingShell>
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
                    <div className="animate-in space-y-7">
                        {PILOT_CITY ? <Badge label={`Pilot in ${PILOT_CITY}`} icon={MapPin} tone="accent" /> : null}
                        <h1 className="text-[clamp(2.4rem,5.5vw,3.75rem)] font-bold leading-[1.05] tracking-tight">
                            What’s happening around you, <span className="text-primary">from the people who live there.</span>
                        </h1>
                        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                            Useful local updates and community help: closures, events, lost & found and more — with when it was posted and whether neighbours confirmed it.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button href="/signup" size="lg">
                                Get started — it’s free <ArrowRight className="size-[18px]" aria-hidden />
                            </Button>
                            <Button href="/login" size="lg" variant="outline">
                                Sign in
                            </Button>
                        </div>
                        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                            <Phone className="size-4 text-danger" aria-hidden /> Not an emergency service — if anyone is in danger, call 112.
                        </p>
                    </div>
                    <div className="relative mx-auto grid w-full max-w-md gap-4">
                        <ExampleCard category="LOST_FOUND" title="Found: set of keys with a red tag" text="Left at the bakery counter on the corner. Ask the staff." meta="Community report · 20 min ago · 0.3 km away" />
                        <div className="lg:ml-10">
                            <ExampleCard category="GENERAL" title="Street closed for works until 18:00" text="Detour via the next street; buses are stopping one block up." meta="Community report · 1 h ago" confirmed={4} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Principles */}
            <section className="border-y border-border bg-surface">
                <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
                    {PRINCIPLES.map(({ icon: IconC, title, text }) => (
                        <div key={title} className="space-y-2.5">
                            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                                <IconC className="size-5" aria-hidden />
                            </span>
                            <h2 className="text-[19px] font-bold">{title}</h2>
                            <p className="text-[15px] leading-relaxed text-muted-foreground">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
                <h2 className="text-center text-[32px] font-bold tracking-tight">How it works</h2>
                <ol className="mt-12 grid gap-5 md:grid-cols-3">
                    {STEPS.map(({ icon: IconC, title, text }, i) => (
                        <li key={title}>
                            <Card className="h-full space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                                    <IconC className="size-5 text-primary" aria-hidden />
                                </div>
                                <h3 className="text-[17px] font-semibold">{title}</h3>
                                <p className="text-[15px] leading-relaxed text-muted-foreground">{text}</p>
                            </Card>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Guidelines */}
            <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
                <Card className="grid gap-8 p-8 md:grid-cols-[1fr_1.2fr] md:p-10">
                    <div className="space-y-3">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                            <ShieldCheck className="size-5" aria-hidden />
                        </span>
                        <h2 className="text-[26px] font-bold tracking-tight">A community with clear rules</h2>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">Anyone can report a post, and moderators review every report.</p>
                    </div>
                    <ul className="space-y-3.5 text-[15px]">
                        {[
                            { icon: Flag, text: "No accusations against named or pictured people." },
                            { icon: EyeOff, text: "No faces, licence plates, home addresses or ID numbers." },
                            { icon: Building2, text: "Official sources are labelled as official — and only those." },
                            { icon: Phone, text: "Urgent help is a community alert, never a replacement for 112." },
                        ].map(({ icon: IconC, text }) => (
                            <li key={text} className="flex items-start gap-3">
                                <IconC className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
                                {text}
                            </li>
                        ))}
                    </ul>
                </Card>
            </section>

            {/* CTA */}
            <section className="bg-[#2459e0]">
                <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 text-white sm:px-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-[28px] font-bold tracking-tight">Follow your area in a minute.</h2>
                        <p className="mt-1 text-white/85">Free to use, with alerts only when you ask for them.</p>
                    </div>
                    <a href="/signup" className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-white px-6 text-base font-semibold text-[#2459e0] hover:bg-white/90">
                        Create your account <ArrowRight className="size-[18px]" aria-hidden />
                    </a>
                </div>
            </section>
        </MarketingShell>
    );
}
