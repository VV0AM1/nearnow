import { useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";

export function MapController({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
    const map = useMapEvents({
        zoomend() {
            onZoomChange(map.getZoom());
        }
    });
    return null;
}

export function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        map.setView(center, zoom, { animate: !reduce });
    }, [center, zoom, map]);
    return null;
}

export function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, long: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}
