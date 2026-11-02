"use client";

import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Banner, Button, TextField } from "@/components/nn";
import ForgotPasswordModal from "./ForgotPasswordModal";
import GoogleButton from "./GoogleButton";
import FacebookButton from "./FacebookButton";
import { OtpStep, PasswordField, SocialDivider } from "./AuthFields";

export default function LoginForm() {
    const { login, verifyOtp, loading, error } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState<"CREDENTIALS" | "OTP">("CREDENTIALS");
    const [forgot, setForgot] = useState(false);

    if (step === "OTP") {
        return <OtpStep email={email} loading={loading} error={error} onVerify={(code) => verifyOtp(email, code)} onResend={() => login(email, password)} onBack={() => setStep("CREDENTIALS")} />;
    }

    return (
        <>
            <form
                className="space-y-4"
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (await login(email, password)) setStep("OTP");
                }}
            >
                {error ? <Banner tone="danger" message={error} /> : null}
                <TextField label="Email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <PasswordField label="Password" value={password} onChange={setPassword} />
                <div className="flex justify-end">
                    <button type="button" onClick={() => setForgot(true)} className="text-[13px] font-semibold text-primary hover:underline">
                        Forgot password?
                    </button>
                </div>
                <Button type="submit" size="lg" block loading={loading}>
                    Sign in
                </Button>
            </form>
            <SocialDivider />
            <div className="space-y-3">
                <GoogleButton />
                <FacebookButton />
            </div>
            <ForgotPasswordModal isOpen={forgot} onClose={() => setForgot(false)} />
        </>
    );
}
