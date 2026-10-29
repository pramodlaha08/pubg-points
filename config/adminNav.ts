import {
  Crosshair,
  History,
  LayoutDashboard,
  ListOrdered,
  ListPlus,
  Network,
  Palette,
  Radio,
  ScanText,
  Settings2,
  ShieldCheck,
  Target,
  Trophy,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminRole } from "@/types/admin";

export interface AdminNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. Omit to show it to everyone signed in. */
  roles?: AdminRole[];
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

const SCORING_ROLES: AdminRole[] = ["admin", "scorer"];

export const adminNav: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/admin/overview", icon: LayoutDashboard },
      {
        name: "Tournaments",
        path: "/admin/tournaments",
        icon: Trophy,
        roles: ["admin"],
      },
      {
        name: "Scoring",
        path: "/admin/scoring",
        icon: Target,
        roles: ["admin"],
      },
    ],
  },
  {
    title: "Teams",
    items: [
      {
        name: "Teams",
        path: "/admin/teams",
        icon: Users,
        roles: ["admin"],
      },
      {
        name: "Bulk Import",
        path: "/admin/teams/bulk",
        icon: ListPlus,
        roles: ["admin"],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        name: "Round Manager",
        path: "/admin/rounds",
        icon: ListOrdered,
        roles: SCORING_ROLES,
      },
      {
        name: "Players Register",
        path: "/admin/register",
        icon: UserPlus,
        roles: SCORING_ROLES,
      },
      {
        name: "Player Mapping",
        path: "/admin/mapping",
        icon: Network,
        roles: SCORING_ROLES,
      },
      {
        name: "Live Control",
        path: "/admin/live",
        icon: Radio,
        roles: SCORING_ROLES,
      },
      {
        name: "Positions",
        path: "/admin/positions",
        icon: Crosshair,
        roles: SCORING_ROLES,
      },
      {
        name: "Auto Scoring",
        path: "/admin/verify",
        icon: ScanText,
        roles: SCORING_ROLES,
      },
      {
        name: "Activity Log",
        path: "/admin/activity",
        icon: History,
        roles: SCORING_ROLES,
      },
    ],
  },
  {
    title: "Presentation",
    items: [
      {
        name: "Table Design",
        path: "/admin/design",
        icon: Palette,
        roles: ["admin"],
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        name: "Branding",
        path: "/admin/system",
        icon: Settings2,
        roles: ["admin"],
      },
      {
        name: "Admins & Roles",
        path: "/admin/admins",
        icon: ShieldCheck,
        roles: ["admin"],
      },
      { name: "Account", path: "/admin/account", icon: UserCog },
    ],
  },
];

export function canAccessItem(
  item: AdminNavItem,
  role: AdminRole | null
): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  return Boolean(role && item.roles.includes(role));
}

export function findNavItem(pathname: string): AdminNavItem | undefined {
  const items = adminNav.flatMap((group) => group.items);
  return (
    items.find((item) => item.path === pathname) ??
    items.find(
      (item) => item.path !== "/admin/overview" && pathname.startsWith(`${item.path}/`)
    )
  );
}
