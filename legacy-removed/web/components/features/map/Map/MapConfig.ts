import L from "leaflet";
import type { MarkerShape } from "@/config/categories";

/** Raster basemaps (free with attribution) — the same provider as the mobile Leaflet fallback. */
export const TILES = {
    light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

const COLOR = /^#[0-9a-f]{6}$/i;

/** Category marker: colour plus shape (colour is never the only signal). */
export function markerIcon(hex: string, shape: MarkerShape, opts: { dim?: boolean; highlighted?: boolean } = {}) {
    const color = COLOR.test(hex) ? hex : "#2563eb";
    const size = opts.highlighted ? 26 : 20;
    const ring = opts.highlighted ? "0 0 0 4px rgba(36,89,224,.35)," : "";
    const shadow = `box-shadow:${ring}0 1px 3px rgba(0,0,0,.35);`;
    const base = `width:${size}px;height:${size}px;background:${color};border:2.5px solid #fff;${shadow}opacity:${opts.dim ? 0.5 : 1};`;
    const html =
        shape === "triangle"
            ? `<div style="width:0;height:0;border-left:${size / 2 + 2}px solid transparent;border-right:${size / 2 + 2}px solid transparent;border-bottom:${size + 2}px solid ${color};filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));opacity:${opts.dim ? 0.5 : 1}"></div>`
            : `<div style="${base}border-radius:${shape === "circle" ? "50%" : "4px"};${shape === "diamond" ? "transform:rotate(45deg) scale(.85);" : ""}"></div>`;
    return L.divIcon({ className: "", html, iconSize: [size + 4, size + 4], iconAnchor: [(size + 4) / 2, (size + 4) / 2], popupAnchor: [0, -size / 2] });
}

export const centerIcon = L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:var(--nn-accent);border:3px solid #fff;box-shadow:0 0 0 6px color-mix(in srgb, var(--nn-accent) 22%, transparent),0 1px 3px rgba(0,0,0,.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

export function clusterIcon(count: number) {
    const size = count < 10 ? 36 : count < 100 ? 42 : 48;
    return L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--nn-accent);color:var(--nn-on-accent);border:3px solid #fff;display:flex;align-items:center;justify-content:center;font:700 14px/1 var(--font-sans);box-shadow:0 2px 8px rgba(0,0,0,.3)">${count}</div>`,
        className: "custom-cluster-icon",
        iconSize: L.point(size, size, true),
    });
}
