"use client";

import { useState } from "react";
import { ChevronRight, Loader2, MapPin, Navigation } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { Banner, ListGroup } from "@/components/nn";
import LocationSearch from "@/components/features/feed/LocationSearch";

/** Pilot cities that work without location permission. */
export const PILOT_CITIES = [
    { label: "Barcelona", lat: 41.3851, long: 2.1734 },
    { label: "L'Hospitalet de Llobregat", lat: 41.3596, long: 2.1002 },
    { label: "Badalona", lat: 41.45, long: 2.2474 },
];

/**
 * Area choice: device location (asked for only on click, explained first), a pilot
 * city, or any searched place. Never a silent default.
 */
export function AreaChooser({ onChosen }: { onChosen?: () => void }) {
    const { setLocation, location } = useDashboard();
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const choose = (loc: { lat: number; long: number; label: string }) => {
        setLocation(loc);
        onChosen?.();
    };

    const useMyLocation = () => {
        if (!("geolocation" in navigator)) {
            setError("Your browser cannot share its location. Choose a city instead.");
            return;
        }
        setLocating(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocating(false);
                choose({ lat: pos.coords.latitude, long: pos.coords.longitude, label: "Near you" });
            },
            (err) => {
                setLocating(false);
                setError(err.code === 1 ? "Location permission was not given. Choose a city instead." : "We couldn't get your location. Try again or choose a city.");
            },
            { timeout: 15000 },
        );
    };

    return (
        <div className="space-y-5">
            <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="flex w-full items-center gap-4 rounded-[18px] border-[1.5px] border-primary bg-surface p-4 text-left transition-colors hover:bg-primary-soft disabled:opacity-70"
            >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    {locating ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Navigation className="size-5" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold">{locating ? "Finding your location…" : "Use my current location"}</span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">Your location is only used for the area you choose. You can change it any time.</span>
                </span>
                <ChevronRight className="size-4 text-subtle" aria-hidden />
            </button>

            {error ? <Banner tone="warning" icon={MapPin} message={error} /> : null}

            <div className="space-y-2">
                <p className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Pilot cities</p>
                <ListGroup>
                    {PILOT_CITIES.map((c) => (
                        <button
                            key={c.label}
                            type="button"
                            onClick={() => choose(c)}
                            aria-pressed={location?.label === c.label}
                            className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-[15px] transition-colors hover:bg-surface-2"
                        >
                            <MapPin className="size-[18px] text-primary" aria-hidden />
                            <span className="flex-1">{c.label}</span>
                            {location?.label === c.label ? <span className="text-[13px] font-semibold text-primary">Current</span> : <ChevronRight className="size-4 text-subtle" aria-hidden />}
                        </button>
                    ))}
                </ListGroup>
                <p className="px-1 text-[13px] text-muted-foreground">NearNow is in a pilot around Barcelona. Other areas may have few posts.</p>
            </div>

            <div className="space-y-2">
                <p className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Somewhere else</p>
                <LocationSearch onLocationSelect={(lat, long, name) => choose({ lat, long, label: name.split(",")[0] })} biasLocation={location ?? undefined} />
            </div>
        </div>
    );
}
