export interface Category {
    id: string;
    label: string;
    color: string;
}

export const CATEGORIES: Category[] = [
    { id: "ALL", label: "All", color: "bg-slate-500" },
    { id: "GENERAL", label: "General", color: "bg-blue-500" },
    { id: "CRIME", label: "Crime", color: "bg-red-500" },
    { id: "SAFETY", label: "Safety", color: "bg-green-500" },
    { id: "LOST_FOUND", label: "Lost & Found", color: "bg-yellow-500" },
    { id: "EVENT", label: "Events", color: "bg-purple-500" },
    { id: "RECOMMENDATION", label: "Recs", color: "bg-pink-500" },
];

export const getCategoryColor = (catId: string): string => {
    return CATEGORIES.find(c => c.id === catId)?.color || "bg-gray-500";
};
