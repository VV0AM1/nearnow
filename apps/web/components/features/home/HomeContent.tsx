"use client";

import Feed from "../feed/Feed";
import { useDashboard } from "../../../context/DashboardContext";
import { AreaChooser } from "@/components/shell/AreaChooser";
import { Card } from "@/components/nn";
import { Post } from "../../../types/post";
import { User } from "../../../types/user";

interface HomeContentProps {
    initialUser: User;
    initialPosts: Post[];
}

export default function HomeContent({ initialPosts }: HomeContentProps) {
    const { location } = useDashboard();

    // No silent default city: the user chooses an area first.
    if (!location) {
        return (
            <div className="mx-auto max-w-lg py-6">
                <h1 className="text-[28px] font-bold tracking-tight">Which area do you want to follow?</h1>
                <p className="mb-6 mt-1 text-[15px] text-muted-foreground">NearNow shows community posts around the area you choose.</p>
                <Card>
                    <AreaChooser />
                </Card>
            </div>
        );
    }

    return <Feed initialPosts={initialPosts} />;
}
