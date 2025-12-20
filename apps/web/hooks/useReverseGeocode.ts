import { useState, useCallback } from "react";

export function useReverseGeocode() {
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const reverseGeocode = useCallback(async (lat: number, long: number) => {
        setLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`);
            const data = await res.json();
            if (data.display_name) {
                // Keep it short: first 3 parts
                const shortAddress = data.display_name.split(",").slice(0, 3).join(",");
                setAddress(shortAddress);
                return shortAddress;
            }
        } catch (e) {
            console.error("Reverse geocode failed", e);
        } finally {
            setLoading(false);
        }
        return "";
    }, []);

    return { address, setAddress, loading, reverseGeocode };
}
