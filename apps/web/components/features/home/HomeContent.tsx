"use client";

import { useState } from "react";
import Feed from "../feed/Feed";
import CreateAlertModal from "../alerts/CreateAlert";
import AreaPrompt from "./AreaPrompt";
import { useDashboard } from "../../../context/DashboardContext";
import { Post } from "../../../types/post";
import { User } from "../../../types/user";

interface HomeContentProps {
    initialUser: User;
    initialPosts: Post[];
}

export default function HomeContent({ initialPosts }: HomeContentProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { location } = useDashboard();

    // No silent default city: the user chooses an area first.
    if (!location) return <AreaPrompt />;

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <CreateAlertModal
                key={isModalOpen ? "open" : "closed"}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userLocation={location}
            />

            <div className="flex-1 min-h-0 w-full relative">
                <Feed initialPosts={initialPosts} onReportClick={() => setIsModalOpen(true)} />
            </div>
        </div>
    );
}
