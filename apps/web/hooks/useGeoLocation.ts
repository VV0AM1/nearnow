import { useState, useEffect } from "react";

interface GeoLocationState {
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    loading: boolean;
}

export function useGeoLocation() {
    const [location, setLocation] = useState<GeoLocationState>({
        latitude: null,
        longitude: null,
        error: null,
        loading: false,
    });

    // Load from localStorage on mount
    useEffect(() => {
        const cached = localStorage.getItem("userLocation");
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.lat && parsed.long) {
                    setLocation(prev => ({
                        ...prev,
                        latitude: parsed.lat,
                        longitude: parsed.long
                    }));
                }
            } catch (e) {
                console.error("Failed to parse cached location", e);
            }
        }
    }, []);

    const getUserLocation = () => {
        if (!("geolocation" in navigator)) {
            setLocation((prev) => ({ ...prev, error: "Geolocation not supported" }));
            return;
        }

        setLocation((prev) => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const long = position.coords.longitude;

                // Save to storage
                localStorage.setItem("userLocation", JSON.stringify({ lat, long }));

                setLocation({
                    latitude: lat,
                    longitude: long,
                    error: null,
                    loading: false,
                });
            },
            (error) => {
                setLocation({
                    latitude: null,
                    longitude: null,
                    error: error.message,
                    loading: false,
                });
            }
        );
    };

    return { location, getUserLocation };
}
