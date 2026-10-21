import "./globals.css";
import { Bricolage_Grotesque, IBM_Plex_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { SocketProvider } from "../lib/socket-provider";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "../context/NotificationContext";
import { DashboardProvider } from "../context/DashboardContext";
import { ThemeProvider, THEME_BOOT_SCRIPT } from "../context/ThemeContext";

import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const display = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-display-face", axes: ["opsz", "wdth"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mono-face" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e15" },
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
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <Script id="nn-theme" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
      </head>
      <body className="grain">
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
