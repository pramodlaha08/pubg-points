"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

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
  initial: {
    rotate: 0,
    scale: 1,
    textShadow: "0 0 0px rgba(255, 165, 0, 0)",
  },
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

// Add fire effect component
const FireEffect = () => (
  <motion.div
    className="absolute inset-0"
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 0] }}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      repeatType: "loop",
    }}
  >
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-500/30 rounded-full blur-[10px]" />
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-6 bg-yellow-400/30 rounded-full blur-[8px]" />
  </motion.div>
);

export default function AnimatedTeamTable() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/team`
        );
        const data = response.data;

        if (data.success) {
          setTeams((prevTeams) => {
            const sortedTeams = data.data.sort(
              (a: Team, b: Team) => b.totalPoints - a.totalPoints
            );
            return sortedTeams;
          });
        }
      } catch  {
        console.error("Error fetching teams:");
      }
    };

    fetchTeams();
    const interval = setInterval(fetchTeams, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-500">
      {/* Chroma Key Green Background */}
      <div className="w-[600px] mx-auto">
        <div className="flex flex-col rounded-lg overflow-hidden">
          <div className="flex h-12 bg-gradient-to-r from-red-600 to-orange-600 text-white font-sans text-lg font-bold shadow-lg">
            <div className="w-[60px] flex items-center justify-center">
              RANK
            </div>
            <div className="flex items-center justify-start flex-1 pl-4">
              TEAM
            </div>
            <div className="flex items-center justify-center w-[120px]">
              ALIVE
            </div>
            <div className="flex items-center justify-center w-[80px]">PTS</div>
            <div className="flex items-center justify-center w-[80px]">
              ELIMS
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <AnimatePresence>
              {teams.map((team, index) => {
                const currentRound = team.rounds.find(
                  (r) => r.roundNumber === team.currentRound
                );
                const isEliminated = currentRound?.eliminationCount >= 4;

                return (
                  <motion.div
                    key={team._id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className={`flex h-14 border-b border-orange-500 transition-colors font-sans text-xl shadow-md ${
                      isEliminated
                        ? "bg-black/70 text-gray-400"
                        : "bg-gradient-to-r from-gray-900 to-gray-800 text-white"
                    }`}
                  >
                    <div className="w-[60px] flex items-center justify-center font-bold text-2xl text-[#76BAD7] relative">
                      {index === 0 ? (
                        <motion.span
                          className="relative z-10"
                          variants={trophyVariants}
                          initial="initial"
                          animate="animate"
                        >
                          🏆
                          <FireEffect />
                        </motion.span>
                      ) : (
                        `${index + 1}`
                      )}
                    </div>
                    <div className="flex items-center flex-1 space-x-4 pl-4">
                      <div className="w-10 h-10 relative flex items-center justify-center">
                        <Image
                          src={team.logo || "/placeholder.svg"}
                          alt={team.name}
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                      <span className="font-bold tracking-wider text-orange-400">
                        {team.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-center w-[120px]">
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((playerIndex) => (
                          <div
                            key={playerIndex}
                            className={`h-6 w-1.5 ${
                              currentRound?.eliminatedPlayers?.includes(
                                playerIndex
                              )
                                ? "bg-red-600"
                                : "bg-yellow-400"
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-[80px] font-bold text-yellow-400">
                      {team.totalPoints}
                    </div>
                    <div className="flex items-center justify-center w-[80px] font-bold text-red-400">
                      {currentRound?.kills || 0}
                    </div>
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
