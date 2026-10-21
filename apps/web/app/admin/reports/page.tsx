"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

interface Report {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: { id: string; name: string };
    post: { id: string; title: string; content: string; imageUrl: string | null };
}

export default function AdminReportsPage() {
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch reports");
                const data = await res.json();
                setReports(data);
            } catch (error) {
                console.error("Failed to fetch reports", error);
                toast({ title: "Error", description: "Could not load reports", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [toast]);

    const resolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${reportId}/resolve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Failed to resolve report");

            // Remove from list or update status
            setReports(reports.filter(r => r.id !== reportId));

            toast({ title: "Success", description: `Report marked as ${status.toLowerCase()}.` });
        } catch (error) {
            toast({ title: "Error", description: "Action failed", variant: "destructive" });
        }
    };

    const deletePost = async (postId: string, reportId: string) => {
        if (!confirm("Remove this post from public view? It is kept for the moderation audit log.")) return;

        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete post");

            // Automatically resolve report as RESOLVED
            await resolveReport(reportId, 'RESOLVED');

            toast({ title: "Post removed", description: "Hidden from the public and report resolved." });
        } catch (error) {
            toast({ title: "Error", description: "Delete failed", variant: "destructive" });
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-foreground" /></div>;

    return (
        <div>
            <h1 className="sr-only">Reported Content</h1>

            {reports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending reports. Great job!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-surface rounded-[20px] shadow-[var(--shadow-card)] p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                            <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-danger-soft text-danger text-xs font-bold rounded uppercase tracking-wider">{report.reason}</span>
                                    <span className="text-xs text-muted-foreground" title={report.createdAt}>
                                        Reported {formatDistanceToNow(new Date(report.createdAt))} ago
                                    </span>
                                    <span className="text-xs text-muted-foreground">by {report.reporter?.name || 'Unknown'}</span>
                                </div>

                                <div className="bg-surface-2 rounded-[14px] p-3 md:p-4">
                                    <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                                        {report.post?.title}
                                        <Link href={`/post/${report.post?.id}`} target="_blank" className="text-primary hover:underline">
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </h3>
                                    <p className="text-muted-foreground text-sm line-clamp-2">{report.post?.content}</p>
                                    {report.post?.imageUrl && (
                                        <img src={report.post.imageUrl} alt="Reported content" className="mt-2 h-20 w-32 object-cover rounded border border-border opacity-50 hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                            </div>

                            <div className="flex md:flex-col gap-2 justify-start md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                                <button
                                    onClick={() => deletePost(report.post.id, report.id)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-danger hover:brightness-110 text-foreground rounded-xl text-sm font-medium transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="md:hidden lg:inline">Delete & Resolve</span>
                                    <span className="hidden md:inline lg:hidden">Delete</span>
                                </button>
                                <button
                                    onClick={() => resolveReport(report.id, 'DISMISSED')}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-surface-2 hover:brightness-95 text-foreground rounded-xl text-sm font-medium transition-colors"
                                >
                                    <span className="md:hidden lg:inline">Dismiss Report</span>
                                    <span className="hidden md:inline lg:hidden">Dismiss</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
