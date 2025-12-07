"use client";

import { useState, useEffect } from "react";
import { Loader2, X, MapPin, Camera, AlertTriangle } from "lucide-react";
import { getToken, getUserId } from "../../../lib/auth";
import LocationSearch from "../feed/LocationSearch";
import MapLoader from "../map/MapLoader";

const CATEGORIES = [
    "GENERAL",
    "CRIME",
    "SAFETY",
    "LOST_FOUND",
    "EVENT",
    "RECOMMENDATION"
];

interface CreateAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    userLocation: { lat: number; long: number };
}

export default function CreateAlertModal({ isOpen, onClose, userLocation }: CreateAlertModalProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("GENERAL");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);

    // Default to userLocation, but allow override
    const [selectedLocation, setSelectedLocation] = useState(userLocation);
    const [addressDisplay, setAddressDisplay] = useState("");
    const [isPickingLocation, setIsPickingLocation] = useState(false);

    // Helper to get address name
    const reverseGeocode = async (lat: number, long: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`);
            const data = await res.json();
            if (data.display_name) {
                setAddressDisplay(data.display_name.split(",").slice(0, 3).join(",")); // Keep it short
            }
        } catch (e) {
            console.error("Reverse geocode failed", e);
        }
    };

    // Initial reverse geocode for user location on mount (only if we have valid coords)
    useEffect(() => {
        if (userLocation.lat && userLocation.long && !addressDisplay) {
            // Update selected location to match initial props if not modified yet
            // Actually `selectedLocation` init state handles this, but let's sync address
            reverseGeocode(userLocation.lat, userLocation.long);
        }
    }, [userLocation]); // Run when userLocation resolves

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) {
            alert("You must be logged in to post.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("http://localhost:3002/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // "Authorization": `Bearer ${token}` // Future proofing
                },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.long,
                    imageUrl: imageUrl || null,
                    authorId: getUserId() || "demo-user"
                })
            });

            if (!res.ok) throw new Error("Failed to create post");

            // Persist the location of the new post as the current view
            // This ensures the map centers on the new post after reload, solving the "reset" issue
            localStorage.setItem("userLocation", JSON.stringify({
                lat: selectedLocation.lat,
                long: selectedLocation.long
            }));

            onClose();
            window.location.reload();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="glass-card max-w-lg w-full p-6 border-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                </button>

                <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <AlertTriangle className="text-primary h-6 w-6" />
                    Create Neighborhood Alert
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g. Lost Dog on 4th St"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                            placeholder="Details about the incident..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                        <div className="relative">
                            <Camera className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        {isPickingLocation ? (
                            <div className="space-y-2">
                                <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border relative">
                                    <MapLoader
                                        posts={[]}
                                        center={selectedLocation}
                                        onMapClick={(lat, long) => {
                                            setSelectedLocation({ lat, long });
                                            // Show immediate feedback, then fetch real name
                                            setAddressDisplay("Fetching address...");
                                            reverseGeocode(lat, long);
                                        }}
                                    />
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full z-[1000] pointer-events-none">
                                        Tap anywhere to pin
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsPickingLocation(false)}
                                        className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-all font-sm"
                                    >
                                        Confirm Location
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-1">Location</label>
                                <div className="flex gap-2 mb-2">
                                    <div className="flex-1">
                                        <LocationSearch
                                            biasLocation={userLocation}
                                            onLocationSelect={(lat, long, displayName) => {
                                                setSelectedLocation({ lat, long });
                                                setAddressDisplay(displayName);
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPickingLocation(true)}
                                        className="h-10 px-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors border border-input"
                                        title="Pick on Map"
                                    >
                                        <MapPin className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/10 p-2 rounded mt-2">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="line-clamp-1">
                                        {addressDisplay || `Current: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.long.toFixed(4)}`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isPickingLocation && (
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Post Alert"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
