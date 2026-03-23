"use client";
import SplitLeaderboard from "@/components/Leaderboard";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { GiChickenOven } from "react-icons/gi";

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

  const palette = {
    accent: "#80171C",
    panelFrom: "#0b1220",
    panelTo: "#111827",
    panelAlt: "#121a2b",
    border: "#80171cd0",
    borderSoft: "#80171c66",
    textPrimary: "#f8fafc",
    textDim: "#94a3b8",
    highlight: "#f59e0b",
    points: "#bae6fd",
    kills: "#fde68a",
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/team`,
        );
        const data = response.data;
        if (data.success) {
          const sortedTeams = data.data.sort((a: Team, b: Team) => {
            const aTotal = a.rounds.reduce(
              (acc, round) =>
                acc + (round.positionPoints || 0) + (round.killPoints || 0),
              0,
            );
            const bTotal = b.rounds.reduce(
              (acc, round) =>
                acc + (round.positionPoints || 0) + (round.killPoints || 0),
              0,
            );
            return bTotal - aTotal;
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

  const map = {
    1: "Erangel",
    2: "Miramar",
    3: "Sanhok",
    4: "Erangel",
    5: "Miramar",
    6: "Erangel",
  };

  return (
    <main className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <div
        className="relative min-h-[calc(100vh-5.75rem)] w-full overflow-hidden border"
        style={{
          borderColor: palette.border,
          background: `linear-gradient(135deg, ${palette.panelFrom} 0%, ${palette.panelTo} 50%, ${palette.panelAlt} 100%)`,
          boxShadow: `0 0 0 1px ${palette.borderSoft}, 0 18px 34px rgba(0,0,0,0.45)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1px, transparent 1px, transparent 7px)",
          }}
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 12% 4%, rgba(56,189,248,0.12) 0%, transparent 36%), radial-gradient(circle at 88% 0%, rgba(128,23,28,0.26) 0%, transparent 44%)",
          }}
        />

        <div className="relative z-10 px-6 py-5">
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-2.5"
            style={{
              borderColor: palette.border,
              background:
                "linear-gradient(90deg, rgba(10,15,27,0.92) 0%, rgba(17,24,39,0.88) 100%)",
              boxShadow: `0 0 0 1px ${palette.borderSoft}, 0 10px 28px rgba(0,0,0,0.45)`,
            }}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">
                PUBG Tournament Leaderboard
              </p>
              <h1 className="text-3xl font-black uppercase tracking-wide text-slate-50">
                Overall Rankings
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="rounded-xl border px-3 py-1 text-right"
                style={{
                  borderColor: palette.borderSoft,
                  backgroundColor: "#00000052",
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Current Match
                </p>
                <p className="text-xl font-black text-slate-100">
                  {firstTeam?.currentRound ?? "-"}/{Object.keys(map).length}
                </p>
              </div>

              <div
                className="rounded-xl border px-3 py-1 text-right"
                style={{
                  borderColor: palette.borderSoft,
                  backgroundColor: "#00000052",
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Current Map
                </p>
                <p className="text-xl font-black text-slate-100">
                  {(firstTeam &&
                    map[firstTeam.currentRound as keyof typeof map]) ||
                    "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-3">
              {firstTeam && totalStats ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="relative overflow-hidden rounded-2xl border"
                  style={{
                    borderColor: palette.border,
                    background: `linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(128,23,28,0.22) 45%, rgba(13,19,34,0.98) 100%)`,
                    boxShadow: `0 0 0 1px ${palette.borderSoft}, 0 14px 34px rgba(0,0,0,0.56)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at 20% 0%, rgba(245,158,11,0.16) 0%, transparent 42%), radial-gradient(circle at 80% 20%, rgba(56,189,248,0.15) 0%, transparent 36%)",
                    }}
                  />

                  <div className="relative z-10 flex flex-col p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                      Top Team
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="relative h-24 w-24 overflow-hidden rounded-xl border"
                        style={{
                          borderColor: "#f7c948",
                          backgroundColor: "#0f172acc",
                        }}
                      >
                        <Image
                          src={firstTeam.logo || "/placeholder.svg"}
                          alt={firstTeam.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-3xl font-black uppercase tracking-wide text-slate-50">
                            {firstTeam.name}
                          </h2>
                          {totalStats.chickenCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/45 bg-amber-300/10 px-2 py-1 text-sm font-black text-amber-200">
                              <GiChickenOven className="h-4.5 w-4.5" />
                              {`x${totalStats.chickenCount}`}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        { label: "Rank", value: "#1", color: "#f7c948" },
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
                          className="rounded-xl border px-3 py-2"
                          style={{
                            borderColor: palette.borderSoft,
                            backgroundColor: "#0000004d",
                          }}
                        >
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
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
                  className="flex min-h-[300px] items-center justify-center rounded-2xl border text-base font-bold uppercase tracking-[0.16em]"
                  style={{
                    borderColor: palette.borderSoft,
                    color: palette.textDim,
                  }}
                >
                  Loading team standings...
                </div>
              )}
            </div>

            <div className="xl:col-span-9">
              <div
                className="flex h-full flex-col rounded-2xl border p-4"
                style={{
                  borderColor: palette.border,
                  backgroundColor: "#0a101bcc",
                }}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-base font-black uppercase tracking-[0.2em] text-slate-300">
                    Broadcast Table
                  </p>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                    Teams {teams.length}
                  </p>
                </div>
                <div>
                  <SplitLeaderboard teams={teams} themeColor={palette.accent} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
