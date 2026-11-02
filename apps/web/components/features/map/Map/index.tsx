"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type MapGeoJSONFeature } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORIES, getCategory, type MarkerShape } from "@/config/categories";
import { circleRing } from "@/lib/geo";
import { MapProps } from "./Map.types";

/** OpenFreeMap vector styles: free, no API key — the same tiles as the Android app. */
const STYLE = {
    light: process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT || "https://tiles.openfreemap.org/styles/positron",
    dark: process.env.NEXT_PUBLIC_MAP_STYLE_DARK || "https://tiles.openfreemap.org/styles/dark",
};
const ACCENT = { light: "#2459e0", dark: "#5b8cff" };
const ON_ACCENT = { light: "#ffffff", dark: "#04122e" };

/** Draws a category marker (colour + shape) for the symbol layer. */
function markerImage(hex: string, shape: MarkerShape): ImageData {
    const s = 44; // drawn at 2x for sharpness
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d")!;
    g.fillStyle = hex;
    g.strokeStyle = "#ffffff";
    g.lineWidth = 5;
    g.shadowColor = "rgba(0,0,0,.35)";
    g.shadowBlur = 4;
    g.beginPath();
    if (shape === "circle") g.arc(s / 2, s / 2, 15, 0, Math.PI * 2);
    else if (shape === "square") g.roundRect(8, 8, s - 16, s - 16, 5);
    else if (shape === "diamond") {
        g.moveTo(s / 2, 4);
        g.lineTo(s - 4, s / 2);
        g.lineTo(s / 2, s - 4);
        g.lineTo(4, s / 2);
        g.closePath();
    } else {
        g.moveTo(s / 2, 4);
        g.lineTo(s - 4, s - 7);
        g.lineTo(4, s - 7);
        g.closePath();
    }
    g.fill();
    g.shadowBlur = 0;
    g.stroke();
    return g.getImageData(0, 0, s, s);
}

type Post = { id: string; title: string; category: string; latitude: number; longitude: number; status?: string; isStale?: boolean };

function toGeoJSON(posts: Post[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: posts
            .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
            .map((p) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
                properties: { id: p.id, title: p.title, category: getCategory(p.category).id, dim: (p.status !== undefined && p.status !== "ACTIVE") || !!p.isStale },
            })),
    };
}

function areaGeoJSON(center: [number, number], km?: number): GeoJSON.FeatureCollection {
    if (!km) return { type: "FeatureCollection", features: [] };
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circleRing(center[0], center[1], km)] } }] };
}

/**
 * MapLibre GL map. Pure view: filtering and panels live in the page using it.
 * Post titles are set with textContent in popups (never as HTML).
 */
