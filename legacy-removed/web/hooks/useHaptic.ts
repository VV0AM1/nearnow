"use client";

import { useCallback } from "react";

type HapticType = "success" | "error" | "heavy" | "light" | "medium";

export function useHaptic() {
    const triggerHaptic = useCallback((type: HapticType = "light") => {
        if (typeof window === "undefined" || !window.navigator || !window.navigator.vibrate) {
            return;
        }

        switch (type) {
            case "success":
                window.navigator.vibrate(10);
                break;
            case "error":
                window.navigator.vibrate([50, 50, 50]);
                break;
            case "heavy":
                window.navigator.vibrate(50);
                break;
            case "medium":
                window.navigator.vibrate(20);
                break;
            case "light":
            default:
                window.navigator.vibrate(5);
                break;
        }
    }, []);

    return { triggerHaptic };
}
