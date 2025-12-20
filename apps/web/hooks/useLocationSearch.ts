import { useState, useEffect } from "react";

export interface GeoResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

export function useLocationSearch(biasLocation?: { lat: number; long: number }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeoResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

            if (biasLocation) {
                const viewbox = `${biasLocation.long - 0.5},${biasLocation.lat + 0.5},${biasLocation.long + 0.5},${biasLocation.lat - 0.5}`;
                url += `&viewbox=${viewbox}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error("Geocoding error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const clearResults = () => {
        setResults([]);
    };

    return { query, setQuery, results, loading, clearResults };
}
