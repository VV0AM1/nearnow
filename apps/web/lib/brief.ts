/** Mirrors GET /brief (apps/api/src/brief); same deterministic wording as the mobile app. */
export type BriefChange = "NEW" | "CONFIRMED" | "RESOLVED" | "EXPIRED";
export type BriefProvenance = "OFFICIAL" | "COMMUNITY_CONFIRMED" | "UNCONFIRMED";

export interface BriefItem {
    postId: string;
    title: string;
    category: string;
    change: BriefChange;
    provenance: BriefProvenance;
    sourceName: string | null;
    at: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
    isApproximateLocation: boolean;
}

export interface BriefCounts {
    new: number;
    confirmed: number;
    resolved: number;
    expired: number;
    unconfirmedNew: number;
    official: number;
}

export interface Brief {
    enabled: boolean;
    since: string;
    generatedAt: string;
    area: { id: string | null; label: string | null; latitude: number; longitude: number; radiusKm: number };
    categories: string[];
    counts: BriefCounts;
    items: BriefItem[];
    activeInArea: number;
}

export interface SavedArea {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
}

export const CHANGE_LABEL: Record<BriefChange, string> = { NEW: "New", CONFIRMED: "Confirmed again", RESOLVED: "Resolved", EXPIRED: "Expired" };
export const PROVENANCE_LABEL: Record<BriefProvenance, string> = { OFFICIAL: "Official", COMMUNITY_CONFIRMED: "Confirmed by neighbours", UNCONFIRMED: "Not yet confirmed" };

/** Summary sentences. No changes is never presented as "all clear". */
export function briefLines(b: Pick<Brief, "counts" | "activeInArea">): { text: string; warning?: boolean }[] {
    const c = b.counts;
    if (c.new + c.confirmed + c.resolved + c.expired === 0) {
        return [
            { text: "No new reports found in this area since then." },
            { text: b.activeInArea === 0 ? "Few people post here yet, so no reports does not mean nothing is happening." : "This only covers what neighbours posted on NearNow." },
        ];
    }
    const lines: { text: string; warning?: boolean }[] = [];
    if (c.new) lines.push({ text: `New posts: ${c.new}` });
    if (c.resolved) lines.push({ text: `Marked resolved: ${c.resolved}` });
    if (c.confirmed) lines.push({ text: `Newly confirmed as still happening: ${c.confirmed}` });
    if (c.expired) lines.push({ text: `Expired: ${c.expired}` });
    if (c.unconfirmedNew) lines.push({ text: `Unconfirmed new posts: ${c.unconfirmedNew} — check before relying on them.`, warning: true });
    return lines;
}

export const briefRadius = (km: number) => Math.min(10, Math.max(0.5, km));
