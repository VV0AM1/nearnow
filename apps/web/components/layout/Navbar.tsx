import Link from "next/link";
import NavButton from "../common/NavButton";

interface NavItem {
    label: string;
    href: string;
    variant?: "text" | "primary";
}

interface NavbarProps {
    logoText?: string;
    items?: NavItem[];
    className?: string;
}

const DEFAULT_ITEMS: NavItem[] = [
    { label: "Profile", href: "/profile", variant: "text" },
    { label: "Log in", href: "/login", variant: "text" },
    { label: "Sign up", href: "/signup", variant: "primary" },
];

export default function Navbar({
    logoText = "NearNow",
    items = DEFAULT_ITEMS,
    className = ""
}: NavbarProps) {
    return (
        <nav className={`fixed w-full z-50 glass border-b border-border ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                            {logoText}
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        {items.map((item) => (
                            <NavButton
                                key={item.label}
                                href={item.href}
                                variant={item.variant}
                            >
                                {item.label}
                            </NavButton>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
