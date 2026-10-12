import Link from "next/link";
import { GiDeathSkull, GiPodium, GiTrophy } from "react-icons/gi";

const NAV = [
  { name: "Points Table", path: "/pointstable" },
  { name: "Leaderboard", path: "/leaderboard" },
  { name: "Matches", path: "/match" },
  { name: "Commentary", path: "/commentator" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <GiDeathSkull className="text-6xl text-red-500 animate-pulse" />
        <h1 className="text-4xl font-extrabold tracking-wide text-red-500">
          PUBG Mobile Campus League
        </h1>
        <p className="text-gray-400">Live tournament standings and broadcasts</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {NAV.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="rounded-xl border-2 border-red-500/30 bg-gray-800/40 px-6 py-4 text-center font-semibold text-gray-200 transition-all hover:border-red-500/60 hover:text-white"
          >
            {item.name}
          </Link>
        ))}
      </div>

      <Link
        href="/admin/overview"
        className="flex items-center gap-2 rounded-lg border-2 border-red-500/40 bg-red-600/20 px-6 py-3 font-semibold text-red-300 transition-all hover:bg-red-600/40 hover:text-white"
      >
        <GiTrophy className="text-xl" />
        Admin Panel
      </Link>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <GiPodium />
        Admin login required for match control
      </div>
    </div>
  );
}
