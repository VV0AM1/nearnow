import { useState } from "react";

export function usePasswordReset() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
    const [email, setEmail] = useState("");

    const requestReset = async (email: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:3002/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) throw new Error("Failed to send reset code");

            setEmail(email);
            setStep("VERIFY");
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const confirmReset = async (otp: string, newPassword: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("http://localhost:3002/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            if (!res.ok) throw new Error("Failed to reset password");

            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { requestReset, confirmReset, step, loading, error, email };
}
