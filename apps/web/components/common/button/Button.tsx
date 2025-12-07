import { Loader2 } from "lucide-react";
import { ButtonProps } from "@/types/button";
import { BASE_STYLES, VARIANTS, SIZES } from "@/styles/button";

export default function Button({
    variant = "primary",
    size = "md",
    isLoading = false,
    className = "",
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={`${BASE_STYLES} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
