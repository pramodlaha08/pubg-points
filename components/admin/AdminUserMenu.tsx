"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { clearAdminSession } from "@/lib/api";

export default function AdminUserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
          A
        </span>
        <span className="hidden sm:inline">Admin</span>
        <ChevronDown className="h-4 w-4 text-[var(--adm-muted)]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface)] py-1 shadow-lg">
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
