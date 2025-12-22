
import "./globals.css";
// import { ApolloWrapper } from "../lib/apollo-wrapper";
import { SocketProvider } from "../lib/socket-provider";
import { AuthProvider } from "../context/AuthContext";

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Nearnow",
  description: "Real-time neighborhood safety alerts",
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
            {children}
          </AuthProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
