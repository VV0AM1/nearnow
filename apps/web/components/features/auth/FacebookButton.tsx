"use client";

import { useEffect, useState } from "react";
import { Facebook } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

export default function FacebookButton() {
    const { facebookLogin, error } = useAuth();
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

    useEffect(() => {
        if (!appId) return;

        // Load SDK
        if (document.getElementById('facebook-jssdk')) {
            setSdkLoaded(true);
            return;
        }

        window.fbAsyncInit = function () {
            window.FB.init({
                appId: appId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
            setSdkLoaded(true);
        };

        (function (d, s, id) {
            const fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            const js = d.createElement(s) as any;
            js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode?.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }, [appId]);

    const handleLogin = () => {
        if (!sdkLoaded || !window.FB) return;

        window.FB.login(function (response: any) {
            if (response.authResponse) {
                facebookLogin(response.authResponse.accessToken);
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, { scope: 'public_profile,email' });
    };

    if (!appId) {
        return null; // Don't show if no App ID
    }

    return (
        <div className="w-full flex flex-col items-center gap-2 mt-2">
            <button
                type="button"
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1864cc] text-white h-10 rounded-full text-sm font-medium transition-colors"
            >
                <Facebook className="h-5 w-5 fill-white" />
                Continue with Facebook
            </button>
            {/* Error handled by parent or toast usually, but showing here for consistency if needed */}
        </div>
    );
}
