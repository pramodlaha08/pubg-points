"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api, getApiTournamentId } from "@/lib/api";
import { useBranding } from "@/components/providers/BrandingProvider";
import { useRoundInfo } from "@/hooks/useRoundInfo";
import {
  GiChickenOven,
  GiCrossedSabres,
  GiDeathSkull,
  GiPodium,
  GiRadioTower,
  GiTrophy,
} from "react-icons/gi";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { GAMING_FX_CSS, Shine } from "@/components/GamingFx";

interface Team {
  _id: string;
  name: string;
  logo: string;
  slot: number;
  currentRound: number;
  totalPoints: number;
  rounds: {
    positionPoints: number;
    killPoints: number;
  }[];
}

const NAV = [
  {
    name: "Points Table",
    path: "/pointstable",
    Icon: GiPodium,
    desc: "Live team standings",
  },
  {
    name: "Leaderboard",
    path: "/leaderboard",
    Icon: GiTrophy,
    desc: "Overall rankings",
  },
  {
    name: "Matches",
    path: "/match",
    Icon: GiCrossedSabres,
    desc: "Round-by-round results",
  },
  {
    name: "Commentary",
    path: "/commentator",
    Icon: GiRadioTower,
    desc: "Real-time event feed",
  },
];

const podiumStyles = [
  {
    ring: "border-amber-400/70",
    glow: "shadow-[0_0_30px_-6px_rgba(245,158,11,0.55)]",
    badge: "from-amber-300 to-amber-600 text-amber-950",
    label: "Champion",
  },
  {
    ring: "border-slate-300/70",
    glow: "shadow-[0_0_26px_-8px_rgba(203,213,225,0.45)]",
    badge: "from-slate-200 to-slate-400 text-slate-900",
    label: "Runner-up",
  },
  {
    ring: "border-orange-400/60",
    glow: "shadow-[0_0_26px_-8px_rgba(194,123,67,0.45)]",
    badge: "from-orange-300 to-orange-700 text-orange-950",
    label: "Third place",
  },
];

const totalOf = (team: Team) =>
  typeof team.totalPoints === "number"
    ? team.totalPoints
    : (team.rounds ?? []).reduce(
        (sum, round) =>
          sum + (round.positionPoints || 0) + (round.killPoints || 0),
        0
      );

