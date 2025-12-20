"use client";

import { useState } from "react";
import { X, Mail, Key, Lock, ArrowRight, Check } from "lucide-react";
import Button from "../../common/button/Button";
import { usePasswordReset } from "../../../hooks/usePasswordReset"; // Check import path

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const { requestReset, confirmReset, step, loading, error, email } = usePasswordReset();
    const [inputEmail, setInputEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        await requestReset(inputEmail);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const done = await confirmReset(otp, newPassword);
        if (done) setSuccess(true);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                        <Key className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Recover Password</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        {step === "REQUEST"
                            ? "Enter your email to receive a recovery code."
                            : "Check your email for the code."}
                    </p>
                </div>

                {success ? (
                    <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <Check className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Password Reset!</h3>
                        <p className="text-muted-foreground mb-6">You can now login with your new password.</p>
                        <Button onClick={onClose} className="w-full">
                            Back to Login
                        </Button>
                    </div>
                ) : (
                    <>
                        {step === "REQUEST" ? (
                            <form onSubmit={handleRequest} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={inputEmail}
                                            onChange={(e) => setInputEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            required
                                            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                                <Button type="submit" isLoading={loading} className="w-full">
                                    Send Code <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-4">
                                <p className="text-sm text-center text-muted-foreground bg-secondary/30 py-2 rounded-lg">
                                    Code sent to <span className="text-foreground font-medium">{email}</span>
                                </p>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Verification Code</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="123456"
                                        className="w-full h-12 text-center text-2xl tracking-[0.5em] font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                                <Button type="submit" isLoading={loading} className="w-full">
                                    Reset Password
                                </Button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
