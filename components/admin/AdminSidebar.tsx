"use client";

import { GiDeathSkull } from "react-icons/gi";
import AdminNav from "./AdminNav";
import { clearAdminSession } from "@/lib/api";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { ROLE_LABELS } from "@/types/admin";

export default function AdminSidebar() {
  const router = useRouter();
  const { branding } = useBranding();
  const { role } = useAuth();

  const handleLogout = () => {
    clearAdminSession();
    router.replace("/login");
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[var(--adm-sidebar)] lg:flex">
      <div className="flex items-center gap-2 px-5 py-4">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt={branding.systemName}
            className="h-6 w-6 object-contain"
          />
        ) : (
          <GiDeathSkull className="text-2xl text-[var(--adm-primary)]" />
        )}
        <span className="text-lg font-extrabold tracking-wide text-white">
          {branding.systemName}
        </span>
        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
          {role ? ROLE_LABELS[role] : "Admin"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <AdminNav />
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
    </aside>
  );
}
