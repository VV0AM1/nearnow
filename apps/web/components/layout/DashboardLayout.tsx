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

                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    <DashboardHeader />

                    {/* Page Content - No Scroll on Wrapper, Children handle scroll */}
                    <div className="flex-1 overflow-hidden relative">
                        {children}
                    </div>
                </main>
            </div>
        </DashboardProvider>
    );
}
