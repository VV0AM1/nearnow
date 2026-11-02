"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { usePasswordReset } from "../../../hooks/usePasswordReset";
import { Banner, Button, Dialog, TextField } from "@/components/nn";
import { PasswordField } from "./AuthFields";

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Two steps: request a code by email, then set a new password with it. */
export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const { requestReset, confirmReset, step, loading, error, email } = usePasswordReset();
    const [inputEmail, setInputEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [done, setDone] = useState(false);

    return (
        <Dialog open={isOpen} onClose={onClose} title="Reset your password" size="sm">
            {done ? (
                <div className="space-y-4 text-center">
                    <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
                    <p className="text-[15px]">Your password was changed. Sign in with the new one.</p>
                    <Button block onClick={onClose}>
                        Back to sign in
                    </Button>
                </div>
            ) : step === "REQUEST" ? (
                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await requestReset(inputEmail);
                    }}
                >
                    <p className="text-[15px] text-muted-foreground">Enter your account email and we’ll send you a code.</p>
                    {error ? <Banner tone="danger" message={error} /> : null}
                    <TextField label="Email" type="email" autoComplete="email" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} required />
                    <Button type="submit" block loading={loading}>
                        Send code
                    </Button>
                </form>
            ) : (
                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (await confirmReset(otp, password)) setDone(true);
                    }}
                >
                    <p className="text-[15px] text-muted-foreground">If an account exists for {email}, a code is on its way.</p>
                    {error ? <Banner tone="danger" message={error} /> : null}
                    <TextField
                        label="6-digit code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="text-center text-[20px] tracking-[0.4em]"
                        required
                    />
                    <PasswordField label="New password" value={password} onChange={setPassword} newPassword />
                    <Button type="submit" block loading={loading} disabled={otp.length !== 6 || password.length < 8}>
                        Set new password
                    </Button>
                </form>
            )}
        </Dialog>
    );
}
