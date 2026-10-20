export interface Category {
    id: string;
    label: string;
    color: string;
}

// Same ids and labels as the API enum and the mobile app (constants/categories.ts).
// Strong red is reserved for urgent help.
export const CATEGORIES: Category[] = [
    { id: "ALL", label: "All", color: "bg-slate-500" },
    { id: "GENERAL", label: "Local update", color: "bg-blue-600" },
    { id: "EVENT", label: "Event", color: "bg-violet-600" },
    { id: "LOST_FOUND", label: "Lost & found", color: "bg-yellow-600" },
    { id: "RECOMMENDATION", label: "Recommendation", color: "bg-pink-600" },
    { id: "SAFETY", label: "Safety notice", color: "bg-teal-600" },
    { id: "CRIME", label: "Incident", color: "bg-orange-600" },
    { id: "DANGER", label: "Urgent help", color: "bg-red-600" },
];

export const getCategoryColor = (catId: string): string => {
    return CATEGORIES.find(c => c.id === catId)?.color || "bg-gray-500";
};
