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

export default function RoundTeamTable() {
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
            const sortedTeams = data.data.sort((a: Team, b: Team) => {
              const aRound = a.rounds[a.currentRound - 1];
              const bRound = b.rounds[b.currentRound - 1];
              const aTotal =
                (aRound?.kills || 0) + (aRound?.positionPoints || 0);
              const bTotal =
                (bRound?.kills || 0) + (bRound?.positionPoints || 0);
              return bTotal - aTotal;
            });
            return sortedTeams;
          });
        }
      } catch {
        console.error("Error fetching teams:");
      }
    };

    fetchTeams();
    const interval = setInterval(fetchTeams, 2000);
    return () => clearInterval(interval);
  }, []);

  const getRowBackground = (index: number) => {
    if (index === 0) return "bg-gradient-to-r from-[#C19A6B] to-[#CD7F32]";
    if (index === 1) return "bg-gradient-to-r from-[#C0C0C0] to-[#A9A9A9]";
    return "bg-gradient-to-r from-[#1a2634] to-[#2c3e50]";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a1520]">
      <div className="w-[800px] mx-auto">
        <div className="flex flex-col rounded-lg overflow-hidden border-2 border-[#2c3e50]">
          <div className="flex h-14 bg-gradient-to-r from-[#1a2634] to-[#2c3e50] text-white font-sans text-lg font-bold border-b-2 border-[#2c3e50]">
            <div className="w-[70px] flex items-center justify-center text-gray-200">
              #
            </div>
            <div className="flex items-center justify-start flex-1 pl-4">
              TEAM
            </div>
            <div className="flex items-center justify-center w-[100px] text-gray-200">
              ELIMS
            </div>
            <div className="flex items-center text-center justify-center w-[100px] text-gray-200">
              PLACE PTS
            </div>
            <div className="flex items-center justify-center w-[100px] text-gray-200">
              TOTAL
            </div>
          </div>
          <div className="flex-1">
            <AnimatePresence>
              {teams.map((team, index) => {
                const currentRoundStats = team.rounds[
                  team.currentRound - 1
                ] || {
                  kills: 0,
                  positionPoints: 0,
                };
                const totalPoints =
                  (currentRoundStats.kills || 0) +
                  (currentRoundStats.positionPoints || 0);

                return (
                  <motion.div
                    key={team._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className={`flex h-16 ${getRowBackground(
                      index
                    )} text-white font-sans text-xl transition-all duration-300 ease-in-out border-b border-[#2c3e50]/30`}
                  >
                    <div className="w-[70px] flex items-center justify-center font-bold text-xl text-gray-200">
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
                    <div className="flex items-center flex-1 space-x-4 pl-4">
                      <div className="w-10 h-10 relative flex items-center justify-center bg-[#34495e] rounded-full p-1">
                        <Image
                          src={team.logo || "/placeholder.svg"}
                          alt={team.name}
                          width={32}
                          height={32}
                          className="object-contain rounded-full"
                        />
                      </div>
                      <span className="font-bold tracking-wider">
                        {team.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-center w-[100px] font-bold text-gray-200">
                      {currentRoundStats.kills || 0}
                    </div>
                    <div className="flex items-center justify-center w-[100px] font-bold text-gray-200">
                      {currentRoundStats.positionPoints || 0}
                    </div>
                    <div className="flex items-center justify-center w-[100px] font-bold text-gray-200">
                      {totalPoints}
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
