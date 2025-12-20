import { getCategoryColor } from "@/components/features/feed/CategoryFilter";

interface PostHeaderProps {
    title: string;
    category: string;
}

export default function PostHeader({ title, category }: PostHeaderProps) {
    const colorClass = getCategoryColor(category);

    return (
        <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-sm truncate pr-2">{title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white whitespace-nowrap shrink-0 ${colorClass}`}>
                {category}
            </span>
        </div>
    );
}
