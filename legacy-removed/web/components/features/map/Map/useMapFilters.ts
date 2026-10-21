import { useState } from "react";

export function useMapFilters(posts: any[]) {
    const [selectedCategory, setSelectedCategory] = useState<string[]>(["ALL"]);
    const [timeRange, setTimeRange] = useState<string>("all");

    const filteredPosts = posts.filter(p => {
        // Category Filter
        if (!selectedCategory.includes("ALL") && !selectedCategory.includes(p.category)) return false;

        // Time Filter
        if (timeRange !== "all") {
            const postDate = new Date(p.createdAt).getTime();
            const now = new Date().getTime();
            const hoursDiff = (now - postDate) / (1000 * 60 * 60);

            if (timeRange === "24h" && hoursDiff > 24) return false;
            if (timeRange === "7d" && hoursDiff > 24 * 7) return false;
        }

        return true;
    });

    return {
        selectedCategory,
        setSelectedCategory,
        timeRange,
        setTimeRange,
        filteredPosts
    };
}
