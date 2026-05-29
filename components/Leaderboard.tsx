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
  readonly themeColor?: string;
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
    // Professional bright esports blue theme matching page
    accent: themeColor || "#001FFF",
    panelFrom: "#F5F8FF",
    panelTo: "#EAF2FF",
    panelEdge: "#D9E6FF",
    headerFrom: "rgb(0,31,255)", // bright blue
    headerTo: "rgb(90,150,230)", // light blue
    headerTextDim: "#EFF6FF",
    rowFrom: "#FFFFFF",
    rowTo: "#F4F9FF",
    border: "#93C5FD", // blue-300
    borderSoft: "#BFDBFE", // blue-200
    rankFrom: "rgb(0,31,255)",
    rankTo: "rgb(90,150,230)",
    teamFrom: "rgb(0,31,255)",
    teamTo: "rgb(90,150,230)",
    statsFrom: "#FFFFFF",
    statsTo: "#F8FBFF",
    textPrimary: "#0F172A",
    textDim: "#334155",
    statBg: "#FFF",
    placeColor: "#2563EB", // blue-600
    elimColor: "#D97706", // amber-600
    totalColor: "#0F172A", // slate-900
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
      className="relative w-full overflow-hidden rounded-xl border shadow-2xl"
      style={{
        borderColor: palette.border,
        background: `linear-gradient(140deg, ${palette.panelFrom} 0%, ${palette.panelTo} 100%)`,
        boxShadow: `0 0 0 1px ${palette.borderSoft}, 0 16px 36px rgba(0,0,0,0.25)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.7) 1px, transparent 1px, transparent 6px)",
        }}
      />

      <div
        className="relative flex h-10 text-xs font-bold uppercase tracking-wide shadow-lg"
        style={{
          color: palette.textPrimary,
          background: `linear-gradient(90deg, ${palette.headerFrom} 0%, ${palette.headerTo} 50%, ${palette.headerFrom} 100%)`,
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
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
        <div className="flex w-14 items-center justify-center text-white">
          PLACE
        </div>
        <div className="flex w-14 items-center justify-center text-white">
          ELIMS
        </div>
        <div className="flex w-14 items-center justify-center pr-1 text-white">
          TOTAL
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
                  delay: Math.min(index * 0.015, 0.12),
                }}
                className="relative flex h-10 text-xs shadow-md text-slate-900"
                style={{
                  borderBottom: `1px solid ${palette.borderSoft}`,
                  background: "transparent",
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
                      }}
                    >
                      {actualRank}
                    </span>
                  ) : (
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black shadow-sm"
                      style={{
                        color: "#FFFFFF",
                        backgroundColor: "transparent",
                        border: "none",
                      }}
                    >
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
                  <Image
                    src={team.logo || "/placeholder.svg"}
                    alt={team.name}
                    width={22}
                    height={22}
                    className="object-contain rounded-sm"
                  />

                  <div className="min-w-0 flex-1 flex items-center pr-2">
                    <span
                      className="truncate font-extrabold tracking-[0.02em] text-white"
                      title={team.name}
                    >
                      {team.name.toUpperCase()}
                    </span>

                    {chickenCount > 0 ? (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-[#EAB308] px-1 py-0.5 text-[9px] font-black text-white shadow-sm border border-yellow-400">
                        <GiChickenOven className="h-3 w-3" />
                        {`x${chickenCount}`}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div
                  className="relative z-10 flex w-14 items-center justify-center font-black"
                  style={{
                    color: palette.placeColor,
                    backgroundColor: palette.statsFrom,
                    borderLeft: `1px solid ${palette.borderSoft}`,
                  }}
                >
                  {placePoints}
                </div>

                <div
                  className="relative z-10 flex w-14 items-center justify-center font-black"
                  style={{
                    color: palette.elimColor,
                    backgroundColor: palette.statsFrom,
                    borderLeft: `1px solid ${palette.borderSoft}`,
                  }}
                >
                  {elimPoints}
                </div>

                <div
                  className="relative z-10 flex w-14 items-center justify-center font-black"
                  style={{
                    color: palette.totalColor,
                    backgroundColor: palette.statsFrom,
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
                    opacity: 0.95,
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
  themeColor,
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
    <div className="grid w-full grid-cols-2 content-start items-start gap-6 px-4">
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
