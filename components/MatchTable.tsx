"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Camera } from "lucide-react";
import html2canvas from "html2canvas";

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

interface MatchTableProps {
  readonly matchId?: number;
}

export default function MatchTable({ matchId }: MatchTableProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const url = matchId
          ? `${process.env.NEXT_PUBLIC_API_URL}/team/match/${matchId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/team`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.success) {
          setTeams(() => {
            return data.data.sort((a: Team, b: Team) => {
              const aRound = a.rounds[matchId ? 0 : a.currentRound - 1];
              const bRound = b.rounds[matchId ? 0 : b.currentRound - 1];
              const aTotal =
                (aRound?.kills || 0) + (aRound?.positionPoints || 0);
              const bTotal =
                (bRound?.kills || 0) + (bRound?.positionPoints || 0);
              return bTotal - aTotal;
            });
          });
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
    const interval = setInterval(fetchTeams, 2000);
    return () => clearInterval(interval);
  }, [matchId]);

  const getRowBackground = (index: number) => {
    if (index === 0) return "bg-gradient-to-r from-[#C19A6B] to-[#CD7F32]";
    if (index === 1) return "bg-gradient-to-r from-[#C0C0C0] to-[#A9A9A9]";
    return "bg-gradient-to-r from-[#1a2634] to-[#2c3e50]";
  };

  const captureScreenshot = async () => {
    if (!contentRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const element = contentRef.current;

      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        backgroundColor: "#0a0e17",
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
        height: element.offsetHeight + 40, // Small padding at bottom
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/png",
          1.0
        );
      });

      // Create download link
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
    <div className="relative min-h-screen bg-[#0a0e17] bg-[url('/grid.svg')] bg-fixed bg-center">
      <style>{styles.screenshot}</style>

      {/* Screenshot Button */}
      <motion.button
        onClick={captureScreenshot}
        disabled={isCapturing}
        className="fixed right-4 top-4 z-50 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#07559D] to-[#E76F00] rounded-lg text-white font-semibold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Camera className="w-5 h-5" />
        {isCapturing ? "Capturing..." : "Screenshot"}
      </motion.button>

      <div
        ref={contentRef}
        data-screenshot
        className="relative w-[500px] mx-auto px-4 py-8"
      >
        <div className="text-center mb-12 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative inline-block"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-tight">
              HDC PMBC
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-[#07559D] to-[#E76F00]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-4"
          >
            <Flame className="w-5 h-5 text-[#E76F00]" />
            <h2 className="text-2xl font-semibold text-gray-300">
              Match {matchId}
            </h2>
            <Flame className="w-5 h-5 text-[#E76F00]" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[450px] mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#07559D]/20 to-[#E76F00]/20 blur-xl" />
          <div className="relative">
            <div className="flex flex-col rounded-lg overflow-hidden border-2 border-[#2c3e50]">
              <div className="flex h-[2.5rem] bg-gradient-to-r from-[#1a2634] to-[#2c3e50] text-white font-sans text-sm font-bold border-b-2 border-[#2c3e50]">
                <div className="w-[50px] flex items-center justify-center text-[#07559D]">
                  #
                </div>
                <div className="w-[150px] flex items-center justify-start pl-2">
                  TEAM
                </div>
                <div className="w-[80px] flex items-center justify-center text-gray-200">
                  ELIMS
                </div>
                <div className="w-[80px] flex items-center justify-center text-gray-200">
                  PLACE PTS
                </div>
                <div className="w-[80px] flex items-center justify-center text-[#E76F00]">
                  TOTAL
                </div>
              </div>
              <div>
                <AnimatePresence>
                  {teams.map((team, index) => {
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
                        className={`flex h-12 ${getRowBackground(
                          index
                        )} text-white font-sans text-sm border-b border-[#2c3e50]/30`}
                      >
                        <div className="w-[50px] flex items-center justify-center font-bold text-[#07559D]">
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
                        <div className="w-[150px] flex items-center space-x-2 pl-2">
                          <div className="w-8 h-8 relative flex items-center justify-center bg-[#34495e] rounded-full p-1">
                            <Image
                              src={team.logo || "/placeholder.svg"}
                              alt={team.name}
                              width={28}
                              height={28}
                              className="object-contain rounded-full"
                            />
                          </div>
                          <span className="font-bold tracking-wider truncate">
                            {team.name.toUpperCase()}
                          </span>
                        </div>
                        <div className="w-[80px] flex items-center justify-center font-bold text-gray-200">
                          {currentRoundStats.kills || 0}
                        </div>
                        <div className="w-[80px] flex items-center justify-center font-bold text-gray-200">
                          {currentRoundStats.positionPoints || 0}
                        </div>
                        <div className="w-[80px] flex items-center justify-center font-bold text-gray-200">
                          {totalPoints}
                        </div>
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
