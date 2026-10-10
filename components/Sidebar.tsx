"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GiDeathSkull, GiPowerLightning } from "react-icons/gi";
import { clearAdminSession, isAdminLoggedIn } from "@/lib/api";

interface SidebarLink {
  name: string;
  path: string;
}

interface SidebarGroup {
  readonly title: string;
  readonly icon: string;
  readonly links: SidebarLink[];
}

export default function Sidebar({ links }: { readonly links: SidebarGroup[] }) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAdminLoggedIn());
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    setLoggedIn(false);
    router.replace("/login");
  };

  return (
    <div
      data-app-sidebar="true"
      className="bg-gray-900 rounded-xl p-6 shadow-2xl border-2 border-red-500/30 h-fit sticky top-8 w-full md:w-auto"
    >
      <nav className="space-y-4">
        <div className="hidden md:flex justify-center space-x-8">
          {links.map((group) => (
            <div key={group.title} className="text-center">
              <div className="flex items-center justify-center gap-2 text-red-400">
                <GiDeathSkull className="text-2xl animate-pulse" />
                <h3 className="font-semibold text-lg">{group.title}</h3>
              </div>
              <div className="mt-2 space-y-2">
                {group.links.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="block py-3 px-5 text-gray-300 hover:text-white hover:bg-red-600/20 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-red-500/40 shadow-md hover:shadow-red-500/30"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="md:hidden space-y-8">
          {links.map((group) => (
            <div key={group.title} className="space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <GiDeathSkull className="text-2xl animate-pulse" />
                <h3 className="font-semibold text-lg">{group.title}</h3>
              </div>
              <div className="space-y-2">
                {group.links.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="block py-3 px-5 text-gray-300 hover:text-white hover:bg-red-600/20 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-red-500/40 shadow-md hover:shadow-red-500/30"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t-2 border-red-500/20 flex justify-center">
          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 px-6 font-semibold text-red-300 hover:text-white bg-red-600/20 hover:bg-red-600/40 rounded-lg transition-all duration-200 border-2 border-red-500/40"
            >
              <GiPowerLightning className="text-xl" />
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 py-2 px-6 font-semibold text-red-300 hover:text-white bg-red-600/20 hover:bg-red-600/40 rounded-lg transition-all duration-200 border-2 border-red-500/40"
            >
              <GiPowerLightning className="text-xl" />
              Admin Login
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
