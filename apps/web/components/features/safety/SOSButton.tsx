"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Phone, X } from "lucide-react";
import { useCreatePost } from "../../../hooks/useCreatePost";

const EMERGENCY_NUMBER = "112";
const COUNTDOWN = 5;
type Phase = "closed" | "info" | "locating" | "countdown" | "sending" | "result" | "error";

/**
 * Urgent help request. Creates a community alert only — it never claims emergency
 * services were contacted, always offers 112, and reports the real number of people
 * the server notified.
 */
export default function SOSButton() {
    const [phase, setPhase] = useState<Phase>("closed");
    const [seconds, setSeconds] = useState(COUNTDOWN);
    const [notified, setNotified] = useState(0);
    const [message, setMessage] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const coords = useRef<{ latitude: number; longitude: number } | null>(null);
    const sending = useRef(false);
    const { createPost } = useCreatePost();

    useEffect(() => setMounted(true), []);

    const close = () => {
        setPhase("closed");
        setSeconds(COUNTDOWN);
        setMessage(null);
    };

    const start = () => {
        if (!("geolocation" in navigator)) {
            setMessage("Your browser cannot share your location, which is needed for an urgent alert.");
            setPhase("error");
            return;
        }
        setPhase("locating");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                coords.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                setSeconds(COUNTDOWN);
                setPhase("countdown");
            },
            () => {
                setMessage("Your current location is needed to post an urgent alert.");
                setPhase("error");
            },
            { enableHighAccuracy: true, timeout: 15000 },
        );
    };

    useEffect(() => {
        if (phase !== "countdown") return;
        if (seconds === 0) {
            void send();
            return;
        }
        const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, seconds]);

    const send = async () => {
        if (sending.current || !coords.current) return;
        sending.current = true;
        setPhase("sending");
        try {
            const post = await createPost({ title: "Urgent help needed here", content: "", category: "DANGER", ...coords.current });
            setNotified(post?.alertSummary?.notified ?? 0);
            setPhase("result");
        } catch {
            setMessage(`Your alert could not be posted. Call ${EMERGENCY_NUMBER} if you need help.`);
            setPhase("error");
        } finally {
            sending.current = false;
            coords.current = null;
        }
    };

    const modal =
        phase === "closed" ? null : (
            <div role="dialog" aria-modal="true" aria-labelledby="urgent-title" className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-2xl bg-background border border-border p-6 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between">
                        <h2 id="urgent-title" className="text-xl font-bold">{phase === "result" ? "Alert posted" : "Urgent help request"}</h2>
                        {phase !== "sending" && (
                            <button onClick={close} aria-label="Close" className="p-2 rounded-lg hover:bg-secondary">
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm space-y-1">
                        <p className="font-bold text-red-600">If anyone is in danger, call {EMERGENCY_NUMBER} now.</p>
                        <p>NearNow is not an emergency service and does not contact police, ambulance or fire services.</p>
                    </div>
                    <a href={`tel:${EMERGENCY_NUMBER}`} className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 text-white font-bold py-3">
                        <Phone className="h-4 w-4" /> Call {EMERGENCY_NUMBER}
                    </a>

                    {phase === "info" && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Posting creates an urgent alert at your exact location. It is visible to everyone on NearNow and sent only to nearby people who chose to receive urgent alerts. It expires after 2 hours, then the location is blurred.
                            </p>
                            <button onClick={start} className="w-full rounded-lg border border-border py-3 font-bold hover:bg-secondary">
                                Post urgent alert
                            </button>
                        </>
                    )}
                    {phase === "locating" && <p className="text-center text-sm" aria-live="polite">Finding your location…</p>}
                    {phase === "countdown" && (
                        <>
                            <p className="text-center text-lg font-bold" aria-live="assertive">Posting in {seconds}…</p>
                            <button onClick={close} className="w-full rounded-lg border border-border py-3 font-bold hover:bg-secondary">
                                Cancel
                            </button>
                        </>
                    )}
                    {phase === "sending" && <p className="text-center text-sm" aria-live="polite">Posting your alert…</p>}
                    {phase === "result" && (
                        <div className="space-y-2 text-sm" aria-live="polite">
                            <p>
                                {notified > 0
                                    ? `${notified} nearby people who turned on urgent alerts were notified in the app.`
                                    : "Your alert is visible on NearNow, but nobody nearby has urgent alerts turned on right now."}
                            </p>
                            <p className="font-bold text-red-600">Nobody has been dispatched. Call {EMERGENCY_NUMBER} if you need help.</p>
                        </div>
                    )}
                    {phase === "error" && (
                        <div className="space-y-3">
                            <p className="text-sm text-red-600 font-medium" aria-live="assertive">{message}</p>
                            <button onClick={start} className="w-full rounded-lg border border-border py-3 font-bold hover:bg-secondary">
                                Try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );

    return (
        <>
            <button
                onClick={() => setPhase("info")}
                aria-label="Urgent help"
                className="flex items-center justify-center gap-2 p-2 md:px-4 md:py-2 border border-red-600/50 text-red-600 rounded-lg font-bold hover:bg-red-600/10 transition-colors"
            >
                <AlertTriangle className="h-5 w-5" />
                <span className="hidden md:inline">Urgent help</span>
            </button>
            {mounted && modal ? createPortal(modal, document.body) : null}
        </>
    );
}
