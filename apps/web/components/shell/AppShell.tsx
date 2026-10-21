"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bookmark, ChevronDown, Home, LogOut, Map, MapPin, Moon, Plus, Search, Settings, ShieldCheck, Sun, User as UserIcon, type LucideIcon } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationsMenu from "@/components/features/notifications/NotificationsMenu";
import SOSButton from "@/components/features/safety/SOSButton";
import { Avatar, Button, Dialog, IconButton } from "@/components/nn";
import { AreaChooser } from "./AreaChooser";
import { CreatePostDialog } from "./CreatePostDialog";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

interface ShellValue {
    openCreate: () => void;
    openAreaPicker: () => void;
}
const ShellContext = createContext<ShellValue>({ openCreate: () => undefined, openAreaPicker: () => undefined });
export const useShell = () => useContext(ShellContext);

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/", label: "Feed", icon: Home },
    { href: "/map", label: "Map", icon: Map },
    { href: "/safety", label: "Area overview", icon: BarChart3 },
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/profile", label: "Profile", icon: UserIcon },
];

function isActive(pathname: string, href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo({ compact }: { compact?: boolean }) {
    return (
        <Link href="/" className="flex items-center gap-2.5" aria-label="NearNow home">
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground shadow-sm">
                <MapPin className="size-5" aria-hidden />
            </span>
            {!compact ? <span className="text-[19px] font-bold tracking-tight">NearNow</span> : null}
        </Link>
    );
}

function ThemeToggle() {
    const { resolved, setMode } = useTheme();
    return <IconButton icon={resolved === "dark" ? Sun : Moon} label={resolved === "dark" ? "Use light appearance" : "Use dark appearance"} size="sm" onClick={() => setMode(resolved === "dark" ? "light" : "dark")} />;
}

/**
 * App frame for signed-in pages. Desktop: sidebar + top bar. Phones/tablets:
 * top bar + bottom tab bar with a central "New post" action.
 */
export default function AppShell({ children, initialUser, fullBleed }: { children: ReactNode; initialUser?: User; fullBleed?: boolean }) {
    const pathname = usePathname();
    const { user: ctxUser, logout } = useAuthContext();
    const user = ctxUser ?? initialUser ?? null;
    const { location, searchQuery, setSearchQuery } = useDashboard();
    const [creating, setCreating] = useState(false);
    const [picking, setPicking] = useState(false);

    const openCreate = () => (location ? setCreating(true) : setPicking(true));
    const areaLabel = location?.label ?? "Choose an area";

    return (
        <ShellContext.Provider value={{ openCreate, openAreaPicker: () => setPicking(true) }}>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
                Skip to content
            </a>
            <div className="min-h-screen lg:pl-[264px]">
                {/* Sidebar (desktop) */}
                <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-border bg-surface px-4 pb-4 pt-5 lg:flex">
                    <div className="px-2">
                        <Logo />
                    </div>
                    <Button icon={Plus} block className="mt-6" onClick={openCreate}>
                        New post
                    </Button>
                    <nav aria-label="Main" className="mt-5 flex-1 space-y-0.5">
                        {[...NAV, ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Moderation", icon: ShieldCheck }] : [])].map((item) => {
                            const active = isActive(pathname, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
                                        active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-surface-2",
                                    )}
                                >
                                    <item.icon className="size-5" aria-hidden />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="space-y-3">
                        <SOSButton />
                        <div className="flex items-center gap-3 rounded-[14px] bg-surface-2 p-2.5">
                            <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-2.5">
                                <Avatar src={user?.avatar} name={user?.name} size={36} />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold">{user?.name ?? "Neighbour"}</span>
                                    <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
                                </span>
                            </Link>
                            <ThemeToggle />
                            <IconButton icon={LogOut} label="Sign out" size="sm" onClick={logout} />
                        </div>
                    </div>
                </aside>

                {/* Top bar */}
                <header className="material sticky top-0 z-30 border-b border-border">
                    <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
                        <div className="lg:hidden">
                            <Logo compact />
                        </div>
                        <button
                            type="button"
                            onClick={() => setPicking(true)}
                            className="flex h-10 min-w-0 items-center gap-1.5 rounded-xl px-3 text-[15px] font-semibold hover:bg-surface-2"
                            aria-label={`Area: ${areaLabel}. Change area`}
                        >
                            <MapPin className="size-[18px] shrink-0 text-primary" aria-hidden />
                            <span className="truncate">{areaLabel}</span>
                            <ChevronDown className="size-4 shrink-0 text-subtle" aria-hidden />
                        </button>
                        <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-subtle" aria-hidden />
                            <input
                                type="search"
                                aria-label="Search posts"
                                placeholder="Search posts"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                }}
                                className="h-10 w-full rounded-xl bg-surface-2 pl-10 pr-3 text-[15px] placeholder:text-subtle focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/15"
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-1 md:ml-2">
                            <div className="lg:hidden">
                                <SOSButton variant="icon" />
                            </div>
                            <NotificationsMenu />
                            <Link href="/profile" className="ml-1 lg:hidden" aria-label="Profile">
                                <Avatar src={user?.avatar} name={user?.name} size={34} />
                            </Link>
                            <Link href="/profile" title="Settings" aria-label="Settings" className="hidden size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground lg:inline-flex">
                                <Settings className="size-5" aria-hidden />
                            </Link>
                        </div>
                    </div>
                </header>

                <main id="main" className={cn(fullBleed ? "" : "mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8")}>{children}</main>

                {/* Bottom tab bar (phones/tablets) */}
                <nav aria-label="Main" className="material fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden">
                    <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center">
                        {NAV.filter((n) => n.href !== "/safety").map((item, i) => {
                            const active = isActive(pathname, item.href);
                            const link = (
                                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 text-[11px] font-semibold", active ? "text-primary" : "text-muted-foreground")}>
                                    <item.icon className="size-6" aria-hidden strokeWidth={active ? 2.4 : 1.9} />
                                    {item.label}
                                </Link>
                            );
                            if (i !== 2) return link;
                            return [
                                <button key="new" type="button" onClick={openCreate} aria-label="New post" className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-float)] active:scale-95">
                                    <Plus className="size-6" aria-hidden />
                                </button>,
                                link,
                            ];
                        })}
                    </div>
                </nav>
            </div>

            <Dialog open={picking} onClose={() => setPicking(false)} title="Choose your area">
                <AreaChooser onChosen={() => setPicking(false)} />
            </Dialog>
            {location ? <CreatePostDialog open={creating} onClose={() => setCreating(false)} origin={location} /> : null}
        </ShellContext.Provider>
    );
}
