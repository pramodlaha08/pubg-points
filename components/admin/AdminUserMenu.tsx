"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, ShieldCheck, UserCog } from "lucide-react";
import { clearAdminSession } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { ROLE_LABELS } from "@/types/admin";

export default function AdminUserMenu() {
  const router = useRouter();
  const { role, username } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const roleLabel = role ? ROLE_LABELS[role] : "Admin";

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    router.replace("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-[var(--adm-border)] px-2.5 py-1.5 text-sm font-medium text-[var(--adm-fg)] hover:bg-[var(--adm-surface-2)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--adm-primary)] text-xs font-bold text-[var(--adm-primary-fg)]">
          {role === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : "A"}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-xs font-semibold">
            {username ?? roleLabel}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-[var(--adm-muted)]">
            {roleLabel}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-[var(--adm-muted)]" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface)] py-1 shadow-lg">
          <div className="border-b border-[var(--adm-border)] px-3 py-2">
            <p className="truncate text-sm font-semibold text-[var(--adm-fg)]">
              {username ?? "Signed in"}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-[var(--adm-muted)]">
              {roleLabel}
            </p>
          </div>
          {role === "admin" && (
            <Link
              href="/admin/admins"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--adm-fg)] hover:bg-[var(--adm-surface-2)]"
            >
              <ShieldCheck className="h-4 w-4" />
              Admins &amp; Roles
            </Link>
          )}
          <Link
            href="/admin/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--adm-fg)] hover:bg-[var(--adm-surface-2)]"
          >
            <UserCog className="h-4 w-4" />
            Account
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-[var(--adm-surface-2)]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
