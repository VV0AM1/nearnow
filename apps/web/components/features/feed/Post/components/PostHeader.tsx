import CategoryBadge from "@/components/common/display/CategoryBadge";

interface PostHeaderProps {
    title: string;
    category: string;
}

export default function PostHeader({ title, category }: PostHeaderProps) {
    return (
        <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-bold text-base leading-snug text-white/90 line-clamp-2">{title}</h3>
            <CategoryBadge category={category} className="shrink-0" />
        </div>
    );
}
