"use client";

import Link from "next/link";
import { MapPin, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";
import { Button, IconButton } from "@/components/nn";

/** Public pages frame: slim translucent nav and a simple footer. */
export default function MarketingShell({ children }: { children: React.ReactNode }) {
    const { resolved, setMode } = useTheme();
    const { user } = useAuthContext();
    return (
        <div className="flex min-h-dvh flex-col">
            <header className="material sticky top-0 z-40 border-b border-border">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
                        <span className="flex size-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
                            <MapPin className="size-5" aria-hidden />
                        </span>
                        NearNow
                    </Link>
                    <nav aria-label="Site" className="ml-6 hidden items-center gap-1 text-[15px] md:flex">
                        <Link href="/#how" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">
                            How it works
                        </Link>
                        <Link href="/download" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">
                            Mobile app
                        </Link>
                        <Link href="/legal" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">
                            Privacy
                        </Link>
                    </nav>
                    <div className="ml-auto flex items-center gap-1.5">
                        <IconButton icon={resolved === "dark" ? Sun : Moon} label={resolved === "dark" ? "Use light appearance" : "Use dark appearance"} size="sm" onClick={() => setMode(resolved === "dark" ? "light" : "dark")} />
                        {user ? (
                            <Button href="/" size="sm">
                                Open NearNow
                            </Button>
                        ) : (
                            <>
                                <Button href="/login" variant="plain" size="sm">
                                    Sign in
                                </Button>
                                <Button href="/signup" size="sm">
                                    Get started
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <div className="flex-1">{children}</div>
            <footer className="border-t border-border bg-surface">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p>© {new Date().getFullYear()} NearNow · Not an emergency service — in danger, call 112.</p>
                    <nav aria-label="Footer" className="flex gap-5">
                        <Link href="/legal" className="hover:text-foreground">
                            Privacy & terms
                        </Link>
                        <Link href="/download" className="hover:text-foreground">
                            Mobile app
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
