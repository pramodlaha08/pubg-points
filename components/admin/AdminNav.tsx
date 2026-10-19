"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNav, canAccessItem } from "@/config/adminNav";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

export default function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useAuth();

  return (
    <nav className="flex flex-col gap-6">
      {adminNav.map((group) => {
        const items = group.items.filter((item) => canAccessItem(item, role));
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </p>
            <div className="space-y-1">
              {items.map((item) => {
              const active =
                pathname === item.path ||
                (item.path !== "/admin/overview" &&
                  pathname.startsWith(`${item.path}/`));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--adm-sidebar-active)] text-white"
                      : "text-[var(--adm-sidebar-fg)] hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
