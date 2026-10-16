"use client";

import Image from "next/image";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiChickenOven } from "react-icons/gi";
import { useSettings } from "@/hooks/useSettings";
import {
  DEFAULT_POINTS_TABLE,
  hexToRgba,
  mergePointsTable,
  type OverlayTemplate,
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
}

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

interface LeaderboardPanelProps {
  readonly teams: Team[];
  readonly startIndex: number;
  readonly endIndex: number;
  readonly settings: PointsTableSettings;
  readonly template: OverlayTemplate;
}

interface SplitLeaderboardProps {
  readonly teams: Team[];
  readonly themeColor?: string;
  readonly settings?: PointsTableSettings;
}

const getChickenCount = (team: Team) =>
  team.rounds.filter((round) => round.position === 1).length;

const getTotals = (team: Team) =>
  team.rounds.reduce(
    (acc, round) => ({
      placePoints: acc.placePoints + (round.positionPoints || 0),
      elimPoints: acc.elimPoints + (round.killPoints || 0),
    }),
    { placePoints: 0, elimPoints: 0 }
  );

const LeaderboardPanel = ({
  teams,
  startIndex,
  endIndex,
  settings,
  template,
}: LeaderboardPanelProps) => {
  const slicedTeams = teams.slice(startIndex, endIndex);
  const { colors, leaderboard, layout, typography, surface, watermark } =
    settings;

  const palette = {
    accent: colors.accent,
    headerFrom: colors.headerFrom,
    headerTo: colors.headerTo,
    border: colors.border,
    borderSoft: colors.borderSoft,
    rankFrom: colors.rankFrom,
    rankTo: colors.rankTo,
    teamFrom: colors.teamFrom,
    teamTo: colors.teamTo,
    textPrimary: colors.textPrimary,
    statBg: colors.cellBg,
    placeColor: colors.placeColor,
    elimColor: colors.elimColor,
    totalColor: colors.totalColor,
    warning: colors.warning,
  };

  const isBig = template === "big-board";
  const isCard = template === "card-stack";
  const isHairline = template === "hairline";

  const renderRow = (team: Team, index: number) => {
    const actualRank = startIndex + index + 1;
    const topRankStyle = topRankStyles[(actualRank - 1) as 0 | 1 | 2];
    const chickenCount = getChickenCount(team);
    const { placePoints, elimPoints } = getTotals(team);
    const totalPoints = placePoints + elimPoints;
    const nameText = displayName(team.name, typography);
    const edgeColor = topRankStyle ? topRankStyle.edge : palette.accent;
    const fontSize = (isBig ? 16 : 12) * layout.fontScale * typography.fontScale;
    const typeStyle = typographyStyle(typography);
    const flat = isHairline;
    const rowBg =
      flat || surface.style === "transparent" || surface.style === "none"
        ? "transparent"
        : undefined;

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
        className={
          isCard
            ? "relative mb-2 flex items-center gap-3 overflow-hidden px-3"
            : "relative flex"
        }
        style={{
          height: isCard
            ? Math.round(layout.rowHeight * 1.55)
            : isBig
              ? Math.round(layout.rowHeight * 1.5)
              : layout.rowHeight,
          fontSize,
          color: palette.textPrimary,
          borderBottom: isCard ? undefined : `1px solid ${palette.borderSoft}`,
          borderRadius: isCard ? surface.radius : undefined,
          backgroundImage: isCard
            ? `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`
            : undefined,
          border: isCard ? `1px solid ${palette.borderSoft}` : undefined,
          background: rowBg,
          boxShadow: topRankStyle
            ? `${topRankStyle.glow}, inset 0 0 0 1px rgba(255,255,255,0.06)`
            : undefined,
          ...typeStyle,
        }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
          style={{
            backgroundColor: edgeColor,
            opacity: 0.95,
            boxShadow: `0 0 12px ${hexToRgba(edgeColor, 0.75)}`,
            animation: surface.animate ? "fxPulse 2s ease-in-out infinite" : undefined,
          }}
        />

        {isCard ? (
          <>
            <span className="w-7 text-lg font-black text-white">{actualRank}</span>
            {leaderboard.showLogo ? (
              <Image
                src={team.logo || "/placeholder.svg"}
                alt={team.name}
                width={leaderboard.logoSize}
                height={leaderboard.logoSize}
                className="object-contain"
                style={{ borderRadius: leaderboard.logoRounding }}
              />
            ) : null}
            <span className="min-w-0 flex-1 truncate font-extrabold text-white">
              {nameText}
            </span>
            {leaderboard.showTotal ? (
              <span className="font-black text-white" style={{ fontSize: fontSize * 1.1 }}>
                {totalPoints}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <div
              className="relative z-10 flex w-12 items-center justify-center font-bold"
              style={{
                background: flat
                  ? undefined
                  : `linear-gradient(180deg, ${palette.rankFrom} 0%, ${palette.rankTo} 100%)`,
                borderRight: `1px solid ${palette.border}`,
              }}
            >
              {topRankStyle ? (
                <span
                  className="inline-flex items-center justify-center rounded-md font-black"
                  style={{
                    width: isBig ? 30 : 24,
                    height: isBig ? 30 : 24,
                    fontSize: isBig ? 12 : 10,
                    color: topRankStyle.badgeText,
                    background: topRankStyle.badgeBg,
                    border: `1px solid ${topRankStyle.badgeBorder}`,
                    boxShadow: topRankStyle.glow,
                    animation: surface.animate
                      ? "fxFloat 3s ease-in-out infinite"
                      : undefined,
                  }}
                >
                  {actualRank}
                </span>
              ) : (
                <span
                  className="font-black"
                  style={{ color: flat ? palette.textPrimary : "#FFFFFF" }}
                >
                  {actualRank}
                </span>
              )}
            </div>

            <div
              className="relative z-10 flex min-w-0 flex-1 items-center gap-2 pl-3"
              style={{
                background: flat
                  ? undefined
                  : `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
              }}
            >
              {leaderboard.showLogo ? (
                <Image
                  src={team.logo || "/placeholder.svg"}
                  alt={team.name}
                  width={leaderboard.logoSize}
                  height={leaderboard.logoSize}
                  className="object-contain"
                  style={{ borderRadius: leaderboard.logoRounding }}
                />
              ) : null}
              <div className="flex min-w-0 flex-1 items-center pr-2">
                <span
                  className={`truncate font-extrabold tracking-[0.02em] ${
                    flat ? "" : "text-white"
                  }`}
                  style={flat ? { color: palette.textPrimary } : undefined}
                  title={team.name}
                >
                  {nameText}
                </span>
                {leaderboard.showChickens && chickenCount > 0 ? (
                  <span
                    className="ml-2 inline-flex items-center gap-1 rounded border px-1 py-0.5 text-[9px] font-black text-white shadow-sm"
                    style={{
                      background: palette.warning,
                      borderColor: palette.warning,
                    }}
                  >
                    <GiChickenOven className="h-3 w-3" />
                    {`x${chickenCount}`}
                  </span>
                ) : null}
              </div>
            </div>

            {leaderboard.showPlace ? (
              <div
                className="relative z-10 flex items-center justify-center font-black"
                style={{
                  width: isBig ? 76 : 56,
                  color: palette.placeColor,
                  backgroundColor: flat ? "transparent" : palette.statBg,
                  borderLeft: `1px solid ${palette.borderSoft}`,
                }}
              >
                {placePoints}
              </div>
            ) : null}

            {leaderboard.showElims ? (
              <div
                className="relative z-10 flex items-center justify-center font-black"
                style={{
                  width: isBig ? 76 : 56,
                  color: palette.elimColor,
                  backgroundColor: flat ? "transparent" : palette.statBg,
                  borderLeft: `1px solid ${palette.borderSoft}`,
                }}
              >
                {elimPoints}
              </div>
            ) : null}

            {leaderboard.showTotal ? (
              <div
                className="relative z-10 flex items-center justify-center font-black"
                style={{
                  width: isBig ? 76 : 56,
                  color: palette.totalColor,
                  backgroundColor: flat ? "transparent" : palette.statBg,
                  borderLeft: `1px solid ${palette.borderSoft}`,
                }}
              >
                {totalPoints}
              </div>
            ) : null}
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={panelSurfaceStyle(surface, colors)}
    >
      <style>{GAMING_FX_CSS}</style>
      <SurfaceBackground surface={surface} />
      {surface.scanline ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.7) 1px, transparent 1px, transparent 6px)",
          }}
        />
      ) : null}

      {leaderboard.showTitle &&
      (leaderboard.title || leaderboard.subtitle || leaderboard.bannerImage) ? (
        <div
          className="relative z-10 flex items-center gap-3 px-3 py-2"
          style={{
            background: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 100%)`,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          {leaderboard.bannerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={leaderboard.bannerImage}
              alt=""
              className="h-10 w-auto object-contain"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            {leaderboard.title ? (
              <div className="truncate text-sm font-black uppercase tracking-wide text-white">
                {leaderboard.title}
              </div>
            ) : null}
            {leaderboard.subtitle ? (
              <div className="truncate text-[11px] font-semibold uppercase text-white/80">
                {leaderboard.subtitle}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isCard && !isHairline ? (
        <div
          className="relative z-10 flex h-10 overflow-hidden text-xs font-bold uppercase tracking-wide shadow-lg"
          style={{
            color: "#FFFFFF",
            backgroundImage: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
            ...(surface.animate ? fxPan(9) : {}),
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          {surface.animate ? <Shine duration={5} /> : null}
          <div
            className="relative flex w-12 items-center justify-center font-semibold"
            style={{
              background: `linear-gradient(90deg, ${palette.rankFrom} 0%, ${palette.rankTo} 100%)`,
              borderRight: `1px solid ${palette.border}`,
            }}
          >
            {leaderboard.headerLabels.rank}
          </div>
          <div
            className="relative flex flex-1 items-center justify-start pl-3 font-semibold"
            style={{
              background: `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
            }}
          >
            {leaderboard.headerLabels.team}
          </div>
          {leaderboard.showPlace ? (
            <div className="relative flex w-14 items-center justify-center">
              {leaderboard.headerLabels.place}
            </div>
          ) : null}
          {leaderboard.showElims ? (
            <div className="relative flex w-14 items-center justify-center">
              {leaderboard.headerLabels.elims}
            </div>
          ) : null}
          {leaderboard.showTotal ? (
            <div className="relative flex w-14 items-center justify-center pr-1">
              {leaderboard.headerLabels.total}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 overflow-hidden">
        <AnimatePresence>
          {slicedTeams.map((team, index) => renderRow(team, index))}
        </AnimatePresence>
      </div>

      {leaderboard.footerNote ? (
        <div
          className="relative z-10 px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wide"
          style={{
            color: palette.textPrimary,
            borderTop: `1px solid ${palette.borderSoft}`,
          }}
        >
          {leaderboard.footerNote}
        </div>
      ) : null}

      <Watermark watermark={watermark} />
    </div>
  );
};

export default function SplitLeaderboard({
  teams,
  settings: settingsProp,
}: SplitLeaderboardProps) {
  const { settings: remoteSettings } = useSettings();

  const settings = useMemo<PointsTableSettings>(
    () =>
      mergePointsTable(
        settingsProp ?? remoteSettings?.pointsTable ?? DEFAULT_POINTS_TABLE
      ),
    [settingsProp, remoteSettings]
  );

  const template = settings.leaderboard.template;

  if (template === "classic") {
    const midpoint = Math.ceil(teams.length / 2);
    return (
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <LeaderboardPanel
          teams={teams}
          startIndex={0}
          endIndex={midpoint}
          settings={settings}
          template="classic"
        />
        <LeaderboardPanel
          teams={teams}
          startIndex={midpoint}
          endIndex={teams.length}
          settings={settings}
          template="classic"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <LeaderboardPanel
        teams={teams}
        startIndex={0}
        endIndex={teams.length}
        settings={settings}
        template={template}
      />
    </div>
  );
}
