"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Banner, Button, IconButton, TextField } from "@/components/nn";

export function PasswordField({ label, value, onChange, newPassword, error }: { label: string; value: string; onChange: (v: string) => void; newPassword?: boolean; error?: string | null }) {
    const [visible, setVisible] = useState(false);
    return (
        <TextField
            label={label}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={newPassword ? "new-password" : "current-password"}
            hint={newPassword ? "At least 8 characters." : undefined}
            error={error}
            required
            right={<IconButton icon={visible ? EyeOff : Eye} label={visible ? "Hide password" : "Show password"} size="sm" onClick={() => setVisible((v) => !v)} />}
        />
    );
}

const RESEND_SECONDS = 60;

/** Second step: the emailed 6-digit code. Supports one-time-code autofill. */
export function OtpStep({ email, loading, error, onVerify, onResend, onBack }: { email: string; loading: boolean; error: string | null; onVerify: (code: string) => void; onResend: () => Promise<unknown>; onBack: () => void }) {
    const [code, setCode] = useState("");
    const [wait, setWait] = useState(RESEND_SECONDS);
    const [resent, setResent] = useState(false);

    useEffect(() => {
        if (wait <= 0) return;
        const id = setTimeout(() => setWait((w) => w - 1), 1000);
        return () => clearTimeout(id);
    }, [wait]);

    return (
        <form
            className="space-y-5"
            onSubmit={(e) => {
                e.preventDefault();
                if (code.length === 6) onVerify(code);
            }}
        >
            <div>
                <h2 className="text-[19px] font-bold">Check your email</h2>
                <p className="mt-1 text-[15px] text-muted-foreground">
                    We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>.
                </p>
            </div>
            {error ? <Banner tone="danger" message={error} /> : null}
            {resent ? <Banner tone="success" message="A new code is on its way." /> : null}
            <TextField
                label="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                className="h-14 text-center text-[26px] font-semibold tracking-[0.5em] tabular-nums"
            />
            <Button type="submit" size="lg" block loading={loading} disabled={code.length !== 6}>
                Verify and continue
            </Button>
            <div className="flex flex-col items-center gap-1">
                <Button
                    variant="plain"
                    size="sm"
                    disabled={wait > 0}
                    onClick={async () => {
                        await onResend();
                        setResent(true);
                        setWait(RESEND_SECONDS);
                    }}
                >
                    {wait > 0 ? `You can request a new code in ${wait}s` : "Send a new code"}
                </Button>
                <Button variant="plain" size="sm" icon={ChevronLeft} onClick={onBack}>
                    Back
                </Button>
            </div>
        </form>
    );
}

export function SocialDivider() {
    return (
        <div className="relative my-6 text-center text-[13px] text-muted-foreground">
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
            <span className="relative bg-surface px-3">or</span>
        </div>
    );
}
