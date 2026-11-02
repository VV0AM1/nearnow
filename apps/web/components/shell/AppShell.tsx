"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, Bookmark, ChevronDown, Home, LogOut, Map, MapPin, Moon, Plus, Search, ShieldCheck, Sun, User as UserIcon, type LucideIcon } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationsMenu from "@/components/features/notifications/NotificationsMenu";
import SOSButton from "@/components/features/safety/SOSButton";
import { Avatar, Dialog, IconButton } from "@/components/nn";
import { Magnetic } from "@/components/motion";
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

export function Logo({ compact }: { compact?: boolean }) {
    return (
        <Link href="/" className="flex items-center gap-2.5" aria-label="NearNow home">
            <span className="relative flex size-9 items-center justify-center rounded-full bg-ink text-paper shadow-[var(--shadow-float)]">
                <MapPin className="size-[18px]" aria-hidden />
                <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-surface bg-signal" />
            </span>
            {!compact ? <span className="display text-[21px]">NearNow</span> : null}
        </Link>
    );
}

function ThemeToggle() {
    const { resolved, setMode } = useTheme();
    return <IconButton icon={resolved === "dark" ? Sun : Moon} label={resolved === "dark" ? "Use light appearance" : "Use dark appearance"} size="sm" onClick={() => setMode(resolved === "dark" ? "light" : "dark")} />;
}

/**
 * App frame for signed-in pages. Desktop: floating sidebar + floating top bar.
 * Phones: top bar + floating dock with a raised "New post" button.
 */
