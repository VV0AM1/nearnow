"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { MapProps } from "./Map/Map.types";

// Leaflet touches window, so the map only renders in the browser.
const Map = dynamic(() => import("./Map"), {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-surface-2" aria-label="Loading map" />,
});

export default function MapLoader({ center, ...rest }: Omit<MapProps, "center"> & { center?: { lat: number; long: number } }) {
    const mapCenter: [number, number] | undefined = useMemo(() => (center ? [center.lat, center.long] : undefined), [center?.lat, center?.long]);
    return <Map center={mapCenter} {...rest} />;
}