export default function HomePage() {
  const { branding } = useBranding();
  const { mapByRound } = useRoundInfo();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState("");

  useEffect(() => {
    let active = true;
    const fetchTeams = async () => {
      try {
        const response = await api.get("/team");
        if (!active) return;
        const data: Team[] = response.data?.data ?? [];
        setTeams([...data].sort((a, b) => totalOf(b) - totalOf(a)));
      } catch {
        if (active) setTeams([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    const fetchTournament = async () => {
      try {
        const response = await api.get("/tournaments");
        if (!active) return;
        const list = response.data?.data ?? [];
        const selected = getApiTournamentId();
        const current =
          list.find((item: { _id: string }) => String(item._id) === selected) ||
          list.find((item: { isDefault?: boolean }) => item.isDefault) ||
          list.find((item: { status?: string }) => item.status === "active") ||
          list[0];
        setTournamentName(current?.name ?? "");
      } catch {
        // Keep the generic headline if the request fails.
      }
    };
    fetchTeams();
    fetchTournament();
    return () => {
      active = false;
    };
  }, []);

  const leader = teams[0] ?? null;
  const currentRound = leader?.currentRound;
  const currentMap = currentRound ? mapByRound[currentRound] : undefined;
  const podium = teams.slice(0, 3);

  const stats = useMemo(
    () => [
      {
        label: "Teams",
        value: loading ? "—" : String(teams.length),
        Icon: Users,
        color: "text-sky-300",
      },
      {
        label: "Current Round",
        value: currentRound ? String(currentRound) : "—",
        Icon: GiCrossedSabres,
        color: "text-red-300",
      },
      {
        label: "Map",
        value: currentMap || "TBD",
        Icon: MapPin,
        color: "text-emerald-300",
      },
      {
        label: "Leader",
        value: leader ? leader.name.toUpperCase() : "—",
        Icon: GiTrophy,
        color: "text-amber-300",
      },
    ],
    [loading, teams.length, currentRound, currentMap, leader]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <style>{GAMING_FX_CSS}</style>
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.35) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          animation: "fxGrid 9s linear infinite",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-red-600/20 blur-[120px]"
        style={{ animation: "fxPulse 6s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-24 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-[120px]"
        style={{ animation: "fxPulse 9s ease-in-out infinite" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-14">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-red-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Live Tournament Hub
          </span>

          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt={branding.systemName || "Logo"}
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                unoptimized
              />
            ) : (
              <GiDeathSkull className="text-5xl text-red-500" />
            )}
            <span className="text-2xl font-black uppercase tracking-[0.18em] text-gray-300">
              {branding.systemName || "PMWC"}
            </span>
          </div>

          <h1
            className="mt-6 text-4xl font-black uppercase leading-tight tracking-tight text-transparent sm:text-6xl"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #f8fafc 0%, #f87171 40%, #fbbf24 55%, #f8fafc 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              animation: "fxPan 6s linear infinite",
            }}
          >
            {tournamentName || "Live Tournament Standings"}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
            Live standings, points table and broadcast overlays — everything for
            the tournament in one place.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/leaderboard"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-red-900/30 transition-all hover:from-red-500 hover:to-red-600"
            >
              <Shine duration={3.2} />
              View Leaderboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/admin/overview"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/60 px-6 py-3 text-sm font-bold uppercase tracking-wide text-slate-200 transition-all hover:border-slate-400/60 hover:text-white"
            >
              <GiTrophy className="text-lg" />
              Admin Panel
            </Link>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 * index }}
              className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/70 p-4 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {stat.label}
                </span>
                <stat.Icon className={`text-xl ${stat.color}`} />
              </div>
              <p className="mt-3 truncate text-xl font-black text-white sm:text-2xl">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </section>

        {/* Podium */}
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-white">
                Top Teams
              </h2>
              <p className="text-sm text-slate-500">
                Current overall standings
              </p>
            </div>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1 text-sm font-semibold text-red-400 transition-colors hover:text-red-300"
            >
              Full standings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="h-40 animate-pulse rounded-2xl border border-slate-700/50 bg-slate-900/60"
                />
              ))}
            </div>
          ) : podium.length === 0 ? (
            <div className="flex min-h-[9rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 text-center">
              <GiPodium className="text-3xl text-slate-600" />
              <p className="mt-2 text-sm font-semibold text-slate-400">
                Standings will appear once teams are registered.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {podium.map((team, index) => {
                const style = podiumStyles[index];
                return (
                  <motion.div
                    key={team._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    className={`relative overflow-hidden rounded-2xl border bg-slate-900/70 p-5 backdrop-blur ${style.ring} ${style.glow}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-black ${style.badge}`}
                      >
                        {index + 1}
                      </span>
                      {index === 0 ? (
                        <GiChickenOven className="text-2xl text-amber-400" />
                      ) : (
                        <GiTrophy className="text-xl text-slate-500" />
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800 p-1.5">
                        <Image
                          src={team.logo || "/placeholder.svg"}
                          alt={team.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black uppercase tracking-wide text-white">
                          {team.name}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Slot #{team.slot}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between border-t border-slate-700/50 pt-3">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        {style.label}
                      </span>
                      <span className="text-2xl font-black text-white">
                        {totalOf(team)}
                        <span className="ml-1 text-xs font-bold text-slate-500">
                          PTS
                        </span>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick links */}
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-black uppercase tracking-wide text-white">
            Broadcast &amp; Standings
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NAV.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 transition-all hover:-translate-y-0.5 hover:border-red-500/50 hover:bg-slate-900"
              >
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 opacity-70"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, transparent, #ef4444, #f59e0b, transparent)",
                    backgroundSize: "200% 100%",
                    animation: "fxPan 4s linear infinite",
                  }}
                />
                <item.Icon className="text-3xl text-red-400" />
                <p className="mt-4 font-bold text-white">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-red-400" />
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-14 flex flex-col items-center gap-2 border-t border-slate-800 pt-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {branding.systemName || "PMWC"} · Tournament Control System
          </p>
          <p className="text-xs text-slate-600">
            Admin login required for match control
          </p>
        </footer>
      </div>
    </div>
  );
}
