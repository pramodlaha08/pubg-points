"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminMobileNav from "./AdminMobileNav";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-theme min-h-screen bg-[var(--adm-bg)] text-[var(--adm-fg)]">
      <div className="flex">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminTopbar onMenu={() => setMobileOpen(true)} />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
      <AdminMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