export default function Map({ posts, center, zoom = 14, radius, onMapClick, interactiveOnly = false, highlightedPostId, onSelectPost, showZoom }: MapProps) {
    const { resolved } = useTheme();
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const centerMarker = useRef<maplibregl.Marker | null>(null);
    const latest = useRef({ posts, radius, center, onMapClick, onSelectPost, highlightedPostId, interactiveOnly, resolved });
    latest.current = { posts, radius, center, onMapClick, onSelectPost, highlightedPostId, interactiveOnly, resolved };

    // (Re)build sources and layers — after creation and after every style switch.
    const installLayers = () => {
        const m = map.current;
        const l = latest.current;
        if (!m || !l.center) return;
        const accent = ACCENT[l.resolved];
        for (const c of CATEGORIES) if (!m.hasImage(`cat-${c.id}`)) m.addImage(`cat-${c.id}`, markerImage(c.hex, c.shape), { pixelRatio: 2 });

        m.addSource("area", { type: "geojson", data: areaGeoJSON(l.center, l.interactiveOnly ? undefined : l.radius) });
        m.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": accent, "fill-opacity": 0.07 } });
        m.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": accent, "line-width": 1.5 } });

        m.addSource("posts", { type: "geojson", data: toGeoJSON(l.interactiveOnly ? [] : l.posts), cluster: true, clusterRadius: 48, clusterMaxZoom: 16 });
        m.addLayer({
            id: "clusters",
            type: "circle",
            source: "posts",
            filter: ["has", "point_count"],
            paint: { "circle-color": accent, "circle-radius": ["step", ["get", "point_count"], 17, 10, 20, 100, 24], "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 },
        });
        m.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "posts",
            filter: ["has", "point_count"],
            layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13, "text-font": ["Noto Sans Bold"], "text-allow-overlap": true },
            paint: { "text-color": ON_ACCENT[l.resolved] },
        });
        m.addLayer({
            id: "points",
            type: "symbol",
            source: "posts",
            filter: ["!", ["has", "point_count"]],
            layout: { "icon-image": ["concat", "cat-", ["get", "category"]], "icon-allow-overlap": true, "icon-size": ["case", ["==", ["get", "id"], l.highlightedPostId ?? ""], 1.35, 1] },
            paint: { "icon-opacity": ["case", ["get", "dim"], 0.5, 1] },
        });
    };

    // Create once.
    useEffect(() => {
        if (!container.current || !center) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const m = new maplibregl.Map({
            container: container.current,
            style: STYLE[resolved],
            center: [center[1], center[0]],
            zoom,
            attributionControl: { compact: true },
            dragRotate: false,
            pitchWithRotate: false,
            fadeDuration: reduce ? 0 : 200,
        });
        m.touchZoomRotate.disableRotation();
        if (showZoom) m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
        map.current = m;

        const el = document.createElement("div");
        el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${ACCENT[resolved]};border:3px solid #fff;box-shadow:0 0 0 6px ${ACCENT[resolved]}33,0 1px 3px rgba(0,0,0,.3)`;
        el.setAttribute("aria-hidden", "true");
        centerMarker.current = new maplibregl.Marker({ element: el }).setLngLat([center[1], center[0]]).addTo(m);

        m.on("style.load", installLayers);

        m.on("click", "clusters", (e) => {
            const f = e.features?.[0] as MapGeoJSONFeature | undefined;
            if (!f) return;
            void (m.getSource("posts") as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id as number).then((z) =>
                m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: z, duration: reduce ? 0 : 400 }),
            );
        });
        m.on("click", "points", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const id = String(f.properties.id);
            if (latest.current.onSelectPost) return latest.current.onSelectPost(id);
            const c = getCategory(String(f.properties.category));
            const box = document.createElement("div");
            box.className = "w-56 space-y-1.5 p-3.5";
            const cat = document.createElement("p");
            cat.className = "text-xs font-semibold text-muted-foreground";
            cat.textContent = c.label;
            const title = document.createElement("p");
            title.className = "text-sm font-semibold leading-snug";
            title.textContent = String(f.properties.title);
            const link = document.createElement("a");
            link.className = "inline-block text-[13px] font-semibold text-primary";
            link.href = `/post/${encodeURIComponent(id)}`;
            link.textContent = "View post →";
            box.append(cat, title, link);
            new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: "260px" }).setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number]).setDOMContent(box).addTo(m);
        });
        for (const layer of ["clusters", "points"]) {
            m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"));
            m.on("mouseleave", layer, () => (m.getCanvas().style.cursor = ""));
        }
        m.on("click", (e) => {
            if (!latest.current.onMapClick) return;
            if (m.queryRenderedFeatures(e.point, { layers: ["clusters", "points"].filter((l) => m.getLayer(l)) }).length) return;
            latest.current.onMapClick(e.lngLat.lat, e.lngLat.lng);
            centerMarker.current?.setLngLat(e.lngLat);
        });

        return () => {
            m.remove();
            map.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Theme switch: swap the basemap; layers are re-added on style.load.
    const styleShown = useRef(resolved);
    useEffect(() => {
        if (styleShown.current === resolved) return;
        styleShown.current = resolved;
        map.current?.setStyle(STYLE[resolved]);
    }, [resolved]);

    useEffect(() => {
        (map.current?.getSource("posts") as GeoJSONSource | undefined)?.setData(toGeoJSON(interactiveOnly ? [] : posts));
    }, [posts, interactiveOnly]);

    useEffect(() => {
        if (!center) return;
        (map.current?.getSource("area") as GeoJSONSource | undefined)?.setData(areaGeoJSON(center, interactiveOnly ? undefined : radius));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center?.[0], center?.[1], radius, interactiveOnly]);

    useEffect(() => {
        const m = map.current;
        if (!m || !center) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        m.easeTo({ center: [center[1], center[0]], duration: reduce ? 0 : 500 });
        centerMarker.current?.setLngLat([center[1], center[0]]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center?.[0], center?.[1]]);

    useEffect(() => {
        const m = map.current;
        if (!m?.getLayer("points")) return;
        m.setLayoutProperty("points", "icon-size", ["case", ["==", ["get", "id"], highlightedPostId ?? ""], 1.35, 1]);
        const p = highlightedPostId ? posts.find((x) => x.id === highlightedPostId) : null;
        if (p) m.easeTo({ center: [p.longitude, p.latitude], duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 400 });
    }, [highlightedPostId, posts]);

    if (!center) {
        return <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Choose an area to see the map.</div>;
    }
    return <div ref={container} className="h-full w-full" role="region" aria-label="Map of posts" />;
}
