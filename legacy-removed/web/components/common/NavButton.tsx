import Link from "next/link";
import { ReactNode } from "react";

interface NavButtonProps {
    href: string;
    children: ReactNode;
    variant?: "text" | "primary";
    className?: string;
}

export default function NavButton({ href, children, variant = "text", className = "" }: NavButtonProps) {
    const baseStyles = "text-sm font-medium transition-colors duration-200";
    const variants = {
        text: "hover:text-primary",
        primary: "bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
    };

    return (
        <Link
            href={href}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </Link>
    );
}
