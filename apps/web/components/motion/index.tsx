"use client";

/**
 * Motion primitives. Every effect is decorative and switches off under
 * prefers-reduced-motion; content is never hidden behind an animation.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
    animate,
    motion,
    useInView,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 160, damping: 18, mass: 0.6 };

/**
 * Fades and lifts children into view once (CSS transition toggled by an
 * IntersectionObserver), optionally staggered by `delay` seconds.
 */
export function Reveal({ children, delay = 0, y = 24, className, as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" }) {
    const ref = useRef<HTMLElement | null>(null);
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === "undefined") return setShown(true);
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { rootMargin: "0px 0px -60px 0px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);
    const Comp = as;
    return (
        <Comp
            ref={ref as never}
            data-shown={shown || undefined}
            className={cn("reveal", className)}
            style={{ "--reveal-delay": `${delay}s`, "--reveal-y": `${y}px` } as React.CSSProperties}
        >
            {children}
        </Comp>
    );
}

/** 3D tilt that follows the pointer, with a soft light glare. */
export function Tilt({ children, className, max = 8, glare = true, scale = 1.015 }: { children: ReactNode; className?: string; max?: number; glare?: boolean; scale?: number }) {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const px = useMotionValue(0.5);
    const py = useMotionValue(0.5);
    const hover = useMotionValue(0);
    const rx = useSpring(useTransform(py, [0, 1], [max, -max]), SPRING);
    const ry = useSpring(useTransform(px, [0, 1], [-max, max]), SPRING);
    const s = useSpring(useTransform(hover, [0, 1], [1, scale]), SPRING);
    const gx = useTransform(px, (v) => `${v * 100}%`);
    const gy = useTransform(py, (v) => `${v * 100}%`);
    const go = useSpring(useTransform(hover, [0, 1], [0, 1]), SPRING);
    const glareBg = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgb(255 255 255 / 0.22), transparent 55%)`;

    if (reduce) return <div className={className}>{children}</div>;
    return (
        <motion.div
            ref={ref}
            className={cn("relative preserve-3d", className)}
            style={{ rotateX: rx, rotateY: ry, scale: s, transformPerspective: 1100 }}
            onPointerMove={(e) => {
                const r = ref.current?.getBoundingClientRect();
                if (!r) return;
                px.set((e.clientX - r.left) / r.width);
                py.set((e.clientY - r.top) / r.height);
            }}
            onPointerEnter={() => hover.set(1)}
            onPointerLeave={() => {
                hover.set(0);
                px.set(0.5);
                py.set(0.5);
            }}
        >
            {children}
            {glare ? <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light" style={{ background: glareBg, opacity: go }} /> : null}
        </motion.div>
    );
}

/** Moves an element against the scroll for depth. `speed` > 0 lags, < 0 leads. */
export function Parallax({ children, speed = 0.2, className }: { children: ReactNode; speed?: number; className?: string }) {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}px`, `${-speed * 100}px`]);
    return (
        <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
            {children}
        </motion.div>
    );
}

/* Pointer depth: children shift by their `depth` as the pointer moves over the stage. */
const PointerCtx = createContext<{ x: MotionValue<number>; y: MotionValue<number> } | null>(null);

export function PointerStage({ children, className }: { children: ReactNode; className?: string }) {
    const reduce = useReducedMotion();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 60, damping: 18 });
    const sy = useSpring(y, { stiffness: 60, damping: 18 });
    return (
        <PointerCtx.Provider value={{ x: sx, y: sy }}>
            <div
                className={className}
                onPointerMove={(e) => {
                    if (reduce) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    x.set((e.clientX - r.left) / r.width - 0.5);
                    y.set((e.clientY - r.top) / r.height - 0.5);
                }}
                onPointerLeave={() => {
                    x.set(0);
                    y.set(0);
                }}
            >
                {children}
            </div>
        </PointerCtx.Provider>
    );
}

export function Depth({ children, depth = 20, className, rotate = false }: { children: ReactNode; depth?: number; className?: string; rotate?: boolean }) {
    const ctx = useContext(PointerCtx);
    const fallback = useMotionValue(0);
    const x = useTransform(ctx?.x ?? fallback, (v) => v * depth);
    const y = useTransform(ctx?.y ?? fallback, (v) => v * depth);
    const rY = useTransform(ctx?.x ?? fallback, (v) => (rotate ? v * depth * 0.4 : 0));
    const rX = useTransform(ctx?.y ?? fallback, (v) => (rotate ? -v * depth * 0.4 : 0));
    return (
        <motion.div className={className} style={{ x, y, rotateX: rX, rotateY: rY }}>
            {children}
        </motion.div>
    );
}

/** Counts up to `value` when it scrolls into view. */
export function CountUp({ value, className, duration = 1.1 }: { value: number; className?: string; duration?: number }) {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    const [shown, setShown] = useState(reduce ? value : 0);
    useEffect(() => {
        if (reduce || !inView) {
            setShown(value);
            return;
        }
        const controls = animate(0, value, { duration, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) });
        return () => controls.stop();
    }, [value, inView, reduce, duration]);
    return (
        <span ref={ref} className={cn("tabular-nums", className)}>
            {shown}
        </span>
    );
}

/** Gently pulls its child towards the pointer. */
export function Magnetic({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) {
    const reduce = useReducedMotion();
    const x = useSpring(0, { stiffness: 220, damping: 16 });
    const y = useSpring(0, { stiffness: 220, damping: 16 });
    if (reduce) return <span className={className}>{children}</span>;
    return (
        <motion.span
            className={cn("inline-flex", className)}
            style={{ x, y }}
            onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                x.set((e.clientX - r.left - r.width / 2) * strength);
                y.set((e.clientY - r.top - r.height / 2) * strength);
            }}
            onPointerLeave={() => {
                x.set(0);
                y.set(0);
            }}
        >
            {children}
        </motion.span>
    );
}

export { motion, useReducedMotion };
