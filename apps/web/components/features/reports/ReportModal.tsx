"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import { Button, Dialog } from "@/components/nn";
import { cn } from "@/lib/utils";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

const REASONS = [
    ["SPAM", "Spam or advertising"],
    ["HARASSMENT", "Harassment or abuse"],
    ["PRIVATE_INFORMATION", "Shares private information"],
    ["UNVERIFIED_ACCUSATION", "Accuses a person without evidence"],
    ["MISLEADING", "False or misleading"],
    ["HATE_OR_VIOLENCE", "Hate or violence"],
    ["OTHER", "Something else"],
] as const;

/** Report a post to moderators; one reason, sent privately. */
export default function ReportModal({ isOpen, onClose, postId }: ReportModalProps) {
    const { toast } = useToast();
    const [reason, setReason] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    const close = () => {
        setReason("");
        onClose();
    };

    const submit = async () => {
        if (!reason) return;
        setSubmitting(true);
        try {
            await apiFetch("/reports", { method: "POST", json: { postId, reason } });
            toast({ title: "Report sent", description: "Thanks — a moderator will review it. The author is not told who reported." });
            close();
        } catch (error) {
            toast({ title: "Report not sent", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={close}
            title="Report this post"
            size="sm"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="plain" onClick={close}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={submit} loading={submitting} disabled={!reason}>
                        Send report
                    </Button>
                </div>
            }
        >
            <fieldset onClick={(e) => e.stopPropagation()}>
                <legend className="mb-3 text-[15px] text-muted-foreground">Why are you reporting it?</legend>
                <div className="divide-y divide-border overflow-hidden rounded-[14px] ring-1 ring-border">
                    {REASONS.map(([value, label]) => (
                        <label key={value} className={cn("flex min-h-[48px] cursor-pointer items-center gap-3 px-4 text-[15px] hover:bg-surface-2", reason === value && "bg-primary-soft")}>
                            <input type="radio" name="report-reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="size-4 accent-[var(--nn-accent)]" />
                            {label}
                        </label>
                    ))}
                </div>
            </fieldset>
        </Dialog>
    );
}
