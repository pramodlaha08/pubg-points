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
      "0 0 0px rgba(255, 165, 0, 0)"
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

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
          setTeams(
            data.data.sort((a: Team, b: Team) => b.totalPoints - a.totalPoints)
          );
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-[360px] mx-auto">
        <div className="flex flex-col rounded-lg overflow-hidden">
          <div className="flex h-10 bg-gradient-to-r from-[#044378] to-[#0A6EC1] text-gray-200 text-sm font-bold shadow-lg">
            <div className="w-10 flex items-center justify-center pl-3">RANK</div>
            <div className="flex-1 flex items-center justify-start pl-5">TEAM</div>
            <div className="w-16 flex items-center justify-center">ALIVE</div>
            <div className="w-12 flex items-center justify-center">PTS</div>
            <div className="w-12 flex items-center justify-center pr-2">ELIMS</div>
          </div>
          <div className="flex-1 overflow-hidden">
            <AnimatePresence>
              {teams.map((team, index) => {
                const currentRound = team.rounds.find(
                  (r) => r.roundNumber === team.currentRound
                );
                const isEliminated = (currentRound?.eliminationCount ?? 0) >= 4;

                return (
                  <motion.div
                    key={team._id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className={`flex h-10 border-b border-[#F36F21] text-sm shadow-md ${
                      isEliminated
                        ? "bg-[#b840408f] text-gray-900"
                        : "bg-gradient-to-r from-[#111827cf] to-[#1f2937cf] text-white"
                    }`}
                  >
                    <div className="w-10 flex items-center justify-center font-bold text-lg text-[#76BAD7] relative">
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
                        `${index + 1}`
                      )}
                    </div>
                    <div className="flex-1 flex items-center space-x-2 pl-2">
                      <Image
                        src={team.logo || "/placeholder.svg"}
                        alt={team.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span
                        className={`${
                          isEliminated ? "text-gray-400" : "text-gray-200 font-bold"
                        }`}
                      >
                        {team.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="w-16 flex items-center justify-center">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((playerIndex) => (
                          <div
                            key={playerIndex}
                            className={`h-4 w-1 ${
                              currentRound?.eliminatedPlayers?.includes(
                                playerIndex
                              )
                                ? "bg-red-600"
                                : "bg-[#76BAD7]"
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`w-12 flex items-center justify-center font-bold ${
                        isEliminated ? "text-slate-950" : "text-gray-200"
                      }`}
                    >
                      {team.totalPoints}
                    </div>
                    <div
                      className={`w-12 flex items-center justify-center font-bold   ${
                        isEliminated ? "text-slate-950" : "text-[#F36F21]"
                      }`}
                    >
                      {currentRound?.kills ?? 0}
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
