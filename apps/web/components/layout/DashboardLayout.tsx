import Sidebar from "./dashboard/Sidebar";
import DashboardHeader from "./DashboardHeader";
import { User } from "../../types/user";
import { DashboardProvider } from "../../context/DashboardContext";

interface DashboardLayoutProps {
    children: React.ReactNode;
    initialUser?: User;
}

export default function DashboardLayout({ children, initialUser }: DashboardLayoutProps) {
    return (
        <DashboardProvider>
            <div className="flex h-screen bg-background overflow-hidden relative">
                <Sidebar initialUser={initialUser} />

                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                    {/* Floating Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
                        <DashboardHeader />
                    </div>

                    {/* Page Content - Full Height, Underlays Header */}
                    <div className="flex-1 h-full overflow-hidden relative">
                        {children}
                    </div>
                </main>
            </div>
        </DashboardProvider>
    );
}
