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
        map.flyTo(center, zoom, {
            animate: true,
            duration: 1.5
        });
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
