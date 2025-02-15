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
      } catch (error) {
        console.error("Error fetching teams:", error.message);
      }
    };

    fetchTeams();
    const interval = setInterval(fetchTeams, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-opacity-90 bg-cover bg-center bg-blend-overlay">
      <div className="w-[700px] mx-auto">
        <div className="flex flex-col rounded-lg overflow-hidden border-2 border-[#FBBF24] shadow-lg shadow-[#ffd700]/20">
          <div className="flex h-14 bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-[#FBBF24] font-sans text-lg font-bold">
            <div className="w-[70px] flex items-center justify-center">
              RANK
            </div>
            <div className="flex items-center justify-start flex-1 pl-4">
              TEAM
            </div>
            <div className="flex items-center justify-center w-[140px]">
              ALIVE
            </div>
            <div className="flex items-center justify-center w-[90px]">PTS</div>
            <div className="flex items-center justify-center w-[90px]">
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
                    className={`flex h-16 border-b border-[#ffd700]/30 ${
                      isEliminated
                        ? "bg-[#2c3e50]/70 text-[#ffd600]/60"
                        : "bg-[#2c3e50]/90 text-[#FBBF24]"
                    } font-sans text-xl hover:bg-[#34495e]/90 transition-all duration-300 ease-in-out`}
                  >
                    <div className="w-[70px] flex items-center justify-center font-bold text-2xl">
                      {index + 1}
                    </div>
                    <div className="flex items-center flex-1 space-x-4 pl-4">
                      <div className="w-12 h-12 relative flex items-center justify-center bg-[#34495e] rounded-full p-1">
                        <Image
                          src={team.logo || "/placeholder.svg"}
                          alt={team.name}
                          width={40}
                          height={40}
                          className="object-contain rounded-full"
                        />
                      </div>
                      <span className="font-bold tracking-wider">
                        {team.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-center w-[140px]">
                      <div className="flex gap-2">
                        {[0, 1, 2, 3].map((playerIndex) => (
                          <div
                            key={playerIndex}
                            className={`h-8 w-2 ${
                              currentRound?.eliminatedPlayers?.includes(
                                playerIndex
                              )
                                ? "bg-red-600"
                                : "bg-gray-200"
                            } rounded-sm transition-all duration-300 ease-in-out`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-[90px] font-bold">
                      {team.totalPoints}
                    </div>
                    <div className="flex items-center justify-center w-[90px] font-bold">
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
