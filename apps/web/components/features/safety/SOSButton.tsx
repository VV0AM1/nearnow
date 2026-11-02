"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Megaphone, Phone } from "lucide-react";
import { useCreatePost } from "../../../hooks/useCreatePost";
import { Banner, Button, Dialog, IconButton } from "@/components/nn";
import { cn } from "@/lib/utils";

const EMERGENCY_NUMBER = "112";
const COUNTDOWN = 5;
type Phase = "closed" | "info" | "locating" | "countdown" | "sending" | "result" | "error";

/**
 * Urgent help request. Creates a community alert only — it never claims emergency
 * services were contacted, always offers 112, and reports the real number of people
 * the server notified.
 */
export default function SOSButton({ variant = "full" }: { variant?: "full" | "icon" }) {
    const [phase, setPhase] = useState<Phase>("closed");
    const [seconds, setSeconds] = useState(COUNTDOWN);
    const [notified, setNotified] = useState(0);
    const [message, setMessage] = useState<string | null>(null);
    const coords = useRef<{ latitude: number; longitude: number } | null>(null);
    const sending = useRef(false);
    const { createPost } = useCreatePost();

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

    const progress = seconds / COUNTDOWN;

    return (
        <>
            {variant === "icon" ? (
                <IconButton icon={AlertCircle} label="Urgent help" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setPhase("info")} />
            ) : (
                <Button variant="destructiveTinted" icon={AlertCircle} block onClick={() => setPhase("info")}>
                    Urgent help
                </Button>
            )}

            <Dialog open={phase !== "closed"} onClose={close} dismissible={phase !== "sending"} title={phase === "result" ? "Alert posted" : "Urgent help request"} size="sm">
                <div className="space-y-4">
                    <div className="space-y-3 rounded-[16px] bg-danger-soft p-4">
                        <div className="flex gap-2.5">
                            <Phone className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
                            <div className="space-y-1">
                                <p className="font-semibold text-danger">If anyone is in danger, call {EMERGENCY_NUMBER} now.</p>
                                <p className="text-sm">NearNow is not an emergency service and does not contact police, ambulance or fire services.</p>
                            </div>
                        </div>
                        <a href={`tel:${EMERGENCY_NUMBER}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-danger text-base font-semibold text-white hover:brightness-110">
                            <Phone className="size-[18px]" aria-hidden /> Call {EMERGENCY_NUMBER}
                        </a>
                    </div>

                    {phase === "info" ? (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Posting creates an urgent alert at your exact location. It is visible to everyone on NearNow and sent only to nearby people who chose to receive urgent alerts. It expires after 2 hours, then the location is blurred.
                            </p>
                            <Button variant="tinted" icon={Megaphone} block onClick={start}>
                                Post urgent alert
                            </Button>
                        </>
                    ) : null}
                    {phase === "locating" ? (
                        <Button variant="tinted" loading block>
                            Finding your location…
                        </Button>
                    ) : null}
                    {phase === "countdown" ? (
                        <div className="flex flex-col items-center gap-4 py-2" role="timer" aria-live="assertive" aria-label={`Posting in ${seconds}`}>
                            <div className="relative size-32">
                                <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
                                    <circle cx="60" cy="60" r="52" fill="none" strokeWidth="9" className="stroke-danger-soft" />
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="52"
                                        fill="none"
                                        strokeWidth="9"
                                        strokeLinecap="round"
                                        className="stroke-danger transition-[stroke-dashoffset] duration-1000 ease-linear"
                                        strokeDasharray={2 * Math.PI * 52}
                                        strokeDashoffset={2 * Math.PI * 52 * (1 - progress)}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold tabular-nums text-danger">{seconds}</span>
                            </div>
                            <p className="font-semibold">Posting in {seconds}…</p>
                            <Button variant="tinted" size="lg" block onClick={close}>
                                Cancel
                            </Button>
                        </div>
                    ) : null}
                    {phase === "sending" ? (
                        <Button variant="tinted" loading block>
                            Posting your alert…
                        </Button>
                    ) : null}
                    {phase === "result" ? (
                        <div className="space-y-3" aria-live="polite">
                            <div className="flex gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                                    <Check className="size-5" aria-hidden />
                                </span>
                                <p className="text-[15px]">
                                    {notified > 0
                                        ? `${notified} nearby people who turned on urgent alerts were notified in the app.`
                                        : "Your alert is visible on NearNow, but nobody nearby has urgent alerts turned on right now."}
                                </p>
                            </div>
                            <p className={cn("font-semibold text-danger")}>Nobody has been dispatched. Call {EMERGENCY_NUMBER} if you need help.</p>
                            <Button variant="plain" block onClick={close}>
                                Close
                            </Button>
                        </div>
                    ) : null}
                    {phase === "error" ? (
                        <div className="space-y-3">
                            <Banner tone="danger" message={message} />
                            <Button variant="tinted" block onClick={start}>
                                Try again
                            </Button>
                        </div>
                    ) : null}
                </div>
            </Dialog>
        </>
    );
}
