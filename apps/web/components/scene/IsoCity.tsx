"use client";

import { memo, useMemo, useState, type CSSProperties } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { getCategory } from "@/config/categories";
import { cn } from "@/lib/utils";

/**
 * Isometric neighbourhood diorama built with CSS 3D transforms (no WebGL).
 * Deterministic layout from `seed`; pins sit on the ground or roofs and face the
 * viewer. Decorative unless pins have `onSelect`, in which case they are buttons.
 */

export interface IsoPin {
    id: string;
    /** 0..1 across the map, west → east. */
    x: number;
    /** 0..1 down the map, north → south. */
    y: number;
    category: string;
    label?: string;
    highlight?: boolean;
}

const T = 46; // tile size (px)
const ROAD = (i: number) => i % 3 === 2;

type Tile = { kind: "road" | "building" | "park" | "water" | "plaza"; h: number; tone: number };

function rng(seed: number) {
    let s = seed % 2147483647 || 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function buildCity(n: number, seed: number, reserved: Set<string>): Tile[][] {
    const r = rng(seed);
    const grid: Tile[][] = [];
    for (let y = 0; y < n; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < n; x++) {
            if (x === n - 1 || (x === n - 2 && y > n - 4)) row.push({ kind: "water", h: 0, tone: 0 });
            else if (ROAD(x) || ROAD(y)) row.push({ kind: "road", h: 0, tone: 0 });
            else if (reserved.has(`${x},${y}`)) row.push({ kind: "plaza", h: 0, tone: 0 });
            else {
                const v = r();
                if (v < 0.12) row.push({ kind: "park", h: 0, tone: 0 });
                else if (v < 0.18) row.push({ kind: "plaza", h: 0, tone: 0 });
                else row.push({ kind: "building", h: Math.round(14 + Math.pow(r(), 2) * 74), tone: Math.floor(r() * 4) });
            }
        }
        grid.push(row);
    }
    return grid;
}

const TONES = [
    { top: "var(--iso-a-top)", side1: "var(--iso-a-1)", side2: "var(--iso-a-2)" },
    { top: "var(--iso-b-top)", side1: "var(--iso-b-1)", side2: "var(--iso-b-2)" },
    { top: "var(--iso-c-top)", side1: "var(--iso-c-1)", side2: "var(--iso-c-2)" },
    { top: "var(--iso-d-top)", side1: "var(--iso-d-1)", side2: "var(--iso-d-2)" },
];

const face = (extra: CSSProperties): CSSProperties => ({ position: "absolute", backfaceVisibility: "hidden", ...extra });
const WINDOWS =
    "repeating-linear-gradient(to bottom, transparent 0 7px, rgb(255 255 255 / 0.16) 7px 10px), repeating-linear-gradient(to right, transparent 0 6px, rgb(0 0 0 / 0.08) 6px 8px)";

