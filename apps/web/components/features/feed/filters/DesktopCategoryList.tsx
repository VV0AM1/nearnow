import CategoryBadge from "../../../common/display/CategoryBadge";
import { CATEGORIES } from "../../../../config/categories";

interface DesktopCategoryListProps {
    selected: string[];
    onSelect: (id: string) => void;
}

export default function DesktopCategoryList({ selected, onSelect }: DesktopCategoryListProps) {
    return (
        <div className="hidden md:flex gap-3 overflow-x-auto py-2 no-scrollbar">
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
