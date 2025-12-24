import Link from "next/link";
import { Shield, Users, Flag, LayoutDashboard, LogOut } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-zinc-950 flex flex-col">
                <div className="p-6 flex items-center gap-3 border-b border-white/10">
                    <Shield className="w-8 h-8 text-red-500" />
                    <span className="font-bold text-xl tracking-wide">Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <Users className="w-5 h-5" />
                        <span>Users</span>
                    </Link>
                    <Link href="/admin/reports" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <Flag className="w-5 h-5" />
                        <span>Reports</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span>Exit Admin</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-black p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
