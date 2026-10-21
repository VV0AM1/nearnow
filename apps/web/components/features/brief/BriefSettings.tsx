"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Sparkles, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { SavedArea } from "@/lib/brief";
import { useDashboard } from "@/context/DashboardContext";
import { useToast } from "@/components/ui/use-toast";
import { POST_CATEGORIES } from "@/config/categories";
import { Banner, Button, Card, Chip, IconButton, ListGroup, ListRow, Skeleton, Switch } from "@/components/nn";

interface Prefs {
    enabled: boolean;
    categories: string[];
}

/** Brief on/off, topics, and up to five saved areas the user chose themselves. */
export function BriefSettings() {
    const { location } = useDashboard();
    const { toast } = useToast();
    const [prefs, setPrefs] = useState<Prefs | null>(null);
    const [areas, setAreas] = useState<SavedArea[]>([]);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        const [p, a] = await Promise.all([apiFetch<Prefs>("/brief/preferences"), apiFetch<SavedArea[]>("/brief/areas")]);
        setPrefs(p);
        setAreas(a);
    }, []);
    useEffect(() => {
        load().catch(() => setPrefs({ enabled: true, categories: [] }));
    }, [load]);

    const update = async (patch: Partial<Prefs>) => {
        if (!prefs) return;
        const prev = prefs;
        setPrefs({ ...prefs, ...patch });
        try {
            setPrefs(await apiFetch<Prefs>("/brief/preferences", { method: "PATCH", json: patch }));
        } catch (e) {
            setPrefs(prev);
            toast({ variant: "destructive", title: "Not saved", description: e instanceof Error ? e.message : undefined });
        }
    };

    const saveCurrent = async () => {
        if (!location) return;
        setSaving(true);
        try {
            const created = await apiFetch<SavedArea>("/brief/areas", { method: "POST", json: { label: location.label ?? "My area", latitude: location.lat, longitude: location.long, radiusKm: 2 } });
            setAreas((a) => [...a, created]);
            toast({ title: "Area saved" });
        } catch (e) {
            toast({ variant: "destructive", title: "Not saved", description: e instanceof Error ? e.message : undefined });
        } finally {
            setSaving(false);
        }
    };

    const remove = async (a: SavedArea) => {
        try {
            await apiFetch(`/brief/areas/${a.id}`, { method: "DELETE" });
            setAreas((list) => list.filter((x) => x.id !== a.id));
        } catch (e) {
            toast({ variant: "destructive", title: "Not removed", description: e instanceof Error ? e.message : undefined });
        }
    };

    if (!prefs) return <Skeleton className="h-40 w-full rounded-[20px]" />;
    const toggle = (id: string) => void update({ categories: prefs.categories.includes(id) ? prefs.categories.filter((c) => c !== id) : [...prefs.categories, id] });

    return (
        <div className="space-y-4">
            <Card className="space-y-5">
                <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#AF52DE] text-white">
                        <Sparkles className="size-[18px]" aria-hidden />
                    </span>
                    <div className="flex-1">
                        <p className="text-[15px] font-semibold">Show the brief on the feed</p>
                        <p className="text-[13px] text-muted-foreground">A short summary of what changed in your area since you last looked.</p>
                    </div>
                    <Switch checked={prefs.enabled} onChange={(v) => void update({ enabled: v })} label="Show the local brief" />
                </div>
                <fieldset disabled={!prefs.enabled} className="space-y-2 disabled:opacity-50">
                    <legend className="mb-2 text-[13px] font-semibold">Topics</legend>
                    <div className="flex flex-wrap gap-2">
                        {POST_CATEGORIES.map((c) => (
                            <Chip key={c.id} label={c.label} icon={c.icon} color={c.hex} selected={prefs.categories.includes(c.id)} onClick={() => toggle(c.id)} />
                        ))}
                    </div>
                    <p className="text-[13px] text-muted-foreground">Leave all off to include every topic.</p>
                </fieldset>
            </Card>

            <div className="space-y-2">
                <p className="px-1 text-[13px] text-muted-foreground">Saved areas — up to 5 places you follow, like home or work. They are never detected automatically.</p>
                <ListGroup>
                    {areas.map((a) => (
                        <ListRow key={a.id} title={a.label} subtitle={`${a.radiusKm} km`} icon={MapPin} iconColor="#34C759" right={<IconButton icon={Trash2} label={`Remove ${a.label}`} size="sm" className="text-danger" onClick={() => void remove(a)} />} />
                    ))}
                    <div className="p-3">
                        <Button variant="tinted" icon={Plus} block loading={saving} disabled={!location || areas.length >= 5} onClick={saveCurrent}>
                            Save current area{location?.label ? ` (${location.label})` : ""}
                        </Button>
                    </div>
                </ListGroup>
            </div>
            <Banner message="Brief notifications are not sent yet. Nearby alerts are set in the Alerts section above." />
        </div>
    );
}
