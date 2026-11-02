"use client";

import { useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

/** Pilot cities that work without location permission. */
export const PILOT_CITIES = [
    { label: "Barcelona", lat: 41.3851, long: 2.1734 },
    { label: "L'Hospitalet de Llobregat", lat: 41.3596, long: 2.1002 },
    { label: "Badalona", lat: 41.45, long: 2.2474 },
];

/** Shown when no area has been chosen. Location is requested only when the user clicks. */
export default function AreaPrompt() {
    const { setLocation } = useDashboard();
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                setLocation({ lat: pos.coords.latitude, long: pos.coords.longitude, label: "Near you" });
            },
            (err) => {
                setLocating(false);
                setError(err.code === 1 ? "Location permission was not given. Choose a city instead." : "We couldn't get your location. Try again or choose a city.");
            },
            { timeout: 15000 },
        );
    };

    return (
        <div className="max-w-lg mx-auto mt-28 p-6 rounded-2xl border border-border bg-card space-y-4">
            <h1 className="text-2xl font-bold">Which area do you want to follow?</h1>
            <p className="text-sm text-muted-foreground">
                NearNow shows community posts around the area you choose. Your location is only used when you click the button below.
            </p>
            <button onClick={useMyLocation} disabled={locating} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-bold py-3 disabled:opacity-60">
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                Use my current location
            </button>
            {error && <p className="text-sm text-amber-600" role="alert">{error}</p>}
            <div className="space-y-2">
                <p className="text-sm font-medium">Or choose a city</p>
                {PILOT_CITIES.map((c) => (
                    <button key={c.label} onClick={() => setLocation(c)} className="w-full flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-left hover:bg-secondary">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {c.label}
                    </button>
                ))}
                <p className="text-xs text-muted-foreground">NearNow is in a pilot around Barcelona. Other areas may have few posts.</p>
            </div>
        </div>
    );
}
