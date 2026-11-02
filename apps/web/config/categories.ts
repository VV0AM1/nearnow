import { AlertCircle, CalendarDays, Heart, LayoutGrid, MessageSquareText, Search, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";

export type MarkerShape = "circle" | "square" | "diamond" | "triangle";

export interface Category {
    id: string;
    label: string;
    /** Legacy Tailwind class (admin screens). */
    color: string;
    /** Brand colour, identical to the mobile app; tints icons and markers only, never text. */
    hex: string;
    icon: LucideIcon;
    /** Map marker shape, so colour is never the only signal. */
    shape: MarkerShape;
}

// Same ids, labels, colours and shapes as the API enum and the mobile app
// (apps/mobile/constants/categories.ts). Strong red is reserved for urgent help.
export const CATEGORIES: Category[] = [
    { id: "ALL", label: "All", color: "bg-slate-500", hex: "#64748b", icon: LayoutGrid, shape: "circle" },
    { id: "GENERAL", label: "Local update", color: "bg-blue-600", hex: "#2563eb", icon: MessageSquareText, shape: "circle" },
    { id: "EVENT", label: "Event", color: "bg-violet-600", hex: "#7c3aed", icon: CalendarDays, shape: "circle" },
    { id: "LOST_FOUND", label: "Lost & found", color: "bg-yellow-600", hex: "#ca8a04", icon: Search, shape: "square" },
    { id: "RECOMMENDATION", label: "Recommendation", color: "bg-pink-600", hex: "#db2777", icon: Heart, shape: "circle" },
    { id: "SAFETY", label: "Safety notice", color: "bg-teal-600", hex: "#0d9488", icon: ShieldCheck, shape: "diamond" },
    { id: "CRIME", label: "Incident", color: "bg-orange-600", hex: "#ea580c", icon: TriangleAlert, shape: "diamond" },
    { id: "DANGER", label: "Urgent help", color: "bg-red-600", hex: "#dc2626", icon: AlertCircle, shape: "triangle" },
];

export const POST_CATEGORIES = CATEGORIES.filter((c) => c.id !== "ALL");

export function getCategory(id: string): Category {
    return CATEGORIES.find((c) => c.id === id) ?? { id, label: id, color: "bg-gray-500", hex: "#64748b", icon: MessageSquareText, shape: "circle" };
}

export const getCategoryColor = (catId: string): string => getCategory(catId).color;
