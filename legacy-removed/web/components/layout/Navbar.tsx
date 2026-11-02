"use client";

import Link from "next/link";
import NavButton from "../common/NavButton";
import MobileMenu from "./MobileMenu";
import { useAuthContext } from "../../context/AuthContext";
import NotificationsMenu from "../features/notifications/NotificationsMenu";

interface NavbarProps {
    logoText?: string;
    className?: string;
}

export default function Navbar({
    logoText = "NearNow",
    className = ""
}: NavbarProps) {
    const { isAuthenticated, user, logout } = useAuthContext();

    return (
        <nav className={`fixed w-full z-50 glass border-b border-border ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0 flex items-center z-50">
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                            {logoText}
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {isAuthenticated ? (
                            <>
                                {user?.role === 'ADMIN' && (
                                    <NavButton href="/admin" variant="text" className="text-red-400 hover:text-red-300">
                                        Admin
                                    </NavButton>
                                )}
                                <NavButton href="/profile" variant="text">
                                    Profile
                                </NavButton>
                                <NotificationsMenu />
                                <button
                                    onClick={logout}
                                    className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <NavButton href="/login" variant="text">
                                    Log in
                                </NavButton>
                                <NavButton href="/signup" variant="primary">
                                    Sign up
                                </NavButton>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <MobileMenu />
                </div>
            </div>
        </nav>
    );
}
