
import "./globals.css";
// import { ApolloWrapper } from "../lib/apollo-wrapper";
import { SocketProvider } from "../lib/socket-provider";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "../context/NotificationContext";
import { DashboardProvider } from "../context/DashboardContext";

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Nearnow",
  description: "Local updates and community help, right around you",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nearnow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <SocketProvider>
          <AuthProvider>
            <NotificationProvider>
              <DashboardProvider>
                {children}
                <Toaster />
              </DashboardProvider>
            </NotificationProvider>
          </AuthProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
