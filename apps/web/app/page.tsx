"use client";

import { useState, useEffect } from "react";
import Feed from "../components/features/feed/Feed";
import CreateAlertModal from "../components/features/alerts/CreateAlertModal";
import Navbar from "../components/layout/Navbar";
import Button from "../components/common/button/Button";
import LocationSearch from "../components/features/feed/LocationSearch";
import { useGeoLocation } from "../hooks/useGeoLocation";
import { MapPin } from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedLocation, setFeedLocation] = useState({ lat: 37.7749, long: -122.4194 });
  const { location: userGeo, getUserLocation } = useGeoLocation();

  // Auto-detect location on first load
  useEffect(() => {
    getUserLocation();
  }, []);

  // Update feed when geolocation is found
  useEffect(() => {
    if (userGeo.latitude && userGeo.longitude) {
      setFeedLocation({ lat: userGeo.latitude, long: userGeo.longitude });
    }
  }, [userGeo.latitude, userGeo.longitude]);

  return (
    <div className="min-h-screen flex flex-col">
      <CreateAlertModal
        key={isModalOpen ? "open" : "closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userLocation={feedLocation}
      />

      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-12">

          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Know what’s happening <br />
              <span className="text-primary">around you</span>, right now.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Live neighborhood alerts, safety info, and micro-communities.
              Connect with your neighbors instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto w-full">
              <div className="w-full sm:flex-1">
                <LocationSearch
                  onLocationSelect={(lat, long) => {
                    setFeedLocation({ lat, long });
                    // Also persist manual selection so refresh keeps them there
                    localStorage.setItem("userLocation", JSON.stringify({ lat, long }));
                  }}
                />
              </div>

              <Button size="lg" onClick={getUserLocation} isLoading={userGeo.loading}>
                <MapPin className="mr-2 h-4 w-4" />
                Explore Area
              </Button>

              <Button size="lg" variant="secondary" onClick={() => setIsModalOpen(true)}>
                Post Alert
              </Button>
            </div>
          </div>

          <div className="w-full mt-12 lg:mt-0">
            <div className="relative glass-card p-6 border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Live Neighborhood Feed
                </h2>
                <div className="text-sm text-muted-foreground hidden sm:block">
                  Displaying alerts for <span className="font-semibold text-foreground">Current Area</span>
                </div>
              </div>

              <Feed initialLocation={feedLocation} />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm">
        <p>&copy; 2024 NearNow. Connect with your neighborhood.</p>
      </footer>
    </div>
  );
}
