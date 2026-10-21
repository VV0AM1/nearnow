"use client";

import { useEffect, useState } from "react";
import { Bell, Navigation } from "lucide-react";
import { useNotifications } from "../../../context/NotificationContext";
import { useDashboard } from "../../../context/DashboardContext";
import { useToast } from "../../../components/ui/use-toast";
import { POST_CATEGORIES } from "@/config/categories";
import { Button, Card, Chip, Segmented, Switch } from "@/components/nn";

const RADII = ["1", "2", "5", "10"] as const;

/**
 * Alert preferences. Alerts are opt-in: nothing is sent until categories and an
 * area are chosen. The area defaults to the one the user follows; the device
 * location is used only if they ask for it.
 */
export default function NotificationSettings() {
    const { settings, updateSettings, loading } = useNotifications();
    const { location } = useDashboard();
    const { toast } = useToast();
    const [enabled, setEnabled] = useState(false);
    const [radius, setRadius] = useState<(typeof RADII)[number]>("2");
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        if (!settings) return;
        setEnabled(!settings.paused);
        const r = String(Math.round(settings.radiusKm)) as (typeof RADII)[number];
        setRadius(RADII.includes(r) ? r : "2");
        setCategories(settings.categories);
    }, [settings]);

    const save = async (center?: { latitude: number; longitude: number; areaLabel: string }) => {
        const area = center ?? (location ? { latitude: location.lat, longitude: location.long, areaLabel: location.label ?? "Chosen area" } : null);
        if (enabled && !area) {
            toast({ variant: "destructive", title: "Choose an area first", description: "Alerts need an area to watch." });
            return;
        }
        try {
            await updateSettings({ paused: !enabled, radiusKm: Number(radius), categories, ...(area ?? {}) });
            toast({ title: "Alert settings saved", description: enabled ? `Watching ${area?.areaLabel} within ${radius} km.` : "Alerts are paused." });
        } catch (e) {
            toast({ variant: "destructive", title: "Not saved", description: e instanceof Error ? e.message : undefined });
        }
    };

    const useDevice = () => {
        if (!("geolocation" in navigator)) return toast({ variant: "destructive", title: "Location unavailable", description: "Your browser cannot share its location." });
        navigator.geolocation.getCurrentPosition(
            (p) => void save({ latitude: p.coords.latitude, longitude: p.coords.longitude, areaLabel: "My location" }),
            (err) => toast({ variant: "destructive", title: "Location not shared", description: err.code === 1 ? "Allow location access, or use your chosen area." : "Try again." }),
        );
    };

    const toggle = (id: string) => setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

    return (
        <Card className="space-y-5">
            <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#FF3B30] text-white">
                    <Bell className="size-[18px]" aria-hidden />
                </span>
                <div className="flex-1">
                    <p className="text-[15px] font-semibold">Nearby alerts</p>
                    <p className="text-[13px] text-muted-foreground">
                        {settings?.hasAlertArea && settings.areaLabel ? `Watching ${settings.areaLabel} within ${settings.radiusKm} km` : "Off until you choose categories and an area"}
                    </p>
                </div>
                <Switch checked={enabled} onChange={setEnabled} label="Nearby alerts" />
            </div>

            <fieldset disabled={!enabled} className="space-y-5 disabled:opacity-50">
                <div className="space-y-2">
                    <p className="text-[13px] font-semibold">Distance</p>
                    <Segmented label="Alert distance" value={radius} onChange={setRadius} options={RADII.map((r) => ({ value: r, label: `${r} km` }))} />
                </div>
                <div className="space-y-2">
                    <p className="text-[13px] font-semibold">Tell me about</p>
                    <div className="flex flex-wrap gap-2">
                        {POST_CATEGORIES.map((c) => (
                            <Chip key={c.id} label={c.id === "DANGER" ? "Urgent help (within 3 km)" : c.label} icon={c.icon} color={c.hex} selected={categories.includes(c.id)} onClick={() => toggle(c.id)} />
                        ))}
                    </div>
                </div>
            </fieldset>

            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="plain" size="sm" icon={Navigation} onClick={useDevice} disabled={!enabled}>
                    Use my current location instead
                </Button>
                <Button onClick={() => save()} loading={loading}>
                    Save
                </Button>
            </div>
        </Card>
    );
}
