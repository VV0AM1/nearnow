import { cookies } from "next/headers";
import DashboardLayout from "../components/layout/DashboardLayout";
import LandingPage from "../components/features/landing/LandingPage";
import { User } from "../types/user";
import { Post } from "../types/post";
import HomeContent from "../components/features/home/HomeContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3002';

async function getUser(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

async function getInitialPosts(token: string, lat?: number, long?: number): Promise<Post[]> {
  if (!lat || !long) return [];
  try {
    const query = new URLSearchParams({
      latitude: lat.toString(),
      longitude: long.toString(),
      radius: '10',
      category: 'ALL'
    });

    const res = await fetch(`${API_URL}/posts/feed?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nearnow_token')?.value;

  if (!token) {
    return <LandingPage />;
  }

  const user = await getUser(token);

  if (!user) {
    return <LandingPage />;
  }

  // Try to get saved location from cookie
  let initialLocation = { lat: 37.7749, long: -122.4194 }; // SF Default
  const savedLocationCookie = cookieStore.get('nearnow_location')?.value;

  if (savedLocationCookie) {
    try {
      const parsed = JSON.parse(savedLocationCookie);
      if (parsed.lat && parsed.long) {
        initialLocation = parsed;
      }
    } catch (e) {
      // Invalid cookie, ignore
    }
  }

  const initialPosts = await getInitialPosts(token, initialLocation.lat, initialLocation.long);

  return (
    <DashboardLayout initialUser={user}>
      <HomeContent initialUser={user} initialPosts={initialPosts} initialLocation={initialLocation} />
    </DashboardLayout>
  );
}
