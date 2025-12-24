export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-zinc-400">Overview of platform activity and moderation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl">
                    <div className="text-zinc-500 text-sm uppercase font-medium mb-1">Total Users</div>
                    <div className="text-3xl font-bold text-white">-</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl">
                    <div className="text-zinc-500 text-sm uppercase font-medium mb-1">Active Alerts</div>
                    <div className="text-3xl font-bold text-white">-</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl">
                    <div className="text-zinc-500 text-sm uppercase font-medium mb-1">Pending Reports</div>
                    <div className="text-3xl font-bold text-red-400">-</div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-medium text-white mb-2">Welcome, Admin</h3>
                <p className="text-zinc-400">Select a section from the sidebar to manage the platform.</p>
            </div>
        </div>
    );
}
