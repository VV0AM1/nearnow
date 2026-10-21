import MobileCategoryFilter from "./filters/MobileCategoryFilter";
import DesktopCategoryList from "./filters/DesktopCategoryList";
import { useHaptic } from "../../../hooks/useHaptic";
export { CATEGORIES, getCategoryColor } from "../../../config/categories";

interface CategoryFilterProps {
    selected: string[];
    onSelect: (ids: string[]) => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
    const { triggerHaptic } = useHaptic();

    const handleSelect = (id: string) => {
        triggerHaptic("light");

        if (id === 'ALL') {
            onSelect(['ALL']);
            return;
        }

        let newSelected = [...selected];

        // If ALL is currently selected, clear it
        if (newSelected.includes('ALL')) {
            newSelected = [];
        }

        if (newSelected.includes(id)) {
            newSelected = newSelected.filter(c => c !== id);
        } else {
            newSelected.push(id);
        }

        if (newSelected.length === 0) {
            newSelected = ['ALL'];
        }

        onSelect(newSelected);
    };

    return (
        <>
            <MobileCategoryFilter selected={selected} onSelect={handleSelect} />
            <DesktopCategoryList selected={selected} onSelect={handleSelect} className="hidden md:flex" />
        </>
    );
}
