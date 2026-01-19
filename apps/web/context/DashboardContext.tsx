"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Location {
    lat: number;
    long: number;
}

interface DashboardContextType {
    location: Location;
    setLocation: (loc: Location) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    // We can add radius/filters here later if we want them global
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    // Default to San Francisco or user's last known location
    const [location, setLocation] = useState<Location>({ lat: 37.7749, long: -122.4194 });
    const [searchQuery, setSearchQuery] = useState("");

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
