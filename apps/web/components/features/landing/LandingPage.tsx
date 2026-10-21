"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Bell, CheckCheck, Clock, EyeOff, KeyRound, MapPin, Moon, Phone, ShieldCheck, Sparkles, Sun, ThumbsUp, Users } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { CATEGORIES, getCategory } from "@/config/categories";
import { PILOT_CITY } from "@/lib/config";
import { IsoCity, type IsoPin } from "@/components/scene/IsoCity";
import { CountUp, Depth, Magnetic, Parallax, PointerStage, Reveal, Tilt } from "@/components/motion";
import { cn } from "@/lib/utils";

/* Illustration pins — clearly examples, never real reports. */
const EXAMPLE_PINS: IsoPin[] = [
    { id: "e1", x: 0.2, y: 0.24, category: "EVENT", label: "Example · Market on the square" },
    { id: "e2", x: 0.55, y: 0.18, category: "GENERAL", label: "Example · Street closed until 18:00" },
    { id: "e3", x: 0.42, y: 0.58, category: "LOST_FOUND", label: "Example · Found: keys", highlight: true },
    { id: "e4", x: 0.75, y: 0.5, category: "SAFETY", label: "Example · Broken pavement" },
    { id: "e5", x: 0.25, y: 0.82, category: "RECOMMENDATION", label: "Example · Quiet study room" },
];

