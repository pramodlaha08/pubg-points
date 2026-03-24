"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  readonly themeColor: string;
}

interface SplitLeaderboardProps {
  readonly teams: Team[];
  readonly themeColor?: string;
}

const TeamTable = ({
  teams,
  startIndex,
  endIndex,
  themeColor,
}: TeamTableProps) => {
  const slicedTeams = teams.slice(startIndex, endIndex);

  const palette = {
    accent: themeColor,
    panelFrom: "#0b1220",
    panelTo: "#111827",
    headerFrom: "#141c2e",
    headerTo: `${themeColor}C8`,
    rowFrom: "#0f172aeb",
    rowTo: `${themeColor}70`,
    border: `${themeColor}D0`,
    borderSoft: `${themeColor}66`,
    textPrimary: "#f8fafc",
    textDim: "#94a3b8",
    placeColor: "#bae6fd",
    elimColor: "#fde68a",
    totalColor: "#f59e0b",
    statBg: "#00000052",
  };

  const getChickenCount = (team: Team) => {
    return team.rounds.filter((round) => round.position === 1).length;
  };

  const calculateTotalStats = (team: Team) => {
    return team.rounds.reduce(
      (acc, round) => {
        return {
          placePoints: acc.placePoints + (round.positionPoints || 0),
          elimPoints: acc.elimPoints + (round.killPoints || 0),
        };
      },
      { placePoints: 0, elimPoints: 0 },
    );
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border"
      style={{
        borderColor: palette.border,
        background: `linear-gradient(145deg, ${palette.panelFrom} 0%, ${palette.panelTo} 100%)`,
        boxShadow: `0 0 0 1px ${palette.borderSoft}, 0 10px 30px rgba(0,0,0,0.45)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1px, transparent 1px, transparent 6px)",
        }}
      />

      <div
        className="relative flex h-12 text-[12px] font-black uppercase tracking-[0.14em]"
        style={{
          color: palette.textPrimary,
          background: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <div className="flex w-10 items-center justify-center">Rk</div>
        <div className="flex flex-1 items-center pl-4">Team</div>
        <div className="flex w-[3.75rem] items-center justify-center">
          Place
        </div>
        <div className="flex w-[3.75rem] items-center justify-center">
          Elims
        </div>
        <div className="flex w-[3.75rem] items-center justify-center">
          Total
        </div>
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
                  delay: Math.min(index * 0.02, 0.12),
                }}
                className="relative flex h-12 text-sm"
                style={{
                  borderBottom: `1px solid ${palette.borderSoft}`,
                  background: `linear-gradient(90deg, ${palette.rowFrom} 0%, ${palette.rowTo} 100%)`,
                  boxShadow: topRankStyle
                    ? `${topRankStyle.glow}, inset 0 0 0 1px rgba(255,255,255,0.05)`
                    : undefined,
                }}
              >
                <div className="relative flex w-10 items-center justify-center">
                  {topRankStyle ? (
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-black"
                      style={{
                        color: topRankStyle.badgeText,
                        background: topRankStyle.badgeBg,
                        border: `1px solid ${topRankStyle.badgeBorder}`,
                        boxShadow: topRankStyle.glow,
                      }}
                    >
                      {actualRank}
                    </span>
                  ) : (
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-black"
                      style={{
                        color: palette.textPrimary,
                        backgroundColor: palette.statBg,
                        border: `1px solid ${palette.borderSoft}`,
                      }}
                    >
                      {actualRank}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
                  <div
                    className="relative h-8 w-8 overflow-hidden rounded-sm border"
                    style={{
                      borderColor: palette.borderSoft,
                      backgroundColor: "#0f172acc",
                    }}
                  >
                    <Image
                      src={team.logo || "/placeholder.svg"}
                      alt={team.name}
                      fill
                      className="object-contain p-[2px]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[14px] font-extrabold tracking-[0.01em] text-slate-100"
                      title={team.name}
                    >
                      {team.name.toUpperCase()}
                    </p>
                  </div>

                  {chickenCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-300/40 bg-amber-300/10 px-1.5 py-[2px] text-[11px] font-black text-amber-200">
                      <GiChickenOven className="h-4 w-4" />
                      {`x${chickenCount}`}
                    </span>
                  ) : null}
                </div>

                <div
                  className="flex w-[3.75rem] items-center justify-center text-[15px] font-black"
                  style={{
                    color: palette.placeColor,
                    backgroundColor: palette.statBg,
                    borderLeft: `1px solid ${palette.borderSoft}`,
                  }}
                >
                  {placePoints}
                </div>

                <div
                  className="flex w-[3.75rem] items-center justify-center text-[15px] font-black"
                  style={{
                    color: palette.elimColor,
                    backgroundColor: palette.statBg,
                    borderLeft: `1px solid ${palette.borderSoft}`,
                  }}
                >
                  {elimPoints}
                </div>

                <div
                  className="flex w-[3.75rem] items-center justify-center text-[15px] font-black"
                  style={{
                    color: palette.totalColor,
                    backgroundColor: palette.statBg,
                    borderLeft: `1px solid ${palette.borderSoft}`,
                  }}
                >
                  {totalPoints}
                </div>

                <div
                  className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
                  style={{
                    backgroundColor: topRankStyle
                      ? topRankStyle.edge
                      : palette.accent,
                    opacity: 0.9,
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
  themeColor = "#80171C",
}: SplitLeaderboardProps) {
  const sortedTeams = [...teams].sort((a, b) => {
    const aStats = a.rounds.reduce(
      (acc, round) =>
        acc + (round.positionPoints || 0) + (round.killPoints || 0),
      0,
    );
    const bStats = b.rounds.reduce(
      (acc, round) =>
        acc + (round.positionPoints || 0) + (round.killPoints || 0),
      0,
    );

    return bStats - aStats;
  });

  const half = Math.ceil(sortedTeams.length / 2);

  return (
    <div className="grid w-full grid-cols-2 content-start items-start gap-4">
      <TeamTable
        teams={sortedTeams}
        startIndex={0}
        endIndex={half}
        themeColor={themeColor}
      />
      <TeamTable
        teams={sortedTeams}
        startIndex={half}
        endIndex={sortedTeams.length}
        themeColor={themeColor}
      />
    </div>
  );
}
