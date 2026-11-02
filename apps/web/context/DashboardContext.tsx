"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

export interface Location {
    lat: number;
    long: number;
    label?: string;
}

interface DashboardContextType {
    /** The area the user chose (city or their location). null until they choose — never a silent default. */
    location: Location | null;
    setLocation: (loc: Location) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const STORAGE_KEY = "userLocation";
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const isLocation = (v: unknown): v is Location => {
    const l = v as Location;
    return !!l && typeof l.lat === "number" && typeof l.long === "number" && Math.abs(l.lat) <= 90 && Math.abs(l.long) <= 180;
};

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [location, setLocationState] = useState<Location | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            if (isLocation(parsed)) setLocationState(parsed);
        } catch {
            // ignore malformed cache
        }
    }, []);

    const setLocation = useCallback((loc: Location) => {
        setLocationState(loc);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        } catch {
            // storage unavailable: keep in memory
        }
    }, []);

    return (
        <DashboardContext.Provider value={{ location, setLocation, searchQuery, setSearchQuery }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}
