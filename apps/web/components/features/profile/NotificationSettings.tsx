"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "../../../hooks/useNotifications";
import { Bell, MapPin, Save } from "lucide-react";

export default function NotificationSettings() {
    const { settings, updateSettings, loading } = useNotifications();
    const [radius, setRadius] = useState(5);
    const [categories, setCategories] = useState<string[]>([]);
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (settings) {
            setRadius(settings.radiusKm);
            setCategories(settings.categories);
            setEnabled(settings.pushEnabled);
        }
    }, [settings]);

    const handleSave = () => {
        // Use browser geolocation for "Home Base"
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                updateSettings({
                    radiusKm: radius,
                    categories,
                    pushEnabled: enabled,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                alert("Settings Saved with current location as center!");
            }, (err) => {
                // If location denied, save without updating location? 
                // Or user must allow location.
                alert("Location access needed to set radius center.");
            });
        }
    };

    const toggleCategory = (cat: string) => {
        if (categories.includes(cat)) {
            setCategories(categories.filter(c => c !== cat));
        } else {
            setCategories([...categories, cat]);
        }
    };

    const ALL_CATEGORIES = ["CRIME", "SAFETY", "LOST_FOUND", "EVENT", "RECOMMENDATION", "GENERAL"];

    return (
        <div className="glass-card p-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5 text-primary" />
                Notification Alerts
            </h2>

            <div className="space-y-6">
                {/* Master Switch */}
                <div className="flex items-center justify-between">
                    <span className="font-medium">Enable Alerts</span>
                    <button
                        onClick={() => setEnabled(!enabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-primary' : 'bg-muted'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Radius Slider */}
                <div className={`space-y-2 transition-opacity ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex justify-between text-sm">
                        <span>Radius</span>
                        <span className="font-mono text-primary">{radius} km</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={radius}
                        onChange={(e) => setRadius(parseFloat(e.target.value))}
                        className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Alerts will be centered on your location when you save.
                    </p>
                </div>

                {/* Categories */}
                <div className={`space-y-3 transition-opacity ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <label className="text-sm font-medium">Categories</label>
                    <div className="flex flex-wrap gap-2">
                        {ALL_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${categories.includes(cat)
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold hover:bg-primary/90 transition-all flex justify-center items-center gap-2"
                >
                    {loading ? "Saving..." : <><Save className="h-4 w-4" /> Save Preferences</>}
                </button>
            </div>
        </div>
    );
}
