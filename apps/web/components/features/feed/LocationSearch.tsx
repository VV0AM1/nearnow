"use client";

import { useId, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { useLocationSearch, type GeoResult } from "../../../hooks/useLocationSearch";

interface LocationSearchProps {
    onLocationSelect: (lat: number, lon: number, displayName: string) => void;
    biasLocation?: { lat: number; long: number };
    placeholder?: string;
}

/** Place search (OpenStreetMap Nominatim, debounced) with an accessible result list. */
export default function LocationSearch({ onLocationSelect, biasLocation, placeholder = "Search a city or address" }: LocationSearchProps) {
    const { query, setQuery, results, loading, clearResults } = useLocationSearch(biasLocation);
    const [open, setOpen] = useState(false);
    const listId = useId();

    const handleSelect = (result: GeoResult) => {
        onLocationSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
        setQuery(result.display_name.split(",")[0]);
        setOpen(false);
        clearResults();
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle" aria-hidden />
                <input
                    role="combobox"
                    aria-expanded={open && results.length > 0}
                    aria-controls={listId}
                    aria-label={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
                    placeholder={placeholder}
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-[15px] placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
                {loading ? <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-subtle" aria-hidden /> : null}
            </div>

            {open && results.length > 0 ? (
                <ul id={listId} role="listbox" className="custom-scrollbar absolute left-0 top-full z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-[14px] bg-elevated p-1 shadow-[var(--shadow-float)]">
                    {results.map((result) => (
                        <li key={result.place_id} role="option" aria-selected={false}>
                            <button type="button" onClick={() => handleSelect(result)} className="flex w-full items-start gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-sm hover:bg-surface-2">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                                <span className="line-clamp-2">{result.display_name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}

            {open && !loading && results.length === 0 && query.length > 2 ? (
                <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-[14px] bg-elevated p-4 text-center text-sm text-muted-foreground shadow-[var(--shadow-float)]">No places found.</div>
            ) : null}
        </div>
    );
}
