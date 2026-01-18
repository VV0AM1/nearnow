"use client";

import { useState, useEffect } from "react";
import Feed from "../feed/Feed";
import CreateAlertModal from "../alerts/CreateAlert";
import { useGeoLocation } from "../../../hooks/useGeoLocation";
import { Post } from "../../../types/post";
import { User } from "../../../types/user";
import Cookies from "js-cookie";

interface HomeContentProps {
    initialUser: User;
    initialPosts: Post[];
    initialLocation: { lat: number; long: number };
}

export default function HomeContent({ initialUser, initialPosts, initialLocation }: HomeContentProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Start with server provided location, but allow client geo to update it
    const [feedLocation, setFeedLocation] = useState(initialLocation);
    const { location: userGeo, getUserLocation } = useGeoLocation();

    // Auto-detect location on first load
    useEffect(() => {
        getUserLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update feed when geolocation is found
    useEffect(() => {
        if (userGeo.latitude && userGeo.longitude) {
            const newLoc = { lat: userGeo.latitude, long: userGeo.longitude };
            setFeedLocation(newLoc);
            // Persist location for next SSR (valid for 7 days)
            Cookies.set("nearnow_location", JSON.stringify(newLoc), { expires: 7 });
        }
    }, [userGeo.latitude, userGeo.longitude]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Page Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-background/50 backdrop-blur-sm z-10">
                <h1 className="text-2xl font-bold">Your Feed</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                >
                    + Report Incident
                </button>
            </div>

            <CreateAlertModal
                key={isModalOpen ? "open" : "closed"}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userLocation={feedLocation}
            />

            <div className="flex-1 min-h-0 w-full relative px-6 pb-6">
                <Feed
                    initialLocation={feedLocation}
                    initialPosts={initialPosts}
                />
            </div>
        </div>
    );
}
