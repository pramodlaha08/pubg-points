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

interface TeamTableProps {
  readonly teams: Team[];
  readonly startIndex: number;
  readonly endIndex: number;
  readonly settings: PointsTableSettings;
}

interface SplitLeaderboardProps {
  readonly teams: Team[];
  readonly themeColor?: string;
  readonly settings?: PointsTableSettings;
}

const TeamTable = ({
  teams,
  startIndex,
  endIndex,
  settings,
}: TeamTableProps) => {
  const slicedTeams = teams.slice(startIndex, endIndex);
  const { colors, leaderboard } = settings;

  const palette = {
    accent: colors.accent,
    panelFrom: colors.panelFrom,
    panelTo: colors.panelTo,
    panelEdge: colors.borderSoft,
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

  const getChickenCount = (team: Team) =>
    team.rounds.filter((round) => round.position === 1).length;

  const calculateTotalStats = (team: Team) =>
    team.rounds.reduce(
      (acc, round) => ({
        placePoints: acc.placePoints + (round.positionPoints || 0),
        elimPoints: acc.elimPoints + (round.killPoints || 0),
      }),
      { placePoints: 0, elimPoints: 0 }
    );

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border shadow-2xl"
      style={{
        borderColor: palette.border,
        backgroundImage: `linear-gradient(140deg, ${palette.panelFrom} 0%, ${palette.panelTo} 100%)`,
        backgroundSize: "200% 200%",
        animation: "fxPan 12s linear infinite",
        boxShadow: `0 0 0 1px ${palette.borderSoft}, 0 16px 36px rgba(0,0,0,0.25)`,
      }}
    >
      <style>{GAMING_FX_CSS}</style>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.7) 1px, transparent 1px, transparent 6px)",
        }}
      />

      <div
        className="relative flex h-10 overflow-hidden text-xs font-bold uppercase tracking-wide shadow-lg"
        style={{
          color: palette.textPrimary,
          backgroundImage: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
          ...fxPan(9),
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <Shine duration={5} />
        <div
          className="flex w-12 items-center justify-center font-semibold"
          style={{
            background: `linear-gradient(90deg, ${palette.rankFrom} 0%, ${palette.rankTo} 100%)`,
            borderRight: `1px solid ${palette.border}`,
            color: "#FFFFFF",
          }}
        >
          RANK
        </div>
        <div
          className="flex flex-1 items-center justify-start pl-3 font-semibold"
          style={{
            background: `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
            color: "#FFFFFF",
          }}
        >
          TEAM
        </div>
        {leaderboard.showPlace ? (
          <div className="flex w-14 items-center justify-center text-white">
            PLACE
          </div>
        ) : null}
        {leaderboard.showElims ? (
          <div className="flex w-14 items-center justify-center text-white">
            ELIMS
          </div>
        ) : null}
        {leaderboard.showTotal ? (
          <div className="flex w-14 items-center justify-center pr-1 text-white">
            TOTAL
          </div>
        ) : null}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence>
          {slicedTeams.map((team, index) => {
            const actualRank = startIndex + index + 1;
            const topRankStyle = topRankStyles[(actualRank - 1) as 0 | 1 | 2];
            const chickenCount = getChickenCount(team);
            const { placePoints, elimPoints } = calculateTotalStats(team);
            const totalPoints = placePoints + elimPoints;

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
                className="relative flex h-10 text-xs shadow-md"
                style={{
                  borderBottom: `1px solid ${palette.borderSoft}`,
                  background: "transparent",
                  color: palette.textPrimary,
                  boxShadow: topRankStyle
                    ? `${topRankStyle.glow}, inset 0 0 0 1px rgba(255,255,255,0.06)`
                    : undefined,
                }}
              >
                <div
                  className="relative z-10 flex w-12 items-center justify-center font-bold text-base"
                  style={{
                    background: `linear-gradient(180deg, ${palette.rankFrom} 0%, ${palette.rankTo} 100%)`,
                    borderRight: `1px solid ${palette.border}`,
                  }}
                >
                  {topRankStyle ? (
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black"
                      style={{
                        color: topRankStyle.badgeText,
                        background: topRankStyle.badgeBg,
                        border: `1px solid ${topRankStyle.badgeBorder}`,
                        boxShadow: topRankStyle.glow,
                        animation: "fxFloat 3s ease-in-out infinite",
                      }}
                    >
                      {actualRank}
                    </span>
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black text-white">
                      {actualRank}
                    </span>
                  )}
                </div>

                <div
                  className="relative z-10 flex min-w-0 flex-1 items-center gap-2 pl-3"
                  style={{
                    background: `linear-gradient(90deg, ${palette.teamFrom} 0%, ${palette.teamTo} 100%)`,
                  }}
                >
                  {leaderboard.showLogo ? (
                    <Image
                      src={team.logo || "/placeholder.svg"}
                      alt={team.name}
                      width={22}
                      height={22}
                      className="object-contain rounded-sm"
                    />
                  ) : null}

                  <div className="min-w-0 flex-1 flex items-center pr-2">
                    <span
                      className="truncate font-extrabold tracking-[0.02em] text-white"
                      title={team.name}
                    >
                      {team.name.toUpperCase()}
                    </span>

                    {leaderboard.showChickens && chickenCount > 0 ? (
                      <span
                        className="ml-2 inline-flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-black text-white shadow-sm border"
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
                    className="relative z-10 flex w-14 items-center justify-center font-black"
                    style={{
                      color: palette.placeColor,
                      backgroundColor: palette.statBg,
                      borderLeft: `1px solid ${palette.borderSoft}`,
                    }}
                  >
                    {placePoints}
                  </div>
                ) : null}

                {leaderboard.showElims ? (
                  <div
                    className="relative z-10 flex w-14 items-center justify-center font-black"
                    style={{
                      color: palette.elimColor,
                      backgroundColor: palette.statBg,
                      borderLeft: `1px solid ${palette.borderSoft}`,
                    }}
                  >
                    {elimPoints}
                  </div>
                ) : null}

                {leaderboard.showTotal ? (
                  <div
                    className="relative z-10 flex w-14 items-center justify-center font-black"
                    style={{
                      color: palette.totalColor,
                      backgroundColor: palette.statBg,
                      borderLeft: `1px solid ${palette.borderSoft}`,
                    }}
                  >
                    {totalPoints}
                  </div>
                ) : null}

                <div
                  className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
                  style={{
                    backgroundColor: topRankStyle
                      ? topRankStyle.edge
                      : palette.accent,
                    opacity: 0.95,
                    boxShadow: `0 0 12px ${hexToRgba(
                      topRankStyle ? topRankStyle.edge : palette.accent,
                      0.75
                    )}`,
                    animation: "fxPulse 2s ease-in-out infinite",
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
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

  const sortedTeams = [...teams].sort((a, b) => {
    const aStats = a.rounds.reduce(
      (acc, round) =>
        acc + (round.positionPoints || 0) + (round.killPoints || 0),
      0
    );
    const bStats = b.rounds.reduce(
      (acc, round) =>
        acc + (round.positionPoints || 0) + (round.killPoints || 0),
      0
    );
    return bStats - aStats;
  });

  const half = Math.ceil(sortedTeams.length / 2);

  return (
    <div className="grid w-full grid-cols-2 content-start items-start gap-6 px-4">
      <TeamTable
        teams={sortedTeams}
        startIndex={0}
        endIndex={half}
        settings={settings}
      />
      <TeamTable
        teams={sortedTeams}
        startIndex={half}
        endIndex={sortedTeams.length}
        settings={settings}
      />
    </div>
  );
}
