import {
  Crosshair,
  LayoutDashboard,
  ListOrdered,
  ListPlus,
  Network,
  Palette,
  Radio,
  ScanText,
  Settings2,
  Target,
  Trophy,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNav: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/admin/overview", icon: LayoutDashboard },
      { name: "Tournaments", path: "/admin/tournaments", icon: Trophy },
      { name: "Scoring", path: "/admin/scoring", icon: Target },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Live Control", path: "/admin/live", icon: Radio },
      { name: "Auto Scoring", path: "/admin/verify", icon: ScanText },
      { name: "Player Mapping", path: "/admin/mapping", icon: Network },
      { name: "Positions", path: "/admin/positions", icon: Crosshair },
      { name: "Round Manager", path: "/admin/rounds", icon: ListOrdered },
    ],
  },
  {
    title: "Teams",
    items: [
      { name: "Teams", path: "/admin/teams", icon: Users },
      { name: "Bulk Import", path: "/admin/teams/bulk", icon: ListPlus },
    ],
  },
  {
    title: "Presentation",
    items: [
      { name: "Table Design", path: "/admin/design", icon: Palette },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Branding", path: "/admin/system", icon: Settings2 },
      { name: "Account", path: "/admin/account", icon: UserCog },
    ],
  },
];

export function findNavItem(pathname: string): AdminNavItem | undefined {
  const items = adminNav.flatMap((group) => group.items);
  return (
    items.find((item) => item.path === pathname) ??
    items.find(
      (item) => item.path !== "/admin/overview" && pathname.startsWith(`${item.path}/`)
    )
  );
}
