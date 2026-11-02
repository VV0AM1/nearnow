// Public (browser) configuration. Set NEXT_PUBLIC_* at build time; see .env.example.
const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.NEXT_PUBLIC_API_URL) {
    // Fail loudly in the build/console instead of silently calling localhost from production.
    console.error("NEXT_PUBLIC_API_URL is not set: the web app cannot reach the API.");
}

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002").replace(/\/+$/, "");
export const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || API_URL).replace(/\/+$/, "");
/** Pilot city shown in marketing copy and offered first in the city picker. */
export const PILOT_CITY = process.env.NEXT_PUBLIC_PILOT_CITY || "";
