import AppShell from "../shell/AppShell";
import { User } from "../../types/user";

/** Kept for existing pages; the frame itself lives in components/shell/AppShell. */
export default function DashboardLayout({ children, initialUser, fullBleed }: { children: React.ReactNode; initialUser?: User; fullBleed?: boolean }) {
    return (
        <AppShell initialUser={initialUser} fullBleed={fullBleed}>
            {children}
        </AppShell>
    );
}