function Nav() {
    const { resolved, setMode } = useTheme();
    const { user } = useAuthContext();
    return (
        <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <nav aria-label="Site" className="material flex h-14 w-full max-w-5xl items-center gap-2 rounded-full border border-border pl-3 pr-2 shadow-[var(--shadow-float)]">
                <Link href="/" className="flex items-center gap-2 pl-1 pr-3">
                    <span className="relative flex size-8 items-center justify-center rounded-full bg-ink text-paper">
                        <MapPin className="size-4" aria-hidden />
                        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-paper bg-signal" />
                    </span>
                    <span className="display text-[19px]">NearNow</span>
                </Link>
                <div className="hidden items-center gap-1 text-[14px] md:flex">
                    {[
                        ["#lifecycle", "How it works"],
                        ["#features", "Features"],
                        ["/download", "Mobile app"],
                    ].map(([href, label]) => (
                        <Link key={href} href={href} className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                            {label}
                        </Link>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <button
                        type="button"
                        aria-label={resolved === "dark" ? "Use light appearance" : "Use dark appearance"}
                        onClick={() => setMode(resolved === "dark" ? "light" : "dark")}
                        className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    >
                        {resolved === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                    </button>
                    {user ? (
                        <Link href="/" className="flex h-10 items-center rounded-full bg-ink px-4 text-[14px] font-semibold text-paper">
                            Open NearNow
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="hidden h-10 items-center rounded-full px-4 text-[14px] font-semibold hover:bg-surface-2 sm:flex">
                                Sign in
                            </Link>
                            <Link href="/signup" className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[14px] font-semibold text-paper">
                                Get started <ArrowRight className="size-4" aria-hidden />
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

function FloatCard({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("rounded-[18px] bg-elevated p-3.5 shadow-[var(--shadow-deep)] ring-1 ring-border", className)}>{children}</div>;
}

function Hero() {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const sceneY = useTransform(scrollYProgress, [0, 1], [0, 160]);
    const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
    const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
    const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section ref={ref} className="contours relative min-h-[100svh] overflow-hidden pb-16 pt-28">
            <div aria-hidden className="pointer-events-none absolute -left-40 top-20 size-[520px] rounded-full bg-primary/15 blur-[110px]" />
            <div aria-hidden className="pointer-events-none absolute -right-32 bottom-0 size-[460px] rounded-full bg-signal/15 blur-[120px]" />
            <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr]">
                <motion.div style={reduce ? undefined : { y: textY, opacity: fade }} className="relative z-10 space-y-7 pt-6">
                    <p
                        style={{ animationDelay: "0.1s" }}
                        className="rise inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 font-mono text-[12px] uppercase tracking-wider text-muted-foreground"
                    >
                        <span className="relative flex size-2">
                            <span className="absolute inset-0 rounded-full bg-signal animate-pulse-ring" />
                            <span className="relative size-2 rounded-full bg-signal" />
                        </span>
                        41.387° N · 2.170° E{PILOT_CITY ? ` · ${PILOT_CITY} pilot` : ""}
                    </p>
                    <h1 className="display text-[clamp(3rem,8vw,6.4rem)] leading-[0.92]" style={{ perspective: 800 }}>
                        {["Your street,", "right now."].map((line, i) => (
                            <span key={line} className={cn("rise-3d block", i === 1 && "ink-gradient pb-2")} style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
                                {line}
                            </span>
                        ))}
                    </h1>
                    <p style={{ animationDelay: "0.45s" }} className="rise max-w-md text-[19px] leading-relaxed text-muted-foreground">
                        Closures, events, lost keys, a lift that’s out — posted by the people who live there, with when it happened and whether anyone confirmed it.
                    </p>
                    <div style={{ animationDelay: "0.55s" }} className="rise flex flex-wrap items-center gap-3">
                        <Magnetic>
                            <Link href="/signup" className="group flex h-14 items-center gap-2 rounded-full bg-primary pl-6 pr-2 text-[16px] font-semibold text-primary-foreground shadow-[var(--shadow-deep)]">
                                Follow your area
                                <span className="flex size-10 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:rotate-[-35deg]">
                                    <ArrowRight className="size-5" aria-hidden />
                                </span>
                            </Link>
                        </Magnetic>
                        <Link href="#lifecycle" className="flex h-14 items-center rounded-full px-5 text-[16px] font-semibold hover:bg-surface-2">
                            See how it works
                        </Link>
                    </div>
                    <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Phone className="size-4 text-danger" aria-hidden /> Not an emergency service — in danger, call 112.
                    </p>
                </motion.div>

                <motion.div style={reduce ? undefined : { y: sceneY, scale: sceneScale }} className="relative">
                    <PointerStage className="relative h-[440px] sm:h-[600px]">
                        <Depth depth={-14} className="absolute inset-0 flex items-center justify-center">
                            <IsoCity pins={EXAMPLE_PINS} className="scale-[0.58] sm:scale-[0.9] lg:scale-100" />
                        </Depth>
                        <Depth depth={36} rotate className="absolute left-0 top-10 hidden w-60 sm:block">
                            <FloatCard className="animate-float motion-safe-only">
                                <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">Example</p>
                                <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-success">
                                    <CheckCheck className="size-4" aria-hidden /> Resolved 18 min ago
                                </p>
                                <p className="mt-0.5 text-[14px] font-semibold">Pavement blocked by scaffolding</p>
                            </FloatCard>
                        </Depth>
                        <Depth depth={52} rotate className="absolute bottom-16 right-0 hidden w-64 sm:block">
                            <FloatCard className="animate-float motion-safe-only [animation-delay:-3s]">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-subtle">Example</span>
                                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">Confirmed by 3</span>
                                </div>
                                <p className="mt-2 text-[14px] font-semibold">Lift at the metro entrance out of service</p>
                                <div className="mt-3 grid grid-cols-2 gap-1.5">
                                    <span className="rounded-full bg-primary py-1.5 text-center text-[11px] font-semibold text-primary-foreground">Still happening</span>
                                    <span className="rounded-full bg-surface-2 py-1.5 text-center text-[11px] font-semibold">No longer there</span>
                                </div>
                            </FloatCard>
                        </Depth>
                        <Depth depth={24} className="absolute bottom-4 left-4 hidden lg:block">
                            <FloatCard className="flex items-center gap-2.5 py-2.5">
                                <Sparkles className="size-4 text-signal" aria-hidden />
                                <span className="text-[13px] font-semibold">Since you last checked: 2 new, 1 resolved</span>
                            </FloatCard>
                        </Depth>
                    </PointerStage>
                </motion.div>
            </div>
        </section>
    );
}

function Marquee() {
    const items = CATEGORIES.filter((c) => c.id !== "ALL");
    const row = [...items, ...items];
    return (
        <div className="relative z-10 -my-6 rotate-[-2deg] overflow-hidden bg-ink py-4 text-paper shadow-[var(--shadow-deep)]" aria-hidden>
            <div className="flex w-max animate-marquee motion-safe-only gap-10 whitespace-nowrap">
                {[...row, ...row].map((c, i) => (
                    <span key={`${c.id}-${i}`} className="display flex items-center gap-3 text-[26px]">
                        <c.icon className="size-6" style={{ color: c.hex }} />
                        {c.label}
                        <span className="text-paper/30">✦</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

const STEPS = [
    { icon: MapPin, title: "Someone posts", text: "A neighbour shares what they see — with an exact or approximate location.", tag: "Community report" },
    { icon: Users, title: "Neighbours check", text: "People passing by answer “still happening” or “no longer there”. One tap.", tag: "Confirmed by 3" },
    { icon: CheckCheck, title: "It gets resolved", text: "The author marks it resolved, or it expires on its own. Stale posts say so.", tag: "Resolved" },
    { icon: Sparkles, title: "You catch up", text: "Your brief tells you only what changed since you last looked.", tag: "Since you last checked" },
];

function Lifecycle() {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
    const draw = useTransform(scrollYProgress, [0, 1], [0, 1]);
    return (
        <section id="lifecycle" ref={ref} className="relative mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 pt-32 sm:px-6">
            <Reveal className="max-w-2xl">
                <p className="font-mono text-[12px] uppercase tracking-wider text-signal">The lifecycle</p>
                <h2 className="display mt-3 text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.98]">From “I saw this” to “it’s fixed” — and everyone knows.</h2>
            </Reveal>
            <div className="relative mt-16">
                <svg aria-hidden viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute left-0 top-10 hidden h-[120px] w-full md:block">
                    <path d="M40 60 C 200 -10, 300 130, 500 60 S 800 -10, 960 60" fill="none" stroke="var(--nn-separator)" strokeWidth="2" strokeDasharray="6 8" />
                    <motion.path d="M40 60 C 200 -10, 300 130, 500 60 S 800 -10, 960 60" fill="none" stroke="var(--nn-accent)" strokeWidth="3" strokeLinecap="round" style={{ pathLength: reduce ? 1 : draw }} />
                </svg>
                <ol className="relative grid gap-5 md:grid-cols-4">
                    {STEPS.map(({ icon: IconC, title, text, tag }, i) => (
                        <Reveal as="li" key={title} delay={i * 0.12}>
                            <Tilt className="h-full rounded-[24px]" max={6}>
                                <div className="relative h-full rounded-[24px] bg-surface p-6 shadow-[var(--shadow-float)] ring-1 ring-border">
                                    <div className="flex items-center justify-between">
                                        <span className="flex size-12 items-center justify-center rounded-2xl bg-ink text-paper shadow-[var(--shadow-float)]">
                                            <IconC className="size-5" aria-hidden />
                                        </span>
                                        <span className="font-mono text-[28px] text-subtle">0{i + 1}</span>
                                    </div>
                                    <h3 className="display mt-5 text-[22px]">{title}</h3>
                                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{text}</p>
                                    <span className="mt-4 inline-block rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-semibold">{tag}</span>
                                </div>
                            </Tilt>
                        </Reveal>
                    ))}
                </ol>
            </div>
        </section>
    );
}

function Bento() {
    const lf = getCategory("LOST_FOUND");
    const briefRows: [string, number, string][] = [
        ["New posts", 2, "text-[#f3efe6]"],
        ["Marked resolved", 1, "text-[#4cd17a]"],
        ["Unconfirmed — check first", 1, "text-[#ffb547]"],
    ];
    return (
        <section id="features" className="contours relative scroll-mt-24 py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <Reveal className="mb-12 max-w-2xl">
                    <p className="font-mono text-[12px] uppercase tracking-wider text-primary">What you get</p>
                    <h2 className="display mt-3 text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.98]">Useful, calm, and honest about what it knows.</h2>
                </Reveal>
                <div className="grid auto-rows-[minmax(250px,auto)] gap-5 md:grid-cols-6">
                    <Reveal className="md:col-span-4">
                        <Tilt className="h-full rounded-[28px]">
                            <div className="flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[28px] bg-[#13141b] p-7 text-[#f3efe6] shadow-[var(--shadow-deep)] sm:flex-row">
                                <div className="max-w-xs space-y-3">
                                    <Sparkles className="size-7 text-signal" aria-hidden />
                                    <h3 className="display text-[30px] leading-tight">Since you last checked</h3>
                                    <p className="text-[15px] text-[#f3efe6]/70">A short brief of what changed in your area — new, confirmed, resolved, expired. Never an “all clear”.</p>
                                </div>
                                <div className="w-full max-w-[300px] space-y-2 self-end rounded-[20px] bg-white/[0.06] p-4 ring-1 ring-white/10">
                                    {briefRows.map(([l, n, c]) => (
                                        <div key={l} className="flex items-center justify-between text-[14px]">
                                            <span className={c}>{l}</span>
                                            <CountUp value={n} className="font-mono text-[18px]" />
                                        </div>
                                    ))}
                                    <p className="pt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">Example</p>
                                </div>
                            </div>
                        </Tilt>
                    </Reveal>
                    <Reveal className="md:col-span-2" delay={0.1}>
                        <Tilt className="h-full rounded-[28px]">
                            <div className="flex h-full flex-col justify-between rounded-[28px] bg-signal p-7 text-[#13141b] shadow-[var(--shadow-deep)]">
                                <ThumbsUp className="size-7" aria-hidden />
                                <div>
                                    <h3 className="display text-[28px] leading-tight">One-tap reality check</h3>
                                    <p className="mt-2 text-[15px] text-[#13141b]/80">Still happening? No longer there? Or “I can’t confirm” — we never ask you to vouch for what you didn’t see.</p>
                                </div>
                            </div>
                        </Tilt>
                    </Reveal>
                    <Reveal className="md:col-span-2" delay={0.05}>
                        <Tilt className="h-full rounded-[28px]">
                            <div className="relative flex h-full flex-col justify-end overflow-hidden rounded-[28px] bg-surface p-7 shadow-[var(--shadow-float)] ring-1 ring-border">
                                <div aria-hidden className="absolute right-6 top-6 flex size-28 items-center justify-center">
                                    <span className="absolute size-28 rounded-full border-2 border-dashed border-primary/40 animate-[spin_30s_linear_infinite] motion-safe-only" />
                                    <span className="absolute size-16 rounded-full bg-primary-soft" />
                                    <EyeOff className="relative size-6 text-primary" />
                                </div>
                                <h3 className="display text-[26px] leading-tight">Private by design</h3>
                                <p className="mt-2 text-[15px] text-muted-foreground">Share a ~300 m area instead of your door. No tracking in the background.</p>
                            </div>
                        </Tilt>
                    </Reveal>
                    <Reveal className="md:col-span-2" delay={0.1}>
                        <Tilt className="h-full rounded-[28px]">
                            <div className="flex h-full flex-col justify-between rounded-[28px] bg-surface p-7 shadow-[var(--shadow-float)] ring-1 ring-border">
                                <span className="flex size-14 items-center justify-center rounded-2xl" style={{ background: `${lf.hex}22` }}>
                                    <KeyRound className="size-7" style={{ color: lf.hex }} aria-hidden />
                                </span>
                                <div>
                                    <h3 className="display text-[26px] leading-tight">Lost &amp; found that matches</h3>
                                    <p className="mt-2 text-[15px] text-muted-foreground">“Lost keys” meets “found keys” nearby. Contact stays private until you accept.</p>
                                </div>
                            </div>
                        </Tilt>
                    </Reveal>
                    <Reveal className="md:col-span-2" delay={0.15}>
                        <Tilt className="h-full rounded-[28px]">
                            <div className="flex h-full flex-col justify-between rounded-[28px] bg-primary p-7 text-primary-foreground shadow-[var(--shadow-deep)]">
                                <Bell className="size-7" aria-hidden />
                                <div>
                                    <h3 className="display text-[26px] leading-tight">Alerts you choose</h3>
                                    <p className="mt-2 text-[15px] opacity-90">Pick topics and a distance. Quiet hours and a cap, so it never shouts.</p>
                                </div>
                            </div>
                        </Tilt>
                    </Reveal>
                    <Reveal className="md:col-span-6" delay={0.05}>
                        <div className="flex flex-col items-start gap-5 rounded-[28px] bg-danger-soft p-7 ring-1 ring-danger/20 sm:flex-row sm:items-center">
                            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-danger text-white shadow-[var(--shadow-float)]">
                                <Phone className="size-6" aria-hidden />
                            </span>
                            <div className="flex-1">
                                <h3 className="display text-[24px]">Urgent help, told straight</h3>
                                <p className="mt-1 text-[15px] text-muted-foreground">It alerts nearby people who opted in and tells you exactly how many. It never claims anyone was dispatched — and always offers 112 first.</p>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

const PRINCIPLE_POINTS: [typeof ShieldCheck, string][] = [
    [ShieldCheck, "Anyone can report a post; moderators review every report."],
    [EyeOff, "No faces, plates, home addresses or ID numbers."],
    [Clock, "Old posts expire, and “may be outdated” is shown when it is."],
];

function Principles() {
    const lines = ["No safety scores.", "No street rankings.", "No fake urgency."];
    return (
        <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
            <div className="grid gap-12 md:grid-cols-[1.3fr_1fr] md:items-end">
                <div>
                    {lines.map((l, i) => (
                        <Parallax key={l} speed={0.08 * (i + 1)}>
                            <Reveal delay={i * 0.1}>
                                <p className="display text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
                                    <span className="relative">
                                        {l}
                                        <span aria-hidden className="absolute left-0 right-0 top-[55%] h-[6px] -rotate-1 rounded-full bg-signal/80" />
                                    </span>
                                </p>
                            </Reveal>
                        </Parallax>
                    ))}
                </div>
                <Reveal delay={0.2}>
                    <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground">
                        <p>Counting posts can’t tell you whether a street is safe, so NearNow never pretends to. What you get is what neighbours actually reported — labelled with who, when, and how sure.</p>
                        <ul className="space-y-2.5 text-[15px] text-foreground">
                            {PRINCIPLE_POINTS.map(([I, t]) => (
                                <li key={t} className="flex gap-2.5">
                                    <I className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function FinalCta() {
    return (
        <section className="px-4 pb-16 sm:px-6">
            <div data-theme="dark" className="contours relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-background text-foreground shadow-[var(--shadow-deep)]">
                <div className="grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-2">
                    <div className="relative z-10 space-y-6">
                        <h2 className="display text-[clamp(2.4rem,5.5vw,4.2rem)] leading-[0.98]">Your neighbourhood, after dark too.</h2>
                        <p className="max-w-md text-[17px] text-muted-foreground">Free to use. Follow an area in a minute — no location tracking, alerts only when you ask.</p>
                        <Magnetic>
                            <Link href="/signup" className="group flex h-14 items-center gap-2 rounded-full bg-foreground pl-6 pr-2 text-[16px] font-semibold text-background">
                                Create your account
                                <span className="flex size-10 items-center justify-center rounded-full bg-background text-foreground transition-transform group-hover:rotate-45">
                                    <ArrowUpRight className="size-5" aria-hidden />
                                </span>
                            </Link>
                        </Magnetic>
                    </div>
                    <PointerStage className="relative h-[340px]">
                        <Depth depth={-18} className="absolute inset-0 flex items-center justify-center">
                            <IsoCity seed={29} tiles={8} pins={EXAMPLE_PINS.slice(0, 3)} className="scale-[0.7]" />
                        </Depth>
                    </PointerStage>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-10 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-mono">© {new Date().getFullYear()} NearNow · not an emergency service · 112</p>
            <nav aria-label="Footer" className="flex gap-5">
                <Link href="/legal" className="hover:text-foreground">
                    Privacy & terms
                </Link>
                <Link href="/download" className="hover:text-foreground">
                    Mobile app
                </Link>
                <Link href="/login" className="hover:text-foreground">
                    Sign in
                </Link>
            </nav>
        </footer>
    );
}

export default function LandingPage() {
    return (
        <div className="overflow-x-clip">
            <Nav />
            <main>
                <Hero />
                <Marquee />
                <Lifecycle />
                <Bento />
                <Principles />
                <FinalCta />
            </main>
            <Footer />
        </div>
    );
}
