"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import SQUAD_CONFIG from "@/lib/squadConfig";

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

const trophyVariants = {
  initial: { rotate: 0, scale: 1, textShadow: "0 0 0px rgba(255, 165, 0, 0)" },
  animate: {
    rotate: [-5, 5, -5],
    scale: [1, 1.2, 1],
    textShadow: [
      "0 0 0px rgba(255, 165, 0, 0)",
      "0 0 10px rgba(255, 165, 0, 0.8)",
      "0 0 20px rgba(255, 230, 0, 0.9)",
      "0 0 10px rgba(255, 165, 0, 0.8)",
      "0 0 0px rgba(255, 165, 0, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

const topRankStyles = {
  0: {
    badgeBg: "linear-gradient(145deg, #f9d77b 0%, #d4a72c 100%)",
    badgeText: "#1f1300",
    badgeBorder: "#f8e5a6",
    edge: "#f7c948",
    glow: "0 0 14px rgba(247,201,72,0.38)",
  },
  1: {
    badgeBg: "linear-gradient(145deg, #e2e8f0 0%, #94a3b8 100%)",
    badgeText: "#0f172a",
    badgeBorder: "#e2e8f0",
    edge: "#cbd5e1",
    glow: "0 0 12px rgba(203,213,225,0.3)",
  },
  2: {
    badgeBg: "linear-gradient(145deg, #d8b18a 0%, #9a5b2c 100%)",
    badgeText: "#120b06",
    badgeBorder: "#e4c09f",
    edge: "#c27b43",
    glow: "0 0 12px rgba(194,123,67,0.28)",
  },
} as const;

interface AnimatedTeamTableProps {
  readonly showDebug?: boolean;
  readonly themeColor?: string;
}

export default function AnimatedTeamTable({
  showDebug,
  themeColor,
}: AnimatedTeamTableProps) {
  // Use env var for debug mode, allow prop override
  const debugMode =
    showDebug !== undefined
      ? showDebug
      : process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

  const useTheme = Boolean(themeColor);
  const palette = {
    accent: useTheme ? themeColor! : "#80171C",
    panelFrom: "#0b1220",
    panelTo: "#111827",
    panelEdge: "#1f2937",
    headerFrom: "#141c2e",
    headerTo: useTheme ? `${themeColor}C8` : "#8b1d24c8",
    headerTextDim: "#94a3b8",
    rowFrom: "#0f172aeb",
    rowTo: useTheme ? `${themeColor}80` : "#80171c80",
    rowEliminatedFrom: useTheme ? `${themeColor}2E` : "#8b1d242e",
    rowEliminatedTo: "#1c0b1026",
    border: useTheme ? `${themeColor}D0` : "#80171cd0",
    borderSoft: useTheme ? `${themeColor}66` : "#80171c66",
    aliveBar: "#38bdf8",
    deadBar: "#ef4444",
    liveChip: "#f59e0b",
    hudGlow: "rgba(56,189,248,0.32)",
    textPrimary: "#f8fafc",
    textDim: "#cbd5e1",
    statBg: "#0000004d",
  };

  const [teams, setTeams] = useState<Team[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>("-");
  const [lastSyncAt, setLastSyncAt] = useState<string>("-");
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/team`,
        );
        const data = response.data;

        if (data.success) {
          setTeams(
            data.data.sort((a: Team, b: Team) => b.totalPoints - a.totalPoints),
          );
          setLastSyncAt(new Date().toLocaleTimeString());
        }
      } catch {
        console.error("Error fetching teams:");
      }
    };

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const socketBase =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      apiBase.replace(/\/api\/v1\/?$/, "");

    let refreshTimer: NodeJS.Timeout | null = null;
    const scheduleRefresh = (source: string) => {
      setLastEvent(source);
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => {
        void fetchTeams();
        setUpdateCount((prev) => prev + 1);
        refreshTimer = null;
      }, 120);
    };

    const socket: Socket = io(socketBase, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      scheduleRefresh("connect");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("team_log_created", () => scheduleRefresh("team_log_created"));
    socket.on("team_created", () => scheduleRefresh("team_created"));
    socket.on("team_deleted", () => scheduleRefresh("team_deleted"));
    socket.on("round_created", () => scheduleRefresh("round_created"));
    socket.on("round_deleted", () => scheduleRefresh("round_deleted"));
    socket.on("positions_updated", () => scheduleRefresh("positions_updated"));
    socket.on("elimination_state_changed", () =>
      scheduleRefresh("elimination_state_changed"),
    );

    fetchTeams();

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div className="w-[300px] mx-auto">
        {debugMode ? (
          <div className="mb-2 rounded border border-white/30 bg-black/60 px-2 py-1 text-[9px] font-semibold text-white">
            <div>SOCKET: {isConnected ? "LIVE" : "OFFLINE"}</div>
            <div>LAST EVENT: {lastEvent}</div>
            <div>LAST SYNC: {lastSyncAt}</div>
            <div>UPDATES: {updateCount}</div>
          </div>
        ) : null}

        <div
          className="relative flex flex-col overflow-hidden rounded-xl border shadow-2xl"
          style={{
            borderColor: palette.border,
            background: `linear-gradient(140deg, ${palette.panelFrom} 0%, ${palette.panelTo} 100%)`,
            boxShadow: `0 0 0 1px ${palette.borderSoft}, 0 16px 36px rgba(0,0,0,0.55)`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "repeating-linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.07) 1px, transparent 1px, transparent 6px)",
            }}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 15% 0%, rgba(34,211,238,0.12) 0%, transparent 36%), radial-gradient(circle at 90% 0%, rgba(248,113,113,0.16) 0%, transparent 42%)",
            }}
          />

          <div
            className="relative flex items-center justify-between border-b px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              borderColor: palette.borderSoft,
              color: palette.headerTextDim,
              background: `linear-gradient(90deg, rgba(10,15,27,0.95) 0%, rgba(15,23,42,0.86) 100%)`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-100">Broadcast Points</span>
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: palette.liveChip,
                  boxShadow: `0 0 8px ${palette.liveChip}`,
                }}
              />
              <span>Live</span>
            </div>
            <div className="text-slate-300">Teams {teams.length}</div>
          </div>

          <div
            className="relative flex h-9 text-xs font-bold shadow-lg"
            style={{
              color: palette.textPrimary,
              background: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
              borderBottom: `1px solid ${palette.border}`,
            }}
          >
            <div className="w-9 flex items-center justify-center pl-2 tracking-wide">
              RANK
            </div>
            <div className="flex-1 flex items-center justify-start pl-3 tracking-wide">
              TEAM
            </div>
            <div className="w-14 flex items-center justify-center tracking-wide">
              ALIVE
            </div>
            <div className="w-11 flex items-center justify-center tracking-wide">
              PTS
            </div>
            <div className="w-11 flex items-center justify-center pr-1 tracking-wide">
              ELIMS
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence>
              {teams.map((team, index) => {
                const currentRound = team.rounds.find(
                  (r) => r.roundNumber === team.currentRound,
                );
                const topRankStyle = topRankStyles[index as 0 | 1 | 2];
                const isEliminated =
                  (currentRound?.eliminationCount ?? 0) >=
                  SQUAD_CONFIG.fullEliminationCount;

                return (
                  <motion.div
                    key={team._id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{
                      type: "spring",
                      stiffness: 105,
                      damping: 15,
                      delay: Math.min(index * 0.015, 0.12),
                    }}
                    className={`relative flex h-9 text-xs shadow-md ${
                      isEliminated ? "text-gray-300" : "text-white"
                    }`}
                    style={{
                      borderBottom: `1px solid ${palette.borderSoft}`,
                      background: isEliminated
                        ? `linear-gradient(90deg, ${palette.rowEliminatedFrom} 0%, ${palette.rowEliminatedTo} 100%)`
                        : `linear-gradient(90deg, ${palette.rowFrom} 0%, ${palette.rowTo} 100%)`,
                      filter: isEliminated
                        ? "grayscale(0.62) saturate(0.35) brightness(0.8)"
                        : "saturate(1.08)",
                      opacity: isEliminated ? 0.64 : 1,
                      boxShadow: topRankStyle
                        ? `${topRankStyle.glow}, inset 0 0 0 1px rgba(255,255,255,0.06)`
                        : undefined,
                    }}
                  >
                    <div className="w-9 relative flex items-center justify-center font-bold text-base">
                      {topRankStyle ? (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-black"
                          style={{
                            color: topRankStyle.badgeText,
                            background: topRankStyle.badgeBg,
                            border: `1px solid ${topRankStyle.badgeBorder}`,
                            boxShadow: topRankStyle.glow,
                          }}
                          aria-label={`Rank ${index + 1}`}
                        >
                          {index + 1}
                        </span>
                      ) : (
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-black"
                          style={{
                            color: palette.textPrimary,
                            backgroundColor: palette.statBg,
                            border: `1px solid ${palette.borderSoft}`,
                          }}
                        >
                          {index + 1}
                        </span>
                      )}
                      {index === 0 && !isEliminated ? (
                        <motion.span
                          className="pointer-events-none absolute -top-1 -right-1 z-10 text-[9px]"
                          variants={trophyVariants}
                          initial="initial"
                          animate="animate"
                        >
                          🏆
                        </motion.span>
                      ) : null}
                    </div>

                    <div className="flex-1 flex min-w-0 items-center space-x-2 pl-2">
                      <Image
                        src={team.logo || "/placeholder.svg"}
                        alt={team.name}
                        width={20}
                        height={20}
                        className="object-contain rounded-sm"
                      />
                      <span
                        className={`truncate font-extrabold tracking-[0.02em] ${
                          isEliminated
                            ? "text-gray-300/80 line-through decoration-gray-300/60 decoration-[1.5px]"
                            : "text-gray-100"
                        }`}
                      >
                        {team.name.toUpperCase()}
                      </span>
                      <span className="ml-1 inline-flex h-2 w-2 items-center justify-center">
                        {isEliminated ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-300/55" />
                        ) : (
                          <motion.span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: palette.aliveBar }}
                            animate={{
                              scale: [1, 1.6, 1],
                              opacity: [0.7, 1, 0.7],
                              boxShadow: [
                                `0 0 0 0 ${palette.hudGlow}`,
                                `0 0 10px 3px ${palette.hudGlow}`,
                                `0 0 0 0 ${palette.hudGlow}`,
                              ],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                      </span>
                    </div>

                    <div className="w-14 flex items-center justify-center">
                      <div
                        className="flex gap-1 rounded-md px-1 py-[2px]"
                        style={{ backgroundColor: palette.statBg }}
                      >
                        {SQUAD_CONFIG.playerIndices().map((playerIndex) => (
                          <div
                            key={playerIndex}
                            className={`h-3 w-[5px] rounded-sm ${
                              currentRound?.eliminatedPlayers?.includes(
                                playerIndex,
                              )
                                ? ""
                                : ""
                            }`}
                            style={{
                              backgroundColor:
                                currentRound?.eliminatedPlayers?.includes(
                                  playerIndex,
                                )
                                  ? palette.deadBar
                                  : palette.aliveBar,
                              boxShadow:
                                currentRound?.eliminatedPlayers?.includes(
                                  playerIndex,
                                )
                                  ? "0 0 8px rgba(239,68,68,0.35)"
                                  : `0 0 10px ${palette.hudGlow}`,
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`w-12 flex items-center justify-center font-black ${
                        isEliminated ? "text-gray-300/80" : "text-cyan-100"
                      }`}
                      style={{
                        backgroundColor: palette.statBg,
                        borderLeft: `1px solid ${palette.borderSoft}`,
                      }}
                    >
                      {team.totalPoints}
                    </div>

                    <div
                      className={`w-12 flex items-center justify-center font-black ${
                        isEliminated ? "text-gray-300/80" : "text-amber-100"
                      }`}
                      style={{
                        backgroundColor: palette.statBg,
                        borderLeft: `1px solid ${palette.borderSoft}`,
                      }}
                    >
                      {currentRound?.kills ?? 0}
                    </div>

                    <div
                      className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
                      style={{
                        backgroundColor: isEliminated
                          ? palette.deadBar
                          : topRankStyle
                            ? topRankStyle.edge
                            : palette.accent,
                        opacity: isEliminated ? 0.45 : 0.95,
                      }}
                    />

                    <div
                      className="pointer-events-none absolute right-0 top-0 h-full w-[1px]"
                      style={{
                        backgroundColor: isEliminated
                          ? "#ffffff1f"
                          : `${palette.panelEdge}AA`,
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
