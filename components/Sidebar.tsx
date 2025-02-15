import Link from "next/link";
import { GiDeathSkull } from "react-icons/gi";

interface SidebarLink {
  name: string;
  path: string;
}

interface SidebarGroup {
  title: string;
  icon: string;
  links: SidebarLink[];
}

export default function Sidebar({ links }: { links: SidebarGroup[] }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-2xl border-2 border-red-500/30 h-fit sticky top-8 w-full md:w-auto">
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
      </nav>
    </div>
  );
}
