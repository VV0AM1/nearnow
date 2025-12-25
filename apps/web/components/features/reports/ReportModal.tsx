"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

export default function ReportModal({ isOpen, onClose, postId }: ReportModalProps) {
    const { toast } = useToast();
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ postId, reason })
            });

            if (!res.ok) throw new Error("Failed to submit report");

            toast({
                title: "Report Submitted",
                description: "Thank you for helping keep our community safe.",
            });
            onClose();
            setReason("");
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not submit report. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                    ✕
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-red-500 w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Report Content</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Why are you reporting this?</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select a reason</option>
                            <option value="spam">Spam or Misleading</option>
                            <option value="harassment">Harassment or Hate Speech</option>
                            <option value="inappropriate_image">Inappropriate Image</option>
                            <option value="violence">Violence or Threat</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
