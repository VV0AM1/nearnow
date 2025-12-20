"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuthContext } from "../../context/AuthContext";
import { Menu, X, LogOut, User, LogIn, UserPlus, Home, Settings, Map, Bell } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

export default function MobileMenu() {
    const { isAuthenticated, user, logout } = useAuthContext();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const backdropVariants: Variants = {
        closed: { opacity: 0, backdropFilter: "blur(0px)" },
        open: {
            opacity: 1,
            backdropFilter: "blur(12px)",
            transition: { duration: 0.4 }
        }
    };

    const containerVariants: Variants = {
        closed: {
            opacity: 0,
            y: "100%",
            transition: {
                type: "spring", stiffness: 400, damping: 40
            }
        },
        open: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring", stiffness: 400, damping: 40,
                delayChildren: 0.1,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        closed: { opacity: 0, x: -20 },
        open: { opacity: 1, x: 0 }
    };

    const [mounted, setMounted] = useState(false);

    // Ensure we only portal on client side to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="md:hidden">
            {/* Toggle Button */}
            <button
                onClick={toggleMenu}
                className="relative z-50 p-2 text-foreground focus:outline-none hover:bg-white/10 rounded-full transition-colors"
                aria-label={isOpen ? "Close menu" : "Open menu"}
            >
                {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Glass Backdrop */}
                            <motion.div
                                initial="closed"
                                animate="open"
                                exit="closed"
                                variants={backdropVariants}
                                className="fixed inset-0 z-[60] bg-black/60"
                                onClick={toggleMenu}
                            />

                            {/* Menu Content */}
                            <motion.div
                                initial="closed"
                                animate="open"
                                exit="closed"
                                variants={containerVariants}
                                className="fixed bottom-0 left-0 right-0 z-[70] bg-background border-t border-white/10 rounded-t-3xl p-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col min-h-[70vh]"
                            >
                                {/* Decorative Handle */}
                                <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />

                                <div className="flex flex-col space-y-6 flex-1">
                                    <motion.div variants={itemVariants} className="mb-4">
                                        <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                                            Navigation
                                        </h3>
                                        <Link
                                            href="/"
                                            onClick={toggleMenu}
                                            className="flex items-center gap-4 text-2xl font-bold p-2 hover:translate-x-2 transition-transform"
                                        >
                                            <Home className="h-6 w-6 text-primary" />
                                            Home
                                        </Link>
                                        <Link
                                            href="/map"
                                            onClick={toggleMenu}
                                            className="flex items-center gap-4 text-2xl font-bold p-2 hover:translate-x-2 transition-transform"
                                        >
                                            <Map className="h-6 w-6 text-purple-400" />
                                            Live Map
                                        </Link>
                                    </motion.div>

                                    <div className="h-px bg-white/10 my-2" />

                                    <motion.div variants={itemVariants}>
                                        <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                                            Account
                                        </h3>
                                        {isAuthenticated ? (
                                            <div className="space-y-4">
                                                <Link
                                                    href="/profile"
                                                    onClick={toggleMenu}
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-lg">{user?.name || 'Neighbor'}</p>
                                                        <p className="text-xs text-muted-foreground">View Profile</p>
                                                    </div>
                                                </Link>

                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        toggleMenu();
                                                    }}
                                                    className="w-full flex items-center gap-3 p-4 text-red-400 font-medium hover:bg-red-500/10 rounded-xl transition-colors"
                                                >
                                                    <LogOut className="h-5 w-5" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                <Link
                                                    href="/login"
                                                    onClick={toggleMenu}
                                                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
                                                >
                                                    <LogIn className="h-8 w-8 text-primary" />
                                                    <span className="font-bold">Log In</span>
                                                </Link>
                                                <Link
                                                    href="/signup"
                                                    onClick={toggleMenu}
                                                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                                                >
                                                    <UserPlus className="h-8 w-8" />
                                                    <span className="font-bold">Sign Up</span>
                                                </Link>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
