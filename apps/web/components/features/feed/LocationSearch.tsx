"use client";

import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useLocationSearch } from "../../../hooks/useLocationSearch";

interface LocationSearchProps {
    onLocationSelect: (lat: number, lon: number, displayName: string) => void;
    biasLocation?: { lat: number; long: number };
}

export default function LocationSearch({ onLocationSelect, biasLocation }: LocationSearchProps) {
    const { query, setQuery, results, loading, clearResults } = useLocationSearch(biasLocation);
    const [open, setOpen] = useState(false);

    // Sync open state with results availability
    // Note: useLocationSearch handles the debouncing and fetching

    const handleSelect = (result: any) => {
        onLocationSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
        setQuery(result.display_name.split(",")[0]);
        setOpen(false);
        clearResults();
    };

    return (
        <div className="relative w-full">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        placeholder="Search city or address..."
                        className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                </div>
                {/* Search icon is decorative mainly since it auto-searches, but can force trigger if needed */}
                <div className="flex items-center justify-center px-4 bg-primary text-primary-foreground rounded-xl">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>
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

            {open && !loading && results.length === 0 && query.length > 2 && (
                <div className="absolute top-full mt-2 left-0 w-full bg-card p-4 text-center text-sm text-muted-foreground border border-border rounded-xl shadow-lg z-50">
                    No results found.
                </div>
            )}
        </div>
    );
}
