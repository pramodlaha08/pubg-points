"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import SQUAD_CONFIG from "@/lib/squadConfig";
import { api, getApiTournamentId } from "@/lib/api";
import { useRoundInfo } from "@/hooks/useRoundInfo";
import {
  DEFAULT_POINTS_TABLE,
  hexToRgba,
  mergePointsTable,
  type PointsTableSettings,
} from "@/lib/tableSettings";
import { GAMING_FX_CSS, Shine, fxPan } from "@/components/GamingFx";

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
  absent?: boolean;
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
  readonly previewSettings?: PointsTableSettings;
}

export default function AnimatedTeamTable({
  showDebug,
  themeColor,
  previewSettings,
}: AnimatedTeamTableProps) {
  // Use env var for debug mode, allow prop override
  const debugMode =
    showDebug !== undefined
      ? showDebug
      : process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

  const [settings, setSettings] = useState<PointsTableSettings>(
    previewSettings ?? DEFAULT_POINTS_TABLE
  );

  useEffect(() => {
    if (previewSettings) {
      setSettings(previewSettings);
    }
  }, [previewSettings]);

  const colors = settings.colors;
  const accent = themeColor || colors.accent;
  const palette = {
    accent,
    panelEdge: colors.borderSoft,
    headerFrom: colors.headerFrom,
    headerTo: colors.headerTo,
    border: colors.border,
    borderSoft: colors.borderSoft,
    rankFrom: colors.rankFrom,
    rankTo: colors.rankTo,
    teamFrom: colors.teamFrom,
    teamTo: colors.teamTo,
    cellBg: colors.cellBg,
    aliveBar: colors.aliveBar,
    deadBar: colors.deadBar,
    hudGlow: hexToRgba(accent, 0.28),
    textPrimary: colors.textPrimary,
    totalColor: colors.totalColor,
    elimColor: colors.elimColor,
    placeColor: colors.placeColor,
  };

  const { columns, header, layout } = settings;
  const rowFontSize = 12 * layout.fontScale;

  const [teams, setTeams] = useState<Team[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>("-");
  const [lastSyncAt, setLastSyncAt] = useState<string>("-");
  const [updateCount, setUpdateCount] = useState(0);

  const { mapByRound, refresh: refreshRoundInfo } = useRoundInfo();

  useEffect(() => {
    const fetchSettings = async () => {
      if (previewSettings) return;
      try {
        const response = await api.get("/settings");
        if (response.data?.success) {
          setSettings(mergePointsTable(response.data.data?.pointsTable));
        }
      } catch {
        console.error("Error fetching table settings:");
      }
    };

    const fetchTeams = async () => {
      try {
        const response = await api.get("/team");
        const data = response.data;

        if (data.success) {
          setTeams(
            data.data
              .filter((team: Team) => !team.absent)
              .sort((a: Team, b: Team) => b.totalPoints - a.totalPoints),
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
      const scope = getApiTournamentId();
      if (scope) socket.emit("join_tournament", scope);
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
    socket.on("settings_updated", () => {
      if (!previewSettings) {
        void fetchSettings();
      }
      scheduleRefresh("settings_updated");
    });
    socket.on("round_info_updated", () => {
      void refreshRoundInfo();
      scheduleRefresh("round_info_updated");
    });

    fetchSettings();
    fetchTeams();

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      socket.disconnect();
    };
  }, [previewSettings, refreshRoundInfo]);

  const currentRound = teams[0]?.currentRound;
  const currentMap = currentRound ? mapByRound[currentRound] : "";
  const showTitleStrip = Boolean(
    header.title || header.subtitle || header.logoUrl || currentMap
  );

  return (
    <div className="flex items-center justify-center">
      <style>{GAMING_FX_CSS}</style>
      <div className="mx-auto" style={{ width: layout.width }}>
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
            background: "transparent", // Set to transparent so eliminated rows show the core page background (e.g., green chroma key)
            boxShadow: `0 0 0 1px ${palette.borderSoft}, 0 16px 36px rgba(0,0,0,0.55)`,
          }}
        >
          {/* Optional tournament title / logo strip */}
          {showTitleStrip ? (
            <div
              className="relative flex items-center justify-center gap-2 overflow-hidden px-2"
              style={{
                height: Math.max(layout.rowHeight - 6, 24),
                backgroundImage: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
                ...fxPan(7),
                borderBottom: `1px solid ${palette.border}`,
              }}
            >
              <Shine delay={0.6} duration={4.2} />
              {header.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={header.logoUrl}
                  alt={header.title || "Tournament"}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              ) : null}
              {header.title ? (
                <span
                  className="font-black tracking-widest text-white drop-shadow"
                  style={{ fontSize: 13 * layout.fontScale }}
                >
                  {header.title}
                </span>
              ) : null}
              {header.subtitle ? (
                <span
                  className="font-bold uppercase tracking-wider text-white/80"
                  style={{ fontSize: 9 * layout.fontScale }}
                >
                  {header.subtitle}
                </span>
              ) : null}
              {currentMap ? (
                <span
                  className="rounded border border-white/40 bg-black/25 px-1.5 py-0.5 font-bold uppercase tracking-wider text-white"
                  style={{ fontSize: 9 * layout.fontScale }}
                >
                  {currentMap}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Decorative overlays removed so they don't tint the green chroma key transparent background */}
          <div
            className="relative flex overflow-hidden text-xs font-bold shadow-lg"
            style={{
              height: layout.rowHeight,
              fontSize: rowFontSize,
              color: palette.textPrimary,
              backgroundImage: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
              ...fxPan(9),
              borderBottom: `1px solid ${palette.border}`,
            }}
          >
            <Shine duration={5} />
            <div
              className="w-12 flex items-center justify-center tracking-tighter font-semibold"
              style={{
                background: `linear-gradient(90deg, ${palette.rankFrom} 0%, ${palette.rankTo} 100%)`,
                borderRight: `1px solid ${palette.border}`,
                color: "#FFFFFF",
              }}
            >
              RANK
            </div>
            <div
              className="flex-1 flex items-center justify-start pl-3 tracking-wide font-semibold"
              style={{
                background: `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
                color: "#FFFFFF",
              }}
            >
              TEAM
            </div>
            {columns.alive ? (
              <div className="w-14 flex items-center justify-center tracking-wide text-white">
                ALIVE
              </div>
            ) : null}
            {columns.pts ? (
              <div className="w-11 flex items-center justify-center tracking-wide text-white">
                PTS
              </div>
            ) : null}
            {columns.elims ? (
              <div className="w-11 flex items-center justify-center pr-1 tracking-wide text-white">
                ELIMS
              </div>
            ) : null}
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
                    className={`relative flex shadow-md ${
                      isEliminated
                        ? "text-slate-600 font-bold"
                        : "text-slate-900"
                    }`}
                    style={{
                      height: layout.rowHeight,
                      fontSize: rowFontSize,
                      borderBottom: `1px solid ${palette.borderSoft}`,
                      // Little faded grayed and slightly transparent background
                      background: isEliminated
                        ? "rgba(226, 232, 240, 0.75)" // matching tailwind slate-200 with 85% opacity
                        : "transparent",
                      filter: isEliminated ? "grayscale(100%)" : "none",
                      opacity: isEliminated ? 0.95 : 1, // High opacity to keep text clearly visible
                      boxShadow: topRankStyle
                        ? `${topRankStyle.glow}, inset 0 0 0 1px rgba(255,255,255,0.06)`
                        : undefined,
                    }}
                  >
                    <div
                      className="relative z-10 w-12 flex items-center justify-center font-bold text-base"
                      style={{
                        background: isEliminated
                          ? "transparent"
                          : `linear-gradient(180deg, ${palette.rankFrom} 0%, ${palette.rankTo} 100%)`,
                        borderRight: `1px solid ${palette.border}`,
                        minHeight: "100%",
                      }}
                    >
                      {topRankStyle ? (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-black"
                          style={{
                            color: topRankStyle.badgeText,
                            background: topRankStyle.badgeBg,
                            border: `1px solid ${topRankStyle.badgeBorder}`,
                            boxShadow: topRankStyle.glow,
                            animation: "fxFloat 3s ease-in-out infinite",
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
                            backgroundColor: palette.cellBg,
                            border: `1px solid ${palette.borderSoft}`,
                          }}
                        >
                          {index + 1}
                        </span>
                      )}
                      {index === 0 && !isEliminated && layout.showTrophy ? (
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

                    <div
                      className="relative z-10 flex-1 flex min-w-0 items-center space-x-2 pl-2"
                      style={{
                        background: isEliminated
                          ? "transparent"
                          : `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
                        paddingLeft: 8,
                        minHeight: "100%",
                      }}
                    >
                      {columns.logo ? (
                        <Image
                          src={team.logo || "/placeholder.svg"}
                          alt={team.name}
                          width={20}
                          height={20}
                          className="object-contain rounded-sm"
                        />
                      ) : null}
                      <span
                        className={`truncate font-extrabold tracking-[0.02em] ${
                          isEliminated
                            ? "text-slate-600 line-through decoration-slate-400 decoration-[1.5px]"
                            : "text-white"
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

                    {columns.alive ? (
                      <div
                        className="relative z-10 w-14 flex items-center justify-center"
                        style={{
                          background: isEliminated ? "transparent" : palette.cellBg,
                          borderLeft: `1px solid ${palette.borderSoft}`,
                        }}
                      >
                        <div className="flex gap-1">
                          {SQUAD_CONFIG.playerIndices().map((playerIndex) => (
                            <div
                              key={playerIndex}
                              className="h-3 w-[5px] rounded-sm"
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
                                    ? `0 0 8px ${hexToRgba(palette.deadBar, 0.35)}`
                                    : `0 0 10px ${palette.hudGlow}`,
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {columns.pts ? (
                      <div
                        className={`relative z-10 w-12 flex items-center justify-center font-black ${
                          isEliminated ? "text-slate-600" : ""
                        }`}
                        style={{
                          background: isEliminated ? "transparent" : palette.cellBg,
                          borderLeft: `1px solid ${palette.borderSoft}`,
                          color: isEliminated ? undefined : palette.totalColor,
                        }}
                      >
                        {team.totalPoints}
                      </div>
                    ) : null}

                    {columns.elims ? (
                      <div
                        className={`relative z-10 w-12 flex items-center justify-center font-black ${
                          isEliminated ? "text-slate-600" : ""
                        }`}
                        style={{
                          background: isEliminated ? "transparent" : palette.cellBg,
                          borderLeft: `1px solid ${palette.borderSoft}`,
                          color: isEliminated ? undefined : palette.elimColor,
                        }}
                      >
                        {currentRound?.kills ?? 0}
                      </div>
                    ) : null}

                    <div
                      className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
                      style={{
                        backgroundColor: isEliminated
                          ? palette.deadBar
                          : topRankStyle
                            ? topRankStyle.edge
                            : palette.accent,
                        opacity: isEliminated ? 0.45 : 0.95,
                        boxShadow: isEliminated
                          ? undefined
                          : `0 0 12px ${hexToRgba(
                              topRankStyle ? topRankStyle.edge : palette.accent,
                              0.75
                            )}`,
                        animation: isEliminated
                          ? undefined
                          : "fxPulse 2s ease-in-out infinite",
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
