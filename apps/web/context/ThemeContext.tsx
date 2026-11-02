"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
const STORAGE_KEY = "nn-theme";

/**
 * Runs before React (inline in <head>) so the first paint already uses the right
 * theme. Kept tiny and self-contained; it only reads localStorage and matchMedia.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem('${STORAGE_KEY}')||'system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

interface ThemeValue {
    mode: ThemeMode;
    resolved: "light" | "dark";
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function systemDark() {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>("system");
    const [resolved, setResolved] = useState<"light" | "dark">("light");

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === "light" || saved === "dark" || saved === "system") setModeState(saved);
        } catch {
            // storage unavailable: follow the system
        }
    }, []);

    useEffect(() => {
        const apply = () => {
            const next = mode === "dark" || (mode === "system" && systemDark()) ? "dark" : "light";
            document.documentElement.dataset.theme = next;
            setResolved(next);
        };
        apply();
        if (mode !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
    }, [mode]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // keep in memory only
        }
    }, []);

    return <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
