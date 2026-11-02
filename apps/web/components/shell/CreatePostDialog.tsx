"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, MapPin, ShieldCheck, X } from "lucide-react";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { POST_CATEGORIES } from "@/config/categories";
import { Banner, Button, Chip, Dialog, Switch, TextArea, TextField } from "@/components/nn";
import LocationSearch from "@/components/features/feed/LocationSearch";
import MapLoader from "@/components/features/map/MapLoader";
import { cn } from "@/lib/utils";

const TITLE_MAX = 120;
const CONTENT_MAX = 2000;
const ITEM_TYPES = [
    ["KEYS", "Keys"],
    ["WALLET_BAG", "Wallet or bag"],
    ["ELECTRONICS", "Phone or electronics"],
    ["DOCUMENT", "ID or document"],
    ["PET", "Pet"],
    ["CLOTHING", "Clothing"],
    ["OTHER", "Other"],
] as const;
type LfWindow = "today" | "yesterday" | "week";

const GUIDANCE: Record<string, string> = {
    GENERAL: "A useful local update: closures, works, noise, deliveries…",
    EVENT: "A community event, market or meeting. Add the date and place.",
    LOST_FOUND: "Something you lost or found. Describe it without private details.",
    RECOMMENDATION: "A local place or service worth knowing about.",
    SAFETY: "A hazard others should know about, like a broken pavement or flooding.",
    CRIME: "Something you witnessed. Describe what happened, not who — never name or accuse people.",
};

function windowRange(w: LfWindow, now = new Date()) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (w === "today") return { from: startOfToday, to: now };
    if (w === "yesterday") return { from: new Date(startOfToday.getTime() - 86_400_000), to: startOfToday };
    return { from: new Date(now.getTime() - 7 * 86_400_000), to: now };
}

