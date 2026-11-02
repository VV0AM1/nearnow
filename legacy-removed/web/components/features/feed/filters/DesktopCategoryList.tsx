import CategoryBadge from "../../../common/display/CategoryBadge";
import { CATEGORIES } from "../../../../config/categories";
import { cn } from "@/lib/utils";

interface DesktopCategoryListProps {
    selected: string[];
    onSelect: (id: string) => void;
    className?: string; // Allow custom classes
}

export default function DesktopCategoryList({ selected, onSelect, className }: DesktopCategoryListProps) {
    return (
        <div className={cn("flex gap-3 overflow-x-auto py-2 px-2 no-scrollbar mask-gradient-x", className)}>
            {CATEGORIES.map(cat => (
                <CategoryBadge
                    key={cat.id}
                    category={cat.id}
                    isSelected={selected.includes(cat.id)}
                    onClick={() => onSelect(cat.id)}
                />
            ))}
        </div>
    );
}
