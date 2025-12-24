import FloatingDock from "./FloatingDock";


interface MapControlsProps {
    selectedCategory: string[];
    onSelectCategory: (ids: string[]) => void;
}

export default function MapControls({
    selectedCategory,
    onSelectCategory
}: MapControlsProps) {
    return (
        <>
            <FloatingDock selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
        </>
    );
}
