"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
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
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch reports");
            const data = await res.json();
            setReports(data);
        } catch (error) {
            toast({ title: "Error", description: "Could not load reports", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const resolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
        try {
            const token = localStorage.getItem('token');
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
        if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete post");

            // Automatically resolve report as RESOLVED
            await resolveReport(reportId, 'RESOLVED');

            toast({ title: "Post Deleted", description: "Content removed and report resolved." });
        } catch (error) {
            toast({ title: "Error", description: "Delete failed", variant: "destructive" });
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Reported Content</h1>

            {reports.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending reports. Great job!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-zinc-900 border border-white/10 rounded-xl p-6 flex gap-6">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded uppercase tracking-wider">{report.reason}</span>
                                    <span className="text-xs text-zinc-500" title={report.createdAt}>
                                        Reported {formatDistanceToNow(new Date(report.createdAt))} ago
                                    </span>
                                    <span className="text-xs text-zinc-500">by {report.reporter?.name || 'Unknown'}</span>
                                </div>

                                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                                    <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                                        {report.post?.title}
                                        <Link href={`/post/${report.post?.id}`} target="_blank" className="text-blue-400 hover:text-blue-300">
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </h3>
                                    <p className="text-zinc-400 text-sm line-clamp-2">{report.post?.content}</p>
                                    {report.post?.imageUrl && (
                                        <img src={report.post.imageUrl} alt="Reported content" className="mt-2 h-20 w-32 object-cover rounded border border-white/10 opacity-50 hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 justify-center shrink-0 border-l border-white/10 pl-6">
                                <button
                                    onClick={() => deletePost(report.post.id, report.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Post & Resolve
                                </button>
                                <button
                                    onClick={() => resolveReport(report.id, 'DISMISSED')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Dismiss Report
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
