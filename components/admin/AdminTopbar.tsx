"use client";

import { Menu } from "lucide-react";
import AdminBreadcrumbs from "./AdminBreadcrumbs";
import AdminUserMenu from "./AdminUserMenu";
import ThemeToggle from "./ThemeToggle";
import TournamentSwitcher from "./TournamentSwitcher";

export default function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--adm-border)] bg-[var(--adm-surface)] px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-[var(--adm-muted)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-fg)] lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AdminBreadcrumbs />

      <div className="ml-auto flex items-center gap-2">
        <TournamentSwitcher />
        <ThemeToggle />
        <AdminUserMenu />
      </div>
    </header>
  );
}
