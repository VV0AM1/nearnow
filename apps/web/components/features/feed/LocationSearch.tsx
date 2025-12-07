"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface LocationSearchProps {
    onLocationSelect: (lat: number, lon: number, displayName: string) => void;
}

export default function LocationSearch({ onLocationSelect, biasLocation }: LocationSearchProps & { biasLocation?: { lat: number; long: number } }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                handleSearch();
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setOpen(true);
        try {
            let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

            // Bias results towards user location if available
            if (biasLocation) {
                // Approximate bounding box (roughly 50km)
                const viewbox = `${biasLocation.long - 0.5},${biasLocation.lat + 0.5},${biasLocation.long + 0.5},${biasLocation.lat - 0.5}`;
                url += `&viewbox=${viewbox}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: any) => {
        onLocationSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
        setQuery(result.display_name.split(",")[0]); // Just keep the first part (e.g. City Name)
        setOpen(false);
        setResults([]);
    };

    return (
        <div className="relative w-full">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search city or address..."
                        className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-primary text-primary-foreground px-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
            </div>

            {open && results.length > 0 && (
                <div className="absolute top-full mt-2 left-0 w-full bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto custom-scrollbar">
                    {results.map((result) => (
                        <button
                            key={result.place_id}
                            onClick={() => handleSelect(result)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-secondary/50 border-b border-border/50 last:border-0 transition-colors flex items-start gap-2"
                        >
                            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{result.display_name}</span>
                        </button>
                    ))}
                </div>
            )}

            {open && !loading && results.length === 0 && query && (
                <div className="absolute top-full mt-2 left-0 w-full bg-card p-4 text-center text-sm text-muted-foreground border border-border rounded-xl shadow-lg z-50">
                    No results found.
                </div>
            )}
        </div>
    );
}
