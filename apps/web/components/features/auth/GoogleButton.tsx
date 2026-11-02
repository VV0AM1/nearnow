"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "../../../hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";

/** Google sign-in sized to its container; hidden when no client id is configured. */
export default function GoogleButton() {
    const { googleLogin, error } = useAuth();
    const { resolved } = useTheme();
    const box = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(320);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    useEffect(() => {
        // Google's button takes a fixed pixel width (max 400).
        const w = box.current?.clientWidth;
        if (w) setWidth(Math.min(400, Math.floor(w)));
    }, []);

    if (!clientId) return null;
    return (
        <div ref={box} className="flex w-full flex-col items-center gap-2">
            <GoogleOAuthProvider clientId={clientId}>
                <GoogleLogin
                    key={`${resolved}-${width}`}
                    onSuccess={(res) => res.credential && googleLogin(res.credential)}
                    theme={resolved === "dark" ? "filled_black" : "outline"}
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width={String(width)}
                />
            </GoogleOAuthProvider>
            {error ? <p className="text-[13px] text-danger">{error}</p> : null}
        </div>
    );
}
