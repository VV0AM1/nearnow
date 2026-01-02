"use client";

import { useAuthContext } from "../context/AuthContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import LandingPage from "../components/features/landing/LandingPage";
import HomeContent from "../components/features/home/HomeContent";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Default location (SF) - HomeContent handles geo-updates
  const defaultLocation = { lat: 37.7749, long: -122.4194 };

  return (
    <DashboardLayout initialUser={user}>
      <HomeContent
        initialUser={user}
        initialPosts={[]}
        initialLocation={defaultLocation}
      />
    </DashboardLayout>
  );
}