/** New post: category tiles, details, location (search or pin) and privacy options in one sheet. */
export function CreatePostDialog({ open, onClose, origin }: { open: boolean; onClose: () => void; origin: { lat: number; long: number } }) {
    const router = useRouter();
    const { createPost, loading } = useCreatePost();
    const { address, setAddress, reverseGeocode } = useReverseGeocode();
    const [category, setCategory] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [point, setPoint] = useState(origin);
    const [pinning, setPinning] = useState(false);
    const [approximate, setApproximate] = useState(true);
    const [lfDirection, setLfDirection] = useState<"LOST" | "FOUND" | null>(null);
    const [lfItem, setLfItem] = useState<string | null>(null);
    const [lfWindow, setLfWindow] = useState<LfWindow>("today");
    const [error, setError] = useState<string | null>(null);
    const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);

    useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);
    useEffect(() => {
        if (open) {
            setPoint(origin);
            void reverseGeocode(origin.lat, origin.long);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const reset = () => {
        setCategory(null);
        setTitle("");
        setContent("");
        setImage(null);
        setApproximate(true);
        setLfDirection(null);
        setLfItem(null);
        setError(null);
        setPinning(false);
    };
    const close = () => {
        reset();
        onClose();
    };

    const pick = (lat: number, long: number, name?: string) => {
        setPoint({ lat, long });
        if (name) setAddress(name);
        else void reverseGeocode(lat, long);
    };

    const submit = async () => {
        setError(null);
        if (!category) return setError("Choose what kind of post this is.");
        const t = title.trim();
        if (t.length < 3 || t.length > TITLE_MAX) return setError("Use 3–120 characters for the title.");
        if (category === "LOST_FOUND" && (!lfDirection || !lfItem)) return setError("Choose lost or found and an item type.");
        try {
            const range = windowRange(lfWindow);
            const post = await createPost({
                title: t,
                content,
                category,
                latitude: point.lat,
                longitude: point.long,
                imageFile: image ?? undefined,
                approximateLocation: approximate,
                lostFound: category === "LOST_FOUND" && lfDirection && lfItem ? { direction: lfDirection, itemType: lfItem, occurredFrom: range.from.toISOString(), occurredTo: range.to.toISOString() } : undefined,
            });
            close();
            router.push(`/post/${post.id}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Your post could not be published. Try again.");
        }
    };

    return (
        <Dialog
            open={open}
            onClose={close}
            title="New post"
            size="lg"
            footer={
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="plain" onClick={close}>
                        Cancel
                    </Button>
                    <Button onClick={submit} loading={loading} disabled={!category}>
                        Post
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <section className="space-y-3">
                    <h3 className="text-[15px] font-semibold">What do you want to share?</h3>
                    <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {POST_CATEGORIES.filter((c) => c.id !== "DANGER").map((c) => {
                            const selected = category === c.id;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setCategory(c.id)}
                                    className={cn(
                                        "flex flex-col items-start gap-2.5 rounded-[16px] border-2 bg-surface p-3.5 text-left transition-colors",
                                        selected ? "border-primary" : "border-transparent ring-1 ring-inset ring-border hover:bg-surface-2",
                                    )}
                                >
                                    <span className="flex w-full items-start justify-between">
                                        <span className="flex size-9 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${c.hex}22` }}>
                                            <c.icon className="size-5" style={{ color: c.hex }} aria-hidden />
                                        </span>
                                        {selected ? <Check className="size-5 text-primary" aria-hidden /> : null}
                                    </span>
                                    <span className="text-[15px] font-semibold">{c.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    {category ? <p className="text-[13px] text-muted-foreground">{GUIDANCE[category]}</p> : null}
                    <Banner tone="danger" message="If someone needs help right now, use Urgent help instead — it explains what is shared and how to reach 112." />
                </section>

                {category === "LOST_FOUND" ? (
                    <section className="space-y-3">
                        <h3 className="text-[15px] font-semibold">Did you lose or find something?</h3>
                        <div className="flex flex-wrap gap-2">
                            <Chip label="I lost something" selected={lfDirection === "LOST"} onClick={() => setLfDirection("LOST")} />
                            <Chip label="I found something" selected={lfDirection === "FOUND"} onClick={() => setLfDirection("FOUND")} />
                        </div>
                        <h3 className="pt-1 text-[15px] font-semibold">What kind of item?</h3>
                        <div className="flex flex-wrap gap-2">
                            {ITEM_TYPES.map(([id, label]) => (
                                <Chip key={id} label={label} selected={lfItem === id} onClick={() => setLfItem(id)} />
                            ))}
                        </div>
                        <h3 className="pt-1 text-[15px] font-semibold">When?</h3>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ["today", "Today"],
                                    ["yesterday", "Yesterday"],
                                    ["week", "In the last 7 days"],
                                ] as const
                            ).map(([w, label]) => (
                                <Chip key={w} label={label} selected={lfWindow === w} onClick={() => setLfWindow(w)} />
                            ))}
                        </div>
                    </section>
                ) : null}

                <section className="space-y-4">
                    <TextField label="Title" placeholder="Short summary" value={title} onChange={(e) => setTitle(e.target.value)} max={TITLE_MAX} />
                    <TextArea label="Description" placeholder="What, when, and anything people should know" value={content} onChange={(e) => setContent(e.target.value)} max={CONTENT_MAX} />
                    <div className="space-y-1.5">
                        <span className="text-[13px] font-semibold">Photo (optional)</span>
                        {preview ? (
                            <div className="relative w-fit">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={preview} alt="Selected photo" className="h-32 w-32 rounded-[14px] object-cover" />
                                <button type="button" onClick={() => setImage(null)} aria-label="Remove photo" className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-foreground text-background shadow">
                                    <X className="size-4" aria-hidden />
                                </button>
                            </div>
                        ) : (
                            <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-border text-[13px] font-semibold text-primary hover:bg-primary-soft">
                                <ImagePlus className="size-5" aria-hidden />
                                Add a photo
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && setImage(e.target.files[0])} />
                            </label>
                        )}
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-[15px] font-semibold">Where is it?</h3>
                    {pinning ? (
                        <div className="space-y-2">
                            <div className="relative h-64 overflow-hidden rounded-[16px] ring-1 ring-border">
                                <MapLoader posts={[]} center={point} onMapClick={(lat, long) => pick(lat, long)} interactiveOnly />
                                <span className="material pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold">Click the map to place the pin</span>
                            </div>
                            <Button variant="tinted" size="sm" onClick={() => setPinning(false)}>
                                Done
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <LocationSearch biasLocation={point} onLocationSelect={pick} placeholder="Search an address" />
                            </div>
                            <Button variant="outline" icon={MapPin} onClick={() => setPinning(true)} className="h-11">
                                Pin
                            </Button>
                        </div>
                    )}
                    <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <MapPin className="size-4 shrink-0" aria-hidden />
                        <span className="line-clamp-1">{address || `${point.lat.toFixed(4)}, ${point.long.toFixed(4)}`}</span>
                    </p>
                    <div className="flex items-center gap-3 rounded-[14px] bg-surface-2 p-3.5">
                        <div className="flex-1">
                            <p className="text-[15px] font-medium">Share approximate location (~300 m)</p>
                            <p className="text-[13px] text-muted-foreground">Recommended for anything near a home. The exact point is never stored.</p>
                        </div>
                        <Switch checked={approximate} onChange={setApproximate} label="Share approximate location" />
                    </div>
                </section>

                <Banner tone="warning" icon={ShieldCheck} message="Don't include faces, licence plates, home addresses, ID or card numbers, or accusations against people." />
                {error ? <Banner tone="danger" message={error} /> : null}
            </div>
        </Dialog>
    );
}
