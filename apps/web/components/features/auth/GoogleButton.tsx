"use client";

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../hooks/useAuth';

export default function GoogleButton() {
    const { googleLogin, error } = useAuth();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    if (!clientId) {
        return <div className="text-destructive text-xs">Missing Google Client ID</div>;
    }

    return (
        <div className="w-full flex flex-col items-center gap-2">
            <GoogleOAuthProvider clientId={clientId}>
                <GoogleLogin
                    onSuccess={credentialResponse => {
                        if (credentialResponse.credential) {
                            googleLogin(credentialResponse.credential);
                        }
                    }}
                    onError={() => {
                        console.log('Login Failed');
                    }}
                    useOneTap
                    theme="filled_black"
                    shape="pill"
                    width="100%"
                />
            </GoogleOAuthProvider>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