/** Extruded box with four lit sides and a roof. */
const Box = memo(function Box({ x, y, w, d, h, tone, windows = true }: { x: number; y: number; w: number; d: number; h: number; tone: (typeof TONES)[number]; windows?: boolean }) {
    const win = windows ? WINDOWS : undefined;
    return (
        <div style={{ position: "absolute", left: x, top: y, width: w, height: d, transformStyle: "preserve-3d" }}>
            <div style={face({ inset: 0, background: tone.top, transform: `translateZ(${h}px)`, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.25)" })} />
            {/* +y side */}
            <div style={face({ left: 0, top: d - h, width: w, height: h, backgroundColor: tone.side2, backgroundImage: win, transformOrigin: "bottom", transform: "rotateX(-90deg)" })} />
            {/* +x side */}
            <div style={face({ left: w - h, top: 0, width: h, height: d, backgroundColor: tone.side1, backgroundImage: win ? WINDOWS.replace("to bottom", "to left").replace("to right", "to bottom") : undefined, transformOrigin: "right", transform: "rotateY(90deg)" })} />
            {/* -y side */}
            <div style={face({ left: 0, top: 0, width: w, height: h, background: tone.side1, transformOrigin: "top", transform: "rotateX(90deg)" })} />
            {/* -x side */}
            <div style={face({ left: 0, top: 0, width: h, height: d, background: tone.side2, transformOrigin: "left", transform: "rotateY(-90deg)" })} />
        </div>
    );
});

function PinMarker({ pin, z, index, reduce, onSelect }: { pin: IsoPin; z: number; index: number; reduce: boolean | null; onSelect?: (id: string) => void }) {
    const c = getCategory(pin.category);
    const [hover, setHover] = useState(false);
    const radius = pin.category === "LOST_FOUND" ? 6 : pin.category === "SAFETY" || pin.category === "CRIME" ? 4 : 999;
    const body = (
        <div style={{ transformOrigin: "bottom center", animationDelay: `${0.5 + index * 0.12}s` }} className={cn("relative flex flex-col items-center", !reduce && "drop")}>
            {hover || pin.highlight ? (
                <span className="pointer-events-none absolute bottom-[82px] whitespace-nowrap rounded-full bg-elevated px-2.5 py-1 font-sans text-[11px] font-semibold text-foreground shadow-[var(--shadow-float)]">
                    {pin.label ?? c.label}
                </span>
            ) : null}
            <span
                className="flex size-[30px] items-center justify-center border-[2.5px] border-white shadow-[0_6px_14px_-4px_rgb(0_0_0_/_0.5)]"
                style={{ background: c.hex, borderRadius: radius, transform: pin.category === "SAFETY" || pin.category === "CRIME" ? "rotate(45deg)" : undefined }}
            >
                <c.icon className="size-4 text-white" style={{ transform: pin.category === "SAFETY" || pin.category === "CRIME" ? "rotate(-45deg)" : undefined }} aria-hidden />
            </span>
            <span className="h-[44px] w-[2px] rounded-full bg-gradient-to-b from-white to-white/40 shadow" />
        </div>
    );
    return (
        <div
            style={{
                position: "absolute",
                left: pin.x * 100 + "%",
                top: pin.y * 100 + "%",
                transformStyle: "preserve-3d",
                transform: `translateZ(${z}px)`,
            }}
        >
            {/* Pulse rings flat on the ground */}
            {!reduce ? (
                <>
                    <span className="absolute -left-[22px] -top-[22px] size-[44px] rounded-full animate-pulse-ring" style={{ background: `${c.hex}55` }} />
                    <span className="absolute -left-[22px] -top-[22px] size-[44px] rounded-full animate-pulse-ring [animation-delay:1.2s]" style={{ background: `${c.hex}40` }} />
                </>
            ) : null}
            <span className="absolute -left-[7px] -top-[4px] h-[8px] w-[14px] rounded-full bg-black/30 blur-[2px]" />
            {/* Billboard: undo the world rotation so the marker faces the viewer */}
            <div style={{ position: "absolute", left: -15, bottom: 0, transformOrigin: "15px 100%", transform: "rotateZ(45deg) rotateX(-60deg)", transformStyle: "preserve-3d" }}>
                {onSelect ? (
                    <button
                        type="button"
                        aria-label={`${c.label}: ${pin.label ?? ""}`}
                        onClick={() => onSelect(pin.id)}
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                        onFocus={() => setHover(true)}
                        onBlur={() => setHover(false)}
                        className="block rounded-full focus-visible:outline-2"
                    >
                        {body}
                    </button>
                ) : (
                    body
                )}
            </div>
        </div>
    );
}

export function IsoCity({ pins = [], tiles = 10, seed = 11, className, onSelect, cars = true, label }: { pins?: IsoPin[]; tiles?: number; seed?: number; className?: string; onSelect?: (id: string) => void; cars?: boolean; label?: string }) {
    const reduce = useReducedMotion();
    // Tiles under pins stay open (plazas) so markers are never buried in buildings.
    const reservedKey = pins.map((p) => `${Math.min(tiles - 1, Math.floor(p.x * tiles))},${Math.min(tiles - 1, Math.floor(p.y * tiles))}`).join("|");
    const grid = useMemo(() => buildCity(tiles, seed, new Set(reservedKey ? reservedKey.split("|") : [])), [tiles, seed, reservedKey]);
    const W = tiles * T;
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const sx = useSpring(px, { stiffness: 50, damping: 16 });
    const sy = useSpring(py, { stiffness: 50, damping: 16 });
    const rotZ = useTransform(sx, (v) => -45 + v * 8);
    const rotX = useTransform(sy, (v) => 60 - v * 6);

    const heightAt = (fx: number, fy: number) => {
        const t = grid[Math.min(tiles - 1, Math.floor(fy * tiles))]?.[Math.min(tiles - 1, Math.floor(fx * tiles))];
        return t?.kind === "building" ? t.h + 2 : 3;
    };

    return (
        <div
            className={cn("relative flex items-center justify-center", className)}
            style={{ perspective: 2000 }}
            role={onSelect ? "group" : "img"}
            aria-label={label ?? "Illustration of a neighbourhood with community posts"}
            onPointerMove={(e) => {
                if (reduce) return;
                const r = e.currentTarget.getBoundingClientRect();
                px.set((e.clientX - r.left) / r.width - 0.5);
                py.set((e.clientY - r.top) / r.height - 0.5);
            }}
            onPointerLeave={() => {
                px.set(0);
                py.set(0);
            }}
        >
            <motion.div style={{ width: W, height: W, transformStyle: "preserve-3d", rotateX: reduce ? 60 : rotX, rotateZ: reduce ? -45 : rotZ, position: "relative" }}>
                {/* Ground slab */}
                <div className="absolute -inset-3 rounded-[18px]" style={{ background: "var(--iso-ground)", transform: "translateZ(-14px)", boxShadow: "0 60px 80px -30px rgb(0 0 0 / 0.45)" }} />
                <Box x={-12} y={-12} w={W + 24} d={W + 24} h={14} tone={{ top: "transparent", side1: "var(--iso-slab-1)", side2: "var(--iso-slab-2)" }} windows={false} />
                <div className="absolute inset-0" style={{ background: "var(--iso-ground)" }} />

                {grid.map((row, y) =>
                    row.map((t, x) => {
                        const key = `${x}-${y}`;
                        const style: CSSProperties = { position: "absolute", left: x * T, top: y * T, width: T, height: T };
                        if (t.kind === "road")
                            return (
                                <div key={key} style={{ ...style, background: "var(--iso-road)" }}>
                                    {ROAD(y) && !ROAD(x) ? <div className="absolute left-1 right-1 top-1/2 h-[2px] -translate-y-1/2 bg-[repeating-linear-gradient(to_right,var(--iso-lane)_0_6px,transparent_6px_12px)]" /> : null}
                                    {ROAD(x) && !ROAD(y) ? <div className="absolute bottom-1 top-1 left-1/2 w-[2px] -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--iso-lane)_0_6px,transparent_6px_12px)]" /> : null}
                                </div>
                            );
                        if (t.kind === "water") return <div key={key} style={{ ...style, background: "var(--iso-water)" }} />;
                        if (t.kind === "park")
                            return (
                                <div key={key} style={{ ...style, background: "var(--iso-park)", transformStyle: "preserve-3d" }}>
                                    <Box x={8} y={8} w={12} d={12} h={16} tone={{ top: "var(--iso-tree-top)", side1: "var(--iso-tree-1)", side2: "var(--iso-tree-2)" }} windows={false} />
                                    <Box x={26} y={22} w={10} d={10} h={12} tone={{ top: "var(--iso-tree-top)", side1: "var(--iso-tree-1)", side2: "var(--iso-tree-2)" }} windows={false} />
                                </div>
                            );
                        if (t.kind === "plaza") return <div key={key} style={{ ...style, background: "var(--iso-plaza)" }} />;
                        return (
                            <div key={key} style={{ ...style, background: "var(--iso-sidewalk)", transformStyle: "preserve-3d" }}>
                                <Box x={5} y={5} w={T - 10} d={T - 10} h={t.h} tone={TONES[t.tone]} />
                            </div>
                        );
                    }),
                )}

                {/* Cars driving along the streets */}
                {cars && !reduce
                    ? [2, 5, 8].filter((r) => r < tiles).map((r, i) => (
                          <div key={r} className="absolute" style={{ left: 0, top: r * T + (i % 2 ? T * 0.62 : T * 0.18), width: W, height: 10, transformStyle: "preserve-3d" }}>
                              <div className="iso-car" style={{ animationDelay: `${-i * 3.1}s`, animationDuration: `${9 + i * 2}s`, animationDirection: i % 2 ? "reverse" : "normal" }}>
                                  <Box x={0} y={0} w={16} d={9} h={7} tone={{ top: i === 1 ? "var(--nn-signal)" : "var(--nn-accent)", side1: "rgb(0 0 0 / 0.35)", side2: "rgb(0 0 0 / 0.5)" }} windows={false} />
                              </div>
                          </div>
                      ))
                    : null}

                {pins.map((p, i) => (
                    <PinMarker key={p.id} pin={p} index={i} reduce={reduce} onSelect={onSelect} z={heightAt(p.x, p.y)} />
                ))}
            </motion.div>
        </div>
    );
}
