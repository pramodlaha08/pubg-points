"use client"
import SplitLeaderboard from "@/components/Leaderboard"
import axios from "axios"
import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
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

export default function LeaderboardPage() {
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

  // Get first-place team
  const firstTeam = teams.length > 0 ? teams[0] : null;
  const currentRound = firstTeam?.rounds[firstTeam.currentRound - 1] || null;

  return (
    <main className="min-h-screen w-full bg-[#0d1117]">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <div className="absolute inset-0 flex flex-col">
          <div className="flex justify-between items-center p-3">
            <div className="flex flex-col space-y-3">
              <h1 className="bg-gradient-to-r from-[#07559D] to-[#E76F00] bg-clip-text text-transparent text-2xl font-black uppercase">Match Rankings</h1>
              <div className="flex items-center space-x-8 bg-gradient-to-r from-[#07559D] to-[#E76F00] w-36 px-2 py-[0.15rem]">
                <p className="text-[#FEC810] text-lg pr-6 border-r">Match</p>
                <p className="text-lg ">{firstTeam?.currentRound}/6</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#07559D] to-[#E76F00] bg-clip-text text-transparent text-2xl font-black text-right">
              <p>PUBG Mobile </p>
              <p>Biratnagar Championship</p>
            </div>
          </div>

          {/*  TOP 1 TEAM HIGHLIGHT  */}
          <div className="flex-1 p-6">
            {firstTeam && currentRound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full rounded-lg border border-yellow-400/40 bg-gradient-to-b from-[#1a1f2d]/90 to-[#2a3142]/90 shadow-lg p-6 text-white"
              >
                <div className="flex items-center space-x-6">
                  {/* Team Logo */}
                  <div className="relative w-24 h-24">
                    <Image
                      src={firstTeam.logo || "/placeholder.svg"}
                      alt={firstTeam.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Team Details */}
                  <div className="flex-1">
                    <h2 className="text-4xl font-extrabold text-yellow-400 uppercase tracking-wider">
                      {firstTeam.name}
                    </h2>
                    <p className="text-lg text-gray-300">Total Points: <span className="text-white font-bold">{firstTeam.totalPoints}</span></p>
                    <p className="text-lg  capitalize font-bold text-yellow-400 flex gap-4 items-center">Winner winner chicken dinner <GiChickenOven size="2rem" /> </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-6 flex justify-between items-center bg-[#2a3142]/60 rounded-lg p-4 border border-yellow-500/30 shadow-md">
                  <div className="text-center">
                    <p className="text-lg text-gray-400">Rank</p>
                    {/* <p className="text-2xl font-bold text-yellow-400">#{currentRound.position}</p> */}
                    <p className="text-2xl font-bold text-yellow-400"><GiChickenOven size="2rem" /></p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg text-gray-400">Place Points</p>
                    <p className="text-2xl font-bold text-red-400">{currentRound.positionPoints}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg text-gray-400">Elims Points</p>
                    <p className="text-2xl font-bold text-orange-400">{currentRound.kills}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg text-gray-400">Total Points</p>
                    <p className="text-2xl font-bold text-green-400">{currentRound.positionPoints + currentRound.killPoints}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* BOTTOM SECTION: LEADERBOARD */}
          <div className="p-6">
            <SplitLeaderboard teams={teams} />
          </div>
        </div>
      </div>
    </main>
  )
}
