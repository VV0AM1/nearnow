import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-black text-white overflow-hidden flex-col md:flex-row">
            {/* Responsive Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-black p-4 md:p-8 relative w-full">
                <div className="max-w-6xl mx-auto pb-20 md:pb-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
