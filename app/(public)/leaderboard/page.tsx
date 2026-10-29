"use client";
import SplitLeaderboard from "@/components/Leaderboard";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { GiChickenOven } from "react-icons/gi";
import { useSettings } from "@/hooks/useSettings";
import { useRoundInfo } from "@/hooks/useRoundInfo";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  DEFAULT_POINTS_TABLE,
  mergePointsTable,
} from "@/lib/tableSettings";

interface Team {
  _id: string;
  name: string;
  logo: string;
  slot: number;
  currentRound: number;
  totalPoints: number;
  rounds: {
    roundNumber: number;
    kills: number;
    killPoints: number;
    position: number;
    positionPoints: number;
    eliminationCount: number;
    eliminatedPlayers: number[];
    status: string;
  }[];
}

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const { settings: remoteSettings } = useSettings();
  const { mapByRound } = useRoundInfo();
  const { branding } = useBranding();

  const settings = useMemo(
    () => mergePointsTable(remoteSettings?.pointsTable ?? DEFAULT_POINTS_TABLE),
    [remoteSettings]
  );

  const palette = useMemo(() => {
    const c = settings.colors;
    return {
      accent: c.accent,
      panelFrom: c.panelFrom,
      panelTo: c.panelTo,
      panelAlt: c.borderSoft,
      border: c.border,
      borderSoft: c.borderSoft,
      textPrimary: c.textPrimary,
      textDim: c.elimColor,
      highlight: c.totalColor,
      points: c.placeColor,
      kills: c.elimColor,
    };
  }, [settings]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await api.get("/team");
        const data = response.data;
        if (data.success) {
          const roundsOf = (team: Team) => team.rounds ?? [];
          const totalsOf = (team: Team) => {
            let placePoints = 0;
            let killPoints = 0;
            for (const round of roundsOf(team)) {
              placePoints += round.positionPoints || 0;
              killPoints += round.killPoints || 0;
            }
            return { total: placePoints + killPoints, placePoints, killPoints };
          };
          const bestPlaceOf = (team: Team) => {
            const positions = roundsOf(team)
              .map((round) => round.position)
              .filter((position) => position > 0 && position < 9999);
            return positions.length ? Math.min(...positions) : 9999;
          };
          const sortedTeams = data.data.sort((a: Team, b: Team) => {
            const aStats = totalsOf(a);
            const bStats = totalsOf(b);
            if (bStats.total !== aStats.total) return bStats.total - aStats.total;
            if (bStats.placePoints !== aStats.placePoints)
              return bStats.placePoints - aStats.placePoints;
            if (bStats.killPoints !== aStats.killPoints)
              return bStats.killPoints - aStats.killPoints;
            const aBest = bestPlaceOf(a);
            const bBest = bestPlaceOf(b);
            if (aBest !== bBest) return aBest - bBest;
            return (a.slot ?? 0) - (b.slot ?? 0);
          });
          setTeams(sortedTeams);
        }
      } catch {
        console.error("Error fetching teams:");
      }
    };

    fetchTeams();
    const interval = setInterval(fetchTeams, 100000);
    return () => clearInterval(interval);
  }, []);

  const firstTeam = teams.length > 0 ? teams[0] : null;
  const totalStats = firstTeam
    ? firstTeam.rounds.reduce(
        (acc, round) => ({
          placePoints: acc.placePoints + (round.positionPoints || 0),
          killPoints: acc.killPoints + (round.killPoints || 0),
          chickenCount: acc.chickenCount + (round.position === 1 ? 1 : 0),
        }),
        { placePoints: 0, killPoints: 0, chickenCount: 0 },
      )
    : null;

  const totalRounds = Math.max(
    Object.keys(mapByRound).length,
    firstTeam?.currentRound ?? 0
  );
  const currentMap = firstTeam ? mapByRound[firstTeam.currentRound] : undefined;

  return (
    <main className="broadcast-page fixed inset-0 z-[60] h-screen w-screen overflow-hidden">
      <div
        className="relative h-full w-full overflow-hidden border"
        style={{
          borderColor: palette.borderSoft,
          background: `linear-gradient(135deg, ${palette.panelFrom} 0%, ${palette.panelTo} 50%, ${palette.panelAlt} 100%)`,
          boxShadow: `inset 0 0 0 1px ${palette.borderSoft}`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 7px)",
          }}
        />

        {/* Central container to reduce table width for a tighter, more attractive look */}
        <div className="relative z-10 flex h-full flex-col gap-3 px-6 py-4 mx-auto max-w-[1300px]">
          <div
            className="flex items-center justify-between gap-3 rounded-xl border px-5 py-3 shadow-sm"
            style={{
              borderColor: palette.border,
              background: palette.panelFrom,
            }}
          >
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.22em]"
                style={{ color: palette.textDim }}
              >
                {branding.systemName || "Tournament"}
              </p>
              {settings.leaderboard.showTitle ? (
                <h1
                  className="text-3xl font-black uppercase tracking-wide"
                  style={{ color: palette.textPrimary }}
                >
                  {settings.leaderboard.title || "Overall Rankings"}
                </h1>
              ) : null}
              {settings.leaderboard.subtitle ? (
                <p
                  className="text-sm font-semibold uppercase tracking-[0.2em]"
                  style={{ color: palette.textDim }}
                >
                  {settings.leaderboard.subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <div
                className="rounded-xl border px-3 py-1 text-right"
                style={{
                  borderColor: palette.borderSoft,
                  background: palette.panelTo,
                }}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: palette.accent }}
                >
                  Current Match
                </p>
                <p
                  className="text-xl font-black"
                  style={{ color: palette.textPrimary }}
                >
                  {firstTeam?.currentRound ?? "-"}/{totalRounds}
                </p>
              </div>

              <div
                className="rounded-xl border px-3 py-1 text-right"
                style={{
                  borderColor: palette.borderSoft,
                  background: palette.panelTo,
                }}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: palette.accent }}
                >
                  Current Map
                </p>
                <p
                  className="text-xl font-black"
                  style={{ color: palette.textPrimary }}
                >
                  {currentMap || "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {firstTeam && totalStats ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative overflow-visible rounded-2xl border shadow-sm"
              style={{
                borderColor: palette.border,
                background: palette.panelFrom,
              }}
            >
              {/* Animated Character Background/Overlay */}
              <div className="absolute right-0 top-[100%] -translate-y-1/2 translate-x-12 z-0 pr-8 opacity-90 mix-blend-multiply pointer-events-none">
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* Replace source with actual character once uploaded to public/ */}
                  <Image
                    src="/pubg-character.png"
                    alt="Tournament character"
                    width={350}
                    height={350}
                    className="object-contain drop-shadow-2xl grayscale-[20%]"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </motion.div>
              </div>

              <div
                className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden"
                style={{
                  background:
                    "radial-gradient(circle at 20% 0%, rgba(245,158,11,0.06) 0%, transparent 42%), radial-gradient(circle at 80% 20%, rgba(56,189,248,0.06) 0%, transparent 36%)",
                }}
              />

              <div className="relative z-10 flex items-center justify-between gap-6 p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className="relative h-24 w-24 overflow-hidden rounded-xl border"
                    style={{
                      borderColor: palette.points,
                      background: palette.panelTo,
                    }}
                  >
                    <Image
                      src={firstTeam.logo || "/placeholder.svg"}
                      alt={firstTeam.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="text-xs font-black uppercase tracking-[0.2em]"
                      style={{ color: palette.accent }}
                    >
                      Top Team
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <h2
                        className="truncate text-4xl font-black uppercase tracking-wide"
                        style={{ color: palette.textPrimary }}
                      >
                        {firstTeam.name.toUpperCase()}
                      </h2>
                      {totalStats.chickenCount > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm font-black text-white shadow-sm"
                          style={{
                            background: palette.kills,
                            borderColor: palette.kills,
                          }}
                        >
                          <GiChickenOven className="h-4.5 w-4.5" />
                          {`x${totalStats.chickenCount}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div
                  className="grid grid-cols-4 gap-3 relative z-10 backdrop-blur-md rounded-xl p-1 border"
                  style={{
                    background: palette.panelTo,
                    borderColor: palette.borderSoft,
                  }}
                >
                  {[
                    { label: "Rank", value: "#1", color: palette.highlight },
                    {
                      label: "Place Points",
                      value: totalStats.placePoints,
                      color: palette.points,
                    },
                    {
                      label: "Elims Points",
                      value: totalStats.killPoints,
                      color: palette.kills,
                    },
                    {
                      label: "Total Points",
                      value: totalStats.placePoints + totalStats.killPoints,
                      color: palette.highlight,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border px-3 py-2 shadow-sm"
                      style={{
                        borderColor: palette.borderSoft,
                        background: palette.panelFrom,
                      }}
                    >
                      <p
                        className="text-[11px] font-bold uppercase tracking-[0.16em]"
                        style={{ color: palette.accent }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="mt-1 text-2xl font-black"
                        style={{ color: item.color }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div
              className="flex min-h-[170px] items-center justify-center rounded-2xl border text-base font-bold uppercase tracking-[0.16em]"
              style={{
                borderColor: palette.borderSoft,
                color: palette.textDim,
                background: palette.panelFrom,
              }}
            >
              Loading team standings...
            </div>
          )}

          <div
            className="flex flex-col rounded-2xl border p-4 shadow-inner"
            style={{
              borderColor: palette.border,
              background: palette.panelFrom,
            }}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <p
                className="text-sm font-bold uppercase tracking-[0.16em]"
                style={{ color: palette.accent }}
              >
                Teams {teams.length}
              </p>
            </div>
            <div className="w-full">
              <SplitLeaderboard teams={teams} settings={settings} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
