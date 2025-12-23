import { Home, Map, ShieldAlert, Bookmark, User, Settings, Search } from "lucide-react";
import { NavItem } from "../../../types/ui";

export const MAIN_NAV_ITEMS: NavItem[] = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Map, label: "Live Map", href: "/map" },
    { icon: ShieldAlert, label: "Safety", href: "/safety" },
    { icon: Bookmark, label: "Saved", href: "/saved" },
];

export const USER_NAV_ITEMS: NavItem[] = [
    { icon: User, label: "Profile", href: "/profile" },
];

// Items specifically for mobile exploration that might differ or include actions
export const MOBILE_EXPLORE_ITEMS: NavItem[] = [
    { icon: Search, label: "Search Alerts", href: "#", onClick: "toggleSearch" }, // Special handling
];
