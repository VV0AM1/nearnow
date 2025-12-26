"use client";

import { useState, useEffect } from "react";
import { useCreatePost } from "../../../hooks/useCreatePost";
import { useGeoLocation } from "../../../hooks/useGeoLocation";
import { useToast } from "../../../components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

// Simple Portal Component for inline usage
const Portal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    // Safety check for document body
    if (typeof document === "undefined") return null;

    return createPortal(children, document.body);
};

export default function SOSButton() {
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [count, setCount] = useState(3);
    const { createPost } = useCreatePost();
    const { location, getUserLocation } = useGeoLocation();
    const { toast } = useToast();

    // Reset countdown when closed
    useEffect(() => {
        if (!isCountingDown) {
            setCount(3);
        }
    }, [isCountingDown]);

    // Timer Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isCountingDown && count > 0) {
            timer = setTimeout(() => setCount(c => c - 1), 1000);
        } else if (isCountingDown && count === 0) {
            handleSOS();
        }
        return () => clearTimeout(timer);
    }, [isCountingDown, count]);

    const handleTrigger = () => {
        // Refresh location immediately
        getUserLocation();
        setIsCountingDown(true);
    };

    const handleSOS = async () => {
        setIsCountingDown(false); // Close modal

        if (!location.latitude || !location.longitude) {
            toast({
                title: "Location Unavailable",
                description: "Cannot send SOS without GPS location.",
                variant: "destructive"
            });
            return;
        }

        try {
            await createPost({
                title: "SOS Signal",
                content: "EMERGENCY: I need immediate assistance at this location.",
                category: "DANGER",
                latitude: location.latitude,
                longitude: location.longitude,
                // We skip neighborhood/city for speed/reliability in emergency
                // Backend will accept just coords
            });

            toast({
                title: "SOS SENT",
                description: "Emergency alert broadcasted to nearby users.",
                className: "bg-red-600 text-white border-none"
            });
        } catch (error) {
            toast({
                title: "Failed to Send SOS",
                description: "Please call 911 directly.",
                variant: "destructive"
            });
        }
    };

    return (
        <>
            <button
                onClick={handleTrigger}
                className="group relative flex items-center justify-center gap-2 p-2 md:px-4 md:py-2 bg-red-600/10 hover:bg-red-600/20 md:border md:border-red-600/50 text-red-500 rounded-lg transition-all font-bold uppercase tracking-wider"
            >
                <div className="absolute inset-0 bg-red-600/20 rounded-lg animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
                <AlertTriangle className="h-5 w-5" />
                <span className="hidden md:inline">SOS</span>
            </button>

            <AnimatePresence>
                {isCountingDown && (
                    <Portal>
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-3xl h-[100dvh] w-screen touch-none">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="flex flex-col items-center gap-8 p-4 relative w-full h-full justify-center"
                            >
                                <div className="text-red-500 font-black text-3xl md:text-5xl tracking-[0.2em] animate-pulse text-center">
                                    SENDING SOS
                                </div>

                                <div className="relative flex items-center justify-center py-10">
                                    {/* Ripple Effects */}
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150" />
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-125 delay-75" />

                                    <div className="h-48 w-48 md:h-64 md:w-64 rounded-full bg-red-600 flex items-center justify-center text-white text-8xl md:text-9xl font-black shadow-[0_0_50px_rgba(220,38,38,0.6)] z-10">
                                        {count}
                                    </div>
                                </div>

                                <p className="text-zinc-400 text-center max-w-sm text-lg md:text-xl px-4">
                                    Broadcasting emergency alert to all nearby users...
                                </p>

                                <button
                                    onClick={() => setIsCountingDown(false)}
                                    className="flex items-center gap-3 px-12 py-5 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold text-xl transition-colors border border-white/10 mt-8 active:scale-95"
                                >
                                    <X className="h-8 w-8" />
                                    CANCEL
                                </button>
                            </motion.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>
        </>
    );
}
