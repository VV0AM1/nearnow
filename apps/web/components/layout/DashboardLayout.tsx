import Sidebar from "./dashboard/Sidebar";
import DashboardHeader from "./DashboardHeader";
import Footer from "./Footer";
import { User } from "../../types/user";

interface DashboardLayoutProps {
    children: React.ReactNode;
    initialUser?: User;
}

export default function DashboardLayout({ children, initialUser }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar initialUser={initialUser} />

            <main className="flex-1 flex flex-col min-w-0">
                <DashboardHeader />

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
                    {children}
                    <div className="mt-20">
                        <Footer />
                    </div>
                </div>
            </main>
        </div>
    );
}
