"use client";

import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import Button from "../../common/button/Button";
import ForgotPasswordModal from "./ForgotPasswordModal";
import GoogleButton from "./GoogleButton";

export default function LoginForm() {
    const { login, verifyOtp, loading, error } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"CREDENTIALS" | "OTP">("CREDENTIALS");
    const [showForgotModal, setShowForgotModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === "CREDENTIALS") {
            const success = await login(email, password);
            if (success) setStep("OTP");
        } else {
            await verifyOtp(email, otp);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                {step === "CREDENTIALS" ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex h-11 w-full rounded-lg border border-input bg-background/50 pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none">Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex h-11 w-full rounded-lg border border-input bg-background/50 pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg">Enter Verification Code</h3>
                            <p className="text-sm text-muted-foreground">We sent a code to {email}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">OTP Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                className="flex h-12 w-full text-center text-lg tracking-widest rounded-lg border border-input bg-background/50 px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-mono"
                                required
                            />
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    isLoading={loading}
                    className="w-full h-11 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                >
                    {step === "CREDENTIALS" ? (
                        <>Sign In <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                    ) : (
                        "Verify & Login"
                    )}
                </Button>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <GoogleButton />
            </form>

            <ForgotPasswordModal
                isOpen={showForgotModal}
                onClose={() => setShowForgotModal(false)}
            />
        </>
    );
}
