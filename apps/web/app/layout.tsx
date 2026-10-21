import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";
import { SocketProvider } from "../lib/socket-provider";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "../context/NotificationContext";
import { DashboardProvider } from "../context/DashboardContext";
import { ThemeProvider, THEME_BOOT_SCRIPT } from "../context/ThemeContext";

import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: { default: "NearNow", template: "%s · NearNow" },
  description: "Local updates and community help, right around you",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NearNow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <Script id="nn-theme" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
      </head>
      <body>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
