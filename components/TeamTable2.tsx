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
import {
  displayName,
  panelSurfaceStyle,
  typographyStyle,
} from "@/lib/overlayTheme";
import { GAMING_FX_CSS, Shine, fxPan } from "@/components/GamingFx";
import { SurfaceBackground, Watermark } from "@/components/OverlayChrome";

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

type RoundStat = Team["rounds"][number] | undefined;

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
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
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

  const { columns, header, layout, typography, surface, watermark } = settings;
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
  };

  const template = layout.template;
  const isBig = template === "big-board";
  const isCard = template === "card-stack";
  const isHairline = template === "hairline";
  const isLower = template === "lower-third";
  const animate = surface.animate;

  const fs = (base: number) => base * layout.fontScale * typography.fontScale;
  const rowFontSize = fs(isBig ? 15 : 12);
  const rowH = Math.round(
    layout.rowHeight * (isBig ? 1.7 : isCard ? 1.55 : 1)
  );
  const headerH = Math.round(layout.rowHeight * (isBig ? 1.35 : 1)) || rowH;
  const typeStyle = typographyStyle(typography);

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
              .sort((a: Team, b: Team) => b.totalPoints - a.totalPoints)
          );
          setLastSyncAt(new Date().toLocaleTimeString());
        }
      } catch {
        console.error("Error fetching teams:");
      }
    };

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const socketBase =
      process.env.NEXT_PUBLIC_SOCKET_URL || apiBase.replace(/\/api\/v1\/?$/, "");

    let refreshTimer: NodeJS.Timeout | null = null;
    const scheduleRefresh = (source: string) => {
      setLastEvent(source);
      if (refreshTimer) clearTimeout(refreshTimer);
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
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("team_log_created", () => scheduleRefresh("team_log_created"));
    socket.on("team_created", () => scheduleRefresh("team_created"));
    socket.on("team_deleted", () => scheduleRefresh("team_deleted"));
    socket.on("round_created", () => scheduleRefresh("round_created"));
    socket.on("round_deleted", () => scheduleRefresh("round_deleted"));
    socket.on("positions_updated", () => scheduleRefresh("positions_updated"));
    socket.on("elimination_state_changed", () =>
      scheduleRefresh("elimination_state_changed")
    );
    socket.on("settings_updated", () => {
      if (!previewSettings) void fetchSettings();
      scheduleRefresh("settings_updated");
    });
    socket.on("round_info_updated", () => {
      void refreshRoundInfo();
      scheduleRefresh("round_info_updated");
    });

    fetchSettings();
    fetchTeams();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      socket.disconnect();
    };
  }, [previewSettings, refreshRoundInfo]);

  const currentRoundNo = teams[0]?.currentRound;
  const currentMap = currentRoundNo ? mapByRound[currentRoundNo] : "";
  const showTitleStrip = Boolean(
    header.title || header.subtitle || header.logoUrl || currentMap
  );

  const renderAliveDots = (round: RoundStat, dotH: number) => (
    <div className="flex gap-1">
      {SQUAD_CONFIG.playerIndices().map((playerIndex) => {
        const dead = round?.eliminatedPlayers?.includes(playerIndex);
        return (
          <div
            key={playerIndex}
            className="w-[5px] rounded-sm"
            style={{
              height: dotH,
              backgroundColor: dead ? palette.deadBar : palette.aliveBar,
              boxShadow: dead
                ? `0 0 8px ${hexToRgba(palette.deadBar, 0.35)}`
                : `0 0 10px ${palette.hudGlow}`,
            }}
          />
        );
      })}
    </div>
  );

  const renderRankBadge = (index: number, size: number) => {
    const topRankStyle = topRankStyles[index as 0 | 1 | 2];
    if (topRankStyle) {
      return (
        <span
          className="inline-flex items-center justify-center rounded-md font-black"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.4,
            color: topRankStyle.badgeText,
            background: topRankStyle.badgeBg,
            border: `1px solid ${topRankStyle.badgeBorder}`,
            boxShadow: topRankStyle.glow,
            animation: animate ? "fxFloat 3s ease-in-out infinite" : undefined,
          }}
          aria-label={`Rank ${index + 1}`}
        >
          {index + 1}
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center justify-center rounded-md font-black"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          color: palette.textPrimary,
          backgroundColor: palette.cellBg,
          border: `1px solid ${palette.borderSoft}`,
        }}
      >
        {index + 1}
      </span>
    );
  };

  const renderTitleStrip = () => {
    if (!showTitleStrip) return null;
    return (
      <div
        className="relative flex items-center justify-center gap-2 overflow-hidden px-2"
        style={{
          height: Math.max(layout.rowHeight - 6, 24),
          backgroundImage: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
          ...(animate ? fxPan(7) : {}),
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        {animate ? <Shine delay={0.6} duration={4.2} /> : null}
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
            style={{ fontSize: fs(13), ...typeStyle }}
          >
            {header.title}
          </span>
        ) : null}
        {header.subtitle ? (
          <span
            className="font-bold uppercase tracking-wider text-white/80"
            style={{ fontSize: fs(9), ...typeStyle }}
          >
            {header.subtitle}
          </span>
        ) : null}
        {currentMap ? (
          <span
            className="rounded border border-white/40 bg-black/25 px-1.5 py-0.5 font-bold uppercase tracking-wider text-white"
            style={{ fontSize: fs(9) }}
          >
            {currentMap}
          </span>
        ) : null}
      </div>
    );
  };

  const renderColumnHeader = () => {
    if (isCard) return null;
    const light = isHairline;
    const cellColor = light ? palette.textPrimary : "#FFFFFF";
    return (
      <div
        className={`relative flex overflow-hidden font-bold ${
          animate && !light ? "shadow-lg" : ""
        }`}
        style={{
          height: headerH,
          fontSize: rowFontSize,
          color: cellColor,
          backgroundImage: light
            ? undefined
            : `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
          ...(animate && !light ? fxPan(9) : {}),
          borderBottom: `1px solid ${palette.border}`,
          opacity: light ? 0.8 : 1,
          ...typeStyle,
        }}
      >
        {isLower ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              transform: "skewX(-14deg)",
              backgroundImage: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 100%)`,
            }}
          />
        ) : null}
        {animate && !light ? <Shine duration={5} /> : null}
        <div
          className="relative flex w-12 items-center justify-center font-semibold tracking-tighter"
          style={{
            background: light
              ? undefined
              : `linear-gradient(90deg, ${palette.rankFrom} 0%, ${palette.rankTo} 100%)`,
            borderRight: `1px solid ${palette.border}`,
            color: cellColor,
          }}
        >
          RANK
        </div>
        <div
          className="relative flex flex-1 items-center justify-start pl-3 font-semibold tracking-wide"
          style={{
            background: light
              ? undefined
              : `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
            color: cellColor,
          }}
        >
          TEAM
        </div>
        {columns.alive ? (
          <div
            className="relative flex w-14 items-center justify-center tracking-wide"
            style={{ color: cellColor }}
          >
            ALIVE
          </div>
        ) : null}
        {columns.pts ? (
          <div
            className="relative flex w-11 items-center justify-center tracking-wide"
            style={{ color: cellColor }}
          >
            PTS
          </div>
        ) : null}
        {columns.elims ? (
          <div
            className="relative flex w-11 items-center justify-center pr-1 tracking-wide"
            style={{ color: cellColor }}
          >
            ELIMS
          </div>
        ) : null}
      </div>
    );
  };

  const renderCardRow = (team: Team, index: number, isEliminated: boolean) => {
    const round = team.rounds.find((r) => r.roundNumber === team.currentRound);
    const topRankStyle = topRankStyles[index as 0 | 1 | 2];
    const edgeColor = isEliminated
      ? palette.deadBar
      : topRankStyle
        ? topRankStyle.edge
        : palette.accent;
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
        className="relative flex items-center gap-2 overflow-hidden px-2"
        style={{
          height: rowH,
          fontSize: rowFontSize,
          marginBottom: layout.gap,
          borderRadius: surface.radius,
          backgroundImage: `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
          border: `1px solid ${palette.borderSoft}`,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)`,
          filter: isEliminated ? "grayscale(100%)" : "none",
          opacity: isEliminated ? 0.9 : 1,
          ...typeStyle,
        }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
          style={{
            backgroundColor: edgeColor,
            boxShadow: `0 0 12px ${hexToRgba(edgeColor, 0.75)}`,
          }}
        />
        <div className="flex w-9 justify-center">
          {renderRankBadge(index, 24)}
        </div>
        {columns.logo ? (
          <Image
            src={team.logo || "/placeholder.svg"}
            alt={team.name}
            width={28}
            height={28}
            className="rounded-sm object-contain"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div
            className="truncate font-extrabold tracking-[0.02em] text-white"
            style={typeStyle}
          >
            {displayName(team.name, typography)}
          </div>
          {columns.alive && round ? (
            <div className="mt-0.5">{renderAliveDots(round, 8)}</div>
          ) : null}
        </div>
        {columns.pts ? (
          <div className="flex flex-col items-center px-1.5">
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/70">
              PTS
            </span>
            <span className="font-black text-white" style={{ fontSize: rowFontSize * 1.1 }}>
              {team.totalPoints}
            </span>
          </div>
        ) : null}
        {columns.elims ? (
          <div className="flex flex-col items-center px-1.5">
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/70">
              ELIMS
            </span>
            <span
              className="font-black"
              style={{ color: palette.aliveBar, fontSize: rowFontSize * 1.1 }}
            >
              {round?.kills ?? 0}
            </span>
          </div>
        ) : null}
      </motion.div>
    );
  };

  const renderColumnRow = (team: Team, index: number, isEliminated: boolean) => {
    const round = team.rounds.find((r) => r.roundNumber === team.currentRound);
    const topRankStyle = topRankStyles[index as 0 | 1 | 2];
    const edgeColor = isEliminated
      ? palette.deadBar
      : topRankStyle
        ? topRankStyle.edge
        : palette.accent;
    const nameText = displayName(team.name, typography);
    const badgeSize = isBig ? 28 : 22;

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
        className={`relative flex ${isHairline ? "" : "shadow-md"}`}
        style={{
          height: rowH,
          fontSize: rowFontSize,
          marginBottom: layout.gap,
          borderBottom: `1px solid ${isHairline ? palette.border : palette.borderSoft}`,
          background: isEliminated
            ? "rgba(226, 232, 240, 0.75)"
            : "transparent",
          filter: isEliminated ? "grayscale(100%)" : "none",
          opacity: isEliminated ? 0.95 : 1,
          boxShadow: topRankStyle
            ? `${topRankStyle.glow}, inset 0 0 0 1px rgba(255,255,255,0.06)`
            : undefined,
        }}
      >
        {isLower ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              transform: "skewX(-14deg)",
              backgroundImage: isEliminated
                ? "rgba(226,232,240,0.6)"
                : `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
              opacity: isEliminated ? 1 : 0.9,
            }}
          />
        ) : null}

        <div
          className="relative z-10 flex w-12 items-center justify-center font-bold"
          style={{
            background: isEliminated
              ? "transparent"
              : `linear-gradient(180deg, ${palette.rankFrom} 0%, ${palette.rankTo} 100%)`,
            borderRight: `1px solid ${palette.border}`,
          }}
        >
          {renderRankBadge(index, badgeSize)}
          {index === 0 && !isEliminated && layout.showTrophy ? (
            <motion.span
              className="pointer-events-none absolute -right-1 -top-1 z-10 text-[9px]"
              variants={trophyVariants}
              initial="initial"
              animate="animate"
            >
              🏆
            </motion.span>
          ) : null}
        </div>

        <div
          className="relative z-10 flex min-w-0 flex-1 items-center gap-2 pl-2"
          style={{
            background: isEliminated
              ? "transparent"
              : `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
          }}
        >
          {columns.logo ? (
            <Image
              src={team.logo || "/placeholder.svg"}
              alt={team.name}
              width={isBig ? 26 : 20}
              height={isBig ? 26 : 20}
              className="rounded-sm object-contain"
            />
          ) : null}
          <span
            className={`truncate font-extrabold tracking-[0.02em] ${
              isEliminated ? "text-slate-600 line-through" : "text-white"
            }`}
            style={{ fontSize: rowFontSize, ...typeStyle }}
          >
            {nameText}
          </span>
          {!isEliminated ? (
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: palette.aliveBar,
                boxShadow: `0 0 10px ${palette.hudGlow}`,
                animation: animate ? "fxPulse 1.2s ease-in-out infinite" : undefined,
              }}
            />
          ) : null}
        </div>

        {columns.alive ? (
          <div
            className="relative z-10 flex w-14 items-center justify-center"
            style={{
              background: isEliminated ? "transparent" : palette.cellBg,
              borderLeft: `1px solid ${palette.borderSoft}`,
            }}
          >
            {renderAliveDots(round, 12)}
          </div>
        ) : null}

        {columns.pts ? (
          <div
            className="relative z-10 flex w-12 items-center justify-center font-black"
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
            className="relative z-10 flex w-12 items-center justify-center font-black"
            style={{
              background: isEliminated ? "transparent" : palette.cellBg,
              borderLeft: `1px solid ${palette.borderSoft}`,
              color: isEliminated ? undefined : palette.elimColor,
            }}
          >
            {round?.kills ?? 0}
          </div>
        ) : null}

        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
          style={{
            backgroundColor: edgeColor,
            opacity: isEliminated ? 0.45 : 0.95,
            boxShadow: isEliminated
              ? undefined
              : `0 0 12px ${hexToRgba(edgeColor, 0.75)}`,
            animation:
              !isEliminated && animate ? "fxPulse 2s ease-in-out infinite" : undefined,
          }}
        />
      </motion.div>
    );
  };

  const renderTeam = (team: Team, index: number) => {
    const round = team.rounds.find((r) => r.roundNumber === team.currentRound);
    const isEliminated =
      (round?.eliminationCount ?? 0) >= SQUAD_CONFIG.fullEliminationCount;
    return isCard
      ? renderCardRow(team, index, isEliminated)
      : renderColumnRow(team, index, isEliminated);
  };

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
          className="relative flex flex-col overflow-hidden"
          style={panelSurfaceStyle(surface, colors)}
        >
          <SurfaceBackground surface={surface} />
          {surface.scanline ? (
            <div
              className="pointer-events-none absolute inset-0 z-20 opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.7) 1px, transparent 1px, transparent 6px)",
              }}
            />
          ) : null}
          <div className="relative z-10 flex flex-col">
            {renderTitleStrip()}
            {renderColumnHeader()}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence>
                {teams.map((team, index) => renderTeam(team, index))}
              </AnimatePresence>
            </div>
          </div>
          <Watermark watermark={watermark} />
        </div>
      </div>
    </div>
  );
}
