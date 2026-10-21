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
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <Loader2 className="size-7 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <DashboardLayout initialUser={user}>
      <HomeContent initialUser={user} initialPosts={[]} />
    </DashboardLayout>
  );
}
