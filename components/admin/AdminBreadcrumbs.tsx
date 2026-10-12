"use client";

import { usePathname } from "next/navigation";
import { findNavItem } from "@/config/adminNav";

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  const current = findNavItem(pathname);
  const label = current?.name ?? "Dashboard";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden text-[var(--adm-muted)] sm:inline">Admin</span>
      <span className="hidden text-[var(--adm-muted)] sm:inline">/</span>
      <span className="font-semibold text-[var(--adm-fg)]">{label}</span>
    </div>
  );
}
