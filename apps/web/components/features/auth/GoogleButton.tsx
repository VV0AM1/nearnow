"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "../../../hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";

/** Google sign-in; hidden when no client id is configured for this build. */
export default function GoogleButton() {
    const { googleLogin, error } = useAuth();
    const { resolved } = useTheme();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    if (!clientId) return null;

    return (
        <div className="flex w-full flex-col items-center gap-2 [&>div]:w-full">
            <GoogleOAuthProvider clientId={clientId}>
                <GoogleLogin
                    onSuccess={(res) => res.credential && googleLogin(res.credential)}
                    theme={resolved === "dark" ? "filled_black" : "outline"}
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="400"
                />
            </GoogleOAuthProvider>
            {error ? <p className="text-[13px] text-danger">{error}</p> : null}
        </div>
    );
}
