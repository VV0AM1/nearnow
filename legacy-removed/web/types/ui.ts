import { LucideIcon } from "lucide-react";

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    onClick?: string;
}

export interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    delay?: number;
}
