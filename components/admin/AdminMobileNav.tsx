"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GiDeathSkull } from "react-icons/gi";
import { LogOut, X } from "lucide-react";
import AdminNav from "./AdminNav";
import { clearAdminSession } from "@/lib/api";

export default function AdminMobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleLogout = () => {
    onClose();
    clearAdminSession();
    router.replace("/login");
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-[var(--adm-sidebar)] shadow-2xl">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <GiDeathSkull className="text-2xl text-[var(--adm-primary)]" />
            <span className="text-lg font-extrabold tracking-wide text-white">
              PMWC
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <AdminNav onNavigate={onClose} />
        </div>

        <div className="border-t border-white/10 p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--adm-sidebar-fg)] transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