export default function AppShell({ children, initialUser, fullBleed }: { children: ReactNode; initialUser?: User; fullBleed?: boolean }) {
    const pathname = usePathname();
    const reduce = useReducedMotion();
    const { user: ctxUser, logout } = useAuthContext();
    const user = ctxUser ?? initialUser ?? null;
    const { location, searchQuery, setSearchQuery } = useDashboard();
    const [creating, setCreating] = useState(false);
    const [picking, setPicking] = useState(false);

    const openCreate = () => (location ? setCreating(true) : setPicking(true));
    const areaLabel = location?.label ?? "Choose an area";
    const nav = [...NAV, ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Moderation", icon: ShieldCheck }] : [])];

    return (
        <ShellContext.Provider value={{ openCreate, openAreaPicker: () => setPicking(true) }}>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
                Skip to content
            </a>
            <div className="contours min-h-screen lg:pl-[284px]">
                {/* Floating sidebar (desktop) */}
                <aside className="fixed bottom-3 left-3 top-3 z-40 hidden w-[264px] flex-col rounded-[28px] bg-surface px-4 pb-4 pt-5 shadow-[var(--shadow-deep)] ring-1 ring-border lg:flex">
                    <div className="px-2">
                        <Logo />
                    </div>
                    <Magnetic strength={0.15} className="mt-7 w-full">
                        <button
                            type="button"
                            onClick={openCreate}
                            className="group flex h-12 w-full items-center justify-between rounded-full bg-ink pl-5 pr-1.5 text-[15px] font-semibold text-paper shadow-[var(--shadow-float)] transition-transform active:scale-[0.98]"
                        >
                            New post
                            <span className="flex size-9 items-center justify-center rounded-full bg-signal text-white transition-transform group-hover:rotate-90">
                                <Plus className="size-5" aria-hidden />
                            </span>
                        </button>
                    </Magnetic>
                    <nav aria-label="Main" className="mt-6 flex-1 space-y-1">
                        {nav.map((item) => {
                            const active = isActive(pathname, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn("relative flex h-11 items-center gap-3 rounded-full px-4 text-[15px] font-medium transition-colors", active ? "text-primary" : "text-foreground hover:bg-surface-2")}
                                >
                                    {active ? (
                                        <motion.span
                                            layoutId="nav-pill"
                                            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                                            className="absolute inset-0 rounded-full bg-primary-soft ring-1 ring-primary/20"
                                        />
                                    ) : null}
                                    <item.icon className="relative size-5" aria-hidden />
                                    <span className="relative">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="space-y-3">
                        <SOSButton />
                        <div className="flex items-center gap-2 rounded-[20px] bg-surface-2 p-2">
                            <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-2.5">
                                <Avatar src={user?.avatar} name={user?.name} size={36} />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold">{user?.name ?? "Neighbour"}</span>
                                    <span className="block truncate font-mono text-[11px] text-muted-foreground">{user?.email}</span>
                                </span>
                            </Link>
                            <ThemeToggle />
                            <IconButton icon={LogOut} label="Sign out" size="sm" onClick={logout} />
                        </div>
                    </div>
                </aside>

                {/* Floating top bar */}
                <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
                    <div className="material flex h-14 items-center gap-2 rounded-full pl-2 pr-2 shadow-[var(--shadow-float)] ring-1 ring-border">
                        <div className="lg:hidden">
                            <Logo compact />
                        </div>
                        <button
                            type="button"
                            onClick={() => setPicking(true)}
                            className="group flex h-10 min-w-0 items-center gap-2 rounded-full bg-surface-2/70 pl-2 pr-3 text-[15px] font-semibold hover:bg-surface-2"
                            aria-label={`Area: ${areaLabel}. Change area`}
                        >
                            <span className="relative flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <MapPin className="size-3.5" aria-hidden />
                                {location ? <span className="absolute inset-0 rounded-full bg-primary animate-pulse-ring motion-safe-only" aria-hidden /> : null}
                            </span>
                            <span className="truncate">{areaLabel}</span>
                            {location ? (
                                <span className="hidden font-mono text-[11px] font-normal text-muted-foreground xl:inline">
                                    {location.lat.toFixed(3)}°, {location.long.toFixed(3)}°
                                </span>
                            ) : null}
                            <ChevronDown className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-y-0.5" aria-hidden />
                        </button>
                        <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle" aria-hidden />
                            <input
                                type="search"
                                aria-label="Search posts"
                                placeholder="Search posts"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 w-full rounded-full bg-surface-2/70 pl-10 pr-3 text-[15px] placeholder:text-subtle focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/15"
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-1 md:ml-1">
                            <div className="lg:hidden">
                                <SOSButton variant="icon" />
                            </div>
                            <NotificationsMenu />
                            <Link href="/profile" className="ml-0.5" aria-label="Profile">
                                <Avatar src={user?.avatar} name={user?.name} size={36} className="ring-2 ring-surface" />
                            </Link>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait" initial={false}>
                    <motion.main
                        key={pathname}
                        id="main"
                        initial={reduce ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                        className={cn(fullBleed ? "px-3 pb-24 pt-3 sm:px-5 lg:pb-3" : "mx-auto w-full max-w-[1240px] px-4 pb-32 pt-8 sm:px-6 lg:pb-14 lg:pt-10")}
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>

                {/* Floating dock (phones/tablets) */}
                <nav aria-label="Main" className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
                    <div className="material mx-auto grid h-16 max-w-md grid-cols-5 items-center rounded-full px-2 shadow-[var(--shadow-deep)] ring-1 ring-border">
                        {NAV.filter((n) => n.href !== "/safety").map((item, i) => {
                            const active = isActive(pathname, item.href);
                            const link = (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn("relative mx-auto flex h-12 w-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold", active ? "text-primary" : "text-muted-foreground")}
                                >
                                    {active ? <motion.span layoutId="dock-pill" className="absolute inset-0 rounded-full bg-primary-soft" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} /> : null}
                                    <item.icon className="relative size-[22px]" aria-hidden strokeWidth={active ? 2.4 : 1.9} />
                                    <span className="relative">{item.label}</span>
                                </Link>
                            );
                            if (i !== 2) return link;
                            return [
                                <button
                                    key="new"
                                    type="button"
                                    onClick={openCreate}
                                    aria-label="New post"
                                    className="mx-auto -mt-7 flex size-14 items-center justify-center rounded-full bg-ink text-paper shadow-[var(--shadow-deep)] ring-4 ring-background active:scale-95"
                                >
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
