"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import { Banner, Button, TextField } from "@/components/nn";
import GoogleButton from "./GoogleButton";
import FacebookButton from "./FacebookButton";
import { OtpStep, PasswordField, SocialDivider } from "./AuthFields";

const PASSWORD_MIN = 8;

export default function SignupForm() {
    const { signup, login, verifyOtp, loading, error } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState<"CREDENTIALS" | "OTP">("CREDENTIALS");
    const [tooShort, setTooShort] = useState(false);

    if (step === "OTP") {
        // After sign-up the account exists, so a new code comes from the normal sign-in step.
        return <OtpStep email={email} loading={loading} error={error} onVerify={(code) => verifyOtp(email, code)} onResend={() => login(email, password)} onBack={() => setStep("CREDENTIALS")} />;
    }

    return (
        <>
            <form
                className="space-y-4"
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (password.length < PASSWORD_MIN) return setTooShort(true);
                    if (await signup(email, password, name.trim())) setStep("OTP");
                }}
            >
                {error ? <Banner tone="danger" message={error} /> : null}
                <TextField label="Name" autoComplete="name" placeholder="How neighbours will see you" value={name} max={60} onChange={(e) => setName(e.target.value)} required />
                <TextField label="Email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <PasswordField
                    label="Password"
                    value={password}
                    newPassword
                    error={tooShort && password.length < PASSWORD_MIN ? `Use at least ${PASSWORD_MIN} characters.` : null}
                    onChange={(v) => {
                        setPassword(v);
                        setTooShort(false);
                    }}
                />
                <Button type="submit" size="lg" block loading={loading}>
                    Create account
                </Button>
                <p className="text-center text-[13px] text-muted-foreground">
                    By continuing you agree to the{" "}
                    <Link href="/legal" className="font-semibold text-primary hover:underline">
                        terms and privacy policy
                    </Link>
                    .
                </p>
            </form>
            <SocialDivider />
            <div className="space-y-3">
                <GoogleButton />
                <FacebookButton />
            </div>
        </>
    );
}
