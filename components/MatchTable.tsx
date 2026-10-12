"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Camera } from "lucide-react";
import html2canvas from "html2canvas";
import { api } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import {
  DEFAULT_POINTS_TABLE,
  hexToRgba,
  mergePointsTable,
  type PointsTableSettings,
} from "@/lib/tableSettings";

const styles = {
  screenshot: `
    .screenshot-ready {
      padding: 20px !important;
      width: 500px !important;
    }
  `,
};

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
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    },
  },
};

const PREVIEW_TEAMS: Team[] = [
  { _id: "p1", name: "TEAM ALPHA", logo: "/placeholder.svg", slot: 1, currentRound: 1, totalPoints: 16, rounds: [{ roundNumber: 1, kills: 6, killPoints: 6, position: 1, positionPoints: 10, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p2", name: "TEAM BRAVO", logo: "/placeholder.svg", slot: 2, currentRound: 1, totalPoints: 12, rounds: [{ roundNumber: 1, kills: 4, killPoints: 4, position: 2, positionPoints: 8, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p3", name: "TEAM CHARLIE", logo: "/placeholder.svg", slot: 3, currentRound: 1, totalPoints: 9, rounds: [{ roundNumber: 1, kills: 6, killPoints: 6, position: 5, positionPoints: 3, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p4", name: "TEAM DELTA", logo: "/placeholder.svg", slot: 4, currentRound: 1, totalPoints: 7, rounds: [{ roundNumber: 1, kills: 5, killPoints: 5, position: 8, positionPoints: 2, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p5", name: "TEAM ECHO", logo: "/placeholder.svg", slot: 5, currentRound: 1, totalPoints: 4, rounds: [{ roundNumber: 1, kills: 4, killPoints: 4, position: 12, positionPoints: 0, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
];

interface MatchTableProps {
  readonly matchId?: number;
  readonly previewSettings?: PointsTableSettings;
  readonly preview?: boolean;
  readonly inline?: boolean;
}

export default function MatchTable({
  matchId,
  previewSettings,
  preview = false,
  inline = false,
}: MatchTableProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const { settings: remoteSettings } = useSettings();

  const settings = useMemo<PointsTableSettings>(
    () =>
      mergePointsTable(
        previewSettings ?? remoteSettings?.pointsTable ?? DEFAULT_POINTS_TABLE
      ),
    [previewSettings, remoteSettings]
  );

  const { colors, match } = settings;
  const displayTeams = preview ? PREVIEW_TEAMS : teams;

  useEffect(() => {
    if (preview) return;
    const fetchTeams = async () => {
      try {
        const url = matchId
          ? `/team/match/${matchId}`
          : `/team`;
        const response = await api.get(url);
        const data = response.data;

        if (data.success) {
          setTeams(() => {
            return data.data.sort((a: Team, b: Team) => {
              const aRound = a.rounds[matchId ? 0 : a.currentRound - 1];
              const bRound = b.rounds[matchId ? 0 : b.currentRound - 1];

              const aPositionPoints = aRound?.positionPoints || 0;
              const bPositionPoints = bRound?.positionPoints || 0;

              const aTotal = (aRound?.kills || 0) + aPositionPoints;
              const bTotal = (bRound?.kills || 0) + bPositionPoints;

              if (bPositionPoints !== aPositionPoints) {
                return bPositionPoints - aPositionPoints;
              }
              return bTotal - aTotal;
            });
          });
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, [matchId, preview]);

  const captureScreenshot = async () => {
    if (!contentRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const element = contentRef.current;

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: colors.panelTo,
        logging: false,
        allowTaint: true,
        useCORS: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector("[data-screenshot]");
          if (clonedElement) {
            clonedElement.classList.add("screenshot-ready");
          }
        },
        x: 0,
        y: 0,
        width: element.offsetWidth,
        height: element.offsetHeight + 40,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/png",
          1.0
        );
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `HDC-PMBC-Match-${matchId || "standings"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Screenshot failed:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div
      className={inline ? "relative" : "relative min-h-screen bg-fixed bg-center"}
      style={{
        background: `linear-gradient(135deg, ${colors.panelFrom} 0%, ${colors.panelTo} 100%)`,
      }}
    >
      <style>{styles.screenshot}</style>

      {!preview ? (
        <motion.button
          onClick={captureScreenshot}
          disabled={isCapturing}
          className="fixed right-4 top-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{
            background: `linear-gradient(90deg, ${colors.headerFrom} 0%, ${colors.headerTo} 100%)`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Camera className="w-5 h-5" />
          {isCapturing ? "Capturing..." : "Screenshot"}
        </motion.button>
      ) : null}

      <div
        ref={contentRef}
        data-screenshot
        className="relative w-[500px] mx-auto px-4 py-8"
      >
        <div className="text-center mb-12 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative inline-flex items-center gap-3"
          >
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight"
              style={{ color: colors.accent }}
            >
              PUBG Mobile{" "}
              <span style={{ color: colors.warning }}>Campus League</span>
            </h1>
          </motion.div>

          <div className="flex justify-center mt-8">
            <div
              className="w-24 h-1"
              style={{
                background: `linear-gradient(90deg, ${colors.headerFrom} 0%, ${colors.headerTo} 100%)`,
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-4"
          >
            <Flame className="w-5 h-5" style={{ color: colors.warning }} />
            <h2
              className="text-2xl -mt-5 font-semibold"
              style={{ color: colors.textPrimary, opacity: 0.75 }}
            >
              Match {matchId}
            </h2>
            <Flame className="w-5 h-5" style={{ color: colors.warning }} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[450px] mx-auto relative"
        >
          <div
            className="absolute inset-0 blur-xl"
            style={{
              background: `linear-gradient(90deg, ${hexToRgba(
                colors.headerFrom,
                0.2
              )} 0%, ${hexToRgba(colors.headerTo, 0.2)} 100%)`,
            }}
          />
          <div className="relative">
            <div
              className="flex flex-col rounded-lg overflow-hidden border-2"
              style={{ borderColor: colors.border }}
            >
              <div
                className="flex h-[3.5rem] font-sans text-sm font-bold border-b-2"
                style={{
                  color: "#FFFFFF",
                  borderColor: colors.border,
                  background: `linear-gradient(90deg, ${colors.headerFrom} 0%, ${colors.headerTo} 100%)`,
                }}
              >
                {match.showRank ? (
                  <div className="w-[50px] flex items-center justify-center">
                    #
                  </div>
                ) : null}
                <div className="w-[150px] flex items-center justify-start pl-2">
                  TEAM
                </div>
                {match.showElims ? (
                  <div
                    className="w-[80px] flex items-center justify-center"
                    style={{ color: colors.textPrimary }}
                  >
                    ELIMS
                  </div>
                ) : null}
                {match.showPlace ? (
                  <div
                    className="w-[80px] flex items-center justify-center"
                    style={{ color: colors.textPrimary }}
                  >
                    PLACE PTS
                  </div>
                ) : null}
                {match.showTotal ? (
                  <div
                    className="w-[80px] flex items-center justify-center"
                    style={{ color: colors.warning }}
                  >
                    TOTAL
                  </div>
                ) : null}
              </div>
              <div>
                <AnimatePresence>
                  {displayTeams.map((team, index) => {
                    const currentRoundStats = team.rounds[
                      matchId ? 0 : team.currentRound - 1
                    ] || {
                      kills: 0,
                      positionPoints: 0,
                    };
                    const totalPoints =
                      currentRoundStats.kills +
                      currentRoundStats.positionPoints;

                    return (
                      <motion.div
                        key={team._id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 15,
                        }}
                        className="flex h-12 font-sans text-sm border-b"
                        style={{
                          color: "#FFFFFF",
                          background: `linear-gradient(90deg, ${colors.teamFrom} 0%, ${colors.teamTo} 100%)`,
                          borderColor: hexToRgba(colors.border, 0.3),
                        }}
                      >
                        {match.showRank ? (
                          <div
                            className="w-[50px] flex items-center justify-center font-bold"
                            style={{ color: "#FFFFFF" }}
                          >
                            {index === 0 ? (
                              <motion.span
                                className="relative z-10"
                                variants={trophyVariants}
                                initial="initial"
                                animate="animate"
                              >
                                🏆
                              </motion.span>
                            ) : (
                              `#${index + 1}`
                            )}
                          </div>
                        ) : null}
                        <div className="w-[150px] flex items-center space-x-2 pl-2">
                          {match.showLogo ? (
                            <div
                              className="w-8 h-8 relative flex items-center justify-center rounded-full p-1"
                              style={{ background: colors.rankFrom }}
                            >
                              <Image
                                src={team.logo || "/placeholder.svg"}
                                alt={team.name}
                                width={28}
                                height={28}
                                className="object-contain rounded-full"
                              />
                            </div>
                          ) : null}
                          <div className="font-bold h-full pt-[0.65rem] tracking-wider truncate">
                            {team.name.toUpperCase()}
                          </div>
                        </div>
                        {match.showElims ? (
                          <div
                            className="w-[80px] flex items-center justify-center font-bold"
                            style={{
                              color: colors.elimColor,
                              backgroundColor: colors.cellBg,
                            }}
                          >
                            {currentRoundStats.kills || 0}
                          </div>
                        ) : null}
                        {match.showPlace ? (
                          <div
                            className="w-[80px] flex items-center justify-center font-bold"
                            style={{
                              color: colors.placeColor,
                              backgroundColor: colors.cellBg,
                            }}
                          >
                            {currentRoundStats.positionPoints || 0}
                          </div>
                        ) : null}
                        {match.showTotal ? (
                          <div
                            className="w-[80px] flex items-center justify-center font-bold"
                            style={{
                              color: colors.totalColor,
                              backgroundColor: colors.cellBg,
                            }}
                          >
                            {totalPoints}
                          </div>
                        ) : null}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
