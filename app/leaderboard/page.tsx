"use client";
import SplitLeaderboard from "@/components/Leaderboard";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
          const sortedTeams = data.data.sort((a: Team, b: Team) => {
            const aTotal = a.rounds.reduce(
              (acc, round) =>
                acc + (round.positionPoints || 0) + (round.killPoints || 0),
              0
            );
            const bTotal = b.rounds.reduce(
              (acc, round) =>
                acc + (round.positionPoints || 0) + (round.killPoints || 0),
              0
            );
            return bTotal - aTotal;
          });
          setTeams(sortedTeams);
        }
      } catch {
        console.error("Error fetching teams:");
      }
    };

    fetchTeams();
    const interval = setInterval(fetchTeams, 100000);
    return () => clearInterval(interval);
  }, []);

  const firstTeam = teams.length > 0 ? teams[0] : null;
  const totalStats = firstTeam
    ? firstTeam.rounds.reduce(
        (acc, round) => ({
          placePoints: acc.placePoints + (round.positionPoints || 0),
          killPoints: acc.killPoints + (round.killPoints || 0),
          chickenCount: acc.chickenCount + (round.position === 1 ? 1 : 0),
        }),
        { placePoints: 0, killPoints: 0, chickenCount: 0 }
      )
    : null;

  return (
    <main className="min-h-screen w-full bg-green-600 relative overflow-hidden">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <div className="absolute inset-0 flex flex-col">
          {/* Header Section */}
          <div className="flex justify-between items-center p-3 relative z-10">
            <div className="flex flex-col space-y-3">
              <h1 className="text-[#ff6b00] text-2xl font-black uppercase">
                Match Rankings
              </h1>
              <div className="relative bg-gradient-to-r from-[#00a8ff] to-[#ff6b00] p-0.5 rounded-lg group">
                <div className="bg-[#243042] flex items-center space-x-8 w-32 rounded-md px-2 py-[0.15rem] font-bold shadow-lg">
                  <p className="text-[#ffd700] text-lg text-center px-6">
                    Match
                  </p>
                  <p className="text-lg text-[#fff] pl-8 font-bold">
                    {firstTeam?.currentRound}/6
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#00a8ff] to-[#ff6b00] opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-lg" />
              </div>
            </div>
            <div className="text-[#ff6b00] text-2xl font-black text-right">
              <p>PUBG Mobile</p>
              <p>Biratnagar Championship</p>
            </div>
          </div>
          {/* Top 1 Team Highlight */}
          <div className="flex-1 p-6 relative z-10">
            {firstTeam && totalStats && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full h-full rounded-lg bg-[#243042] border-2 border-[#ffd700]/20 shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#00a8ff20] to-[#ff6b0020] opacity-30 rounded-lg" />
                <div className="relative z-20 p-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative w-24 h-24 border-2 border-[#ffd700] rounded-full glow-gold overflow-hidden bg-[#1a2234]/80">
                      <Image
                        src={firstTeam.logo || "/placeholder.svg"}
                        alt={firstTeam.name}
                        fill
                        className="object-contain p-2 rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-4xl font-extrabold text-transparent bg-gradient-to-r from-[#ffd700] to-[#ff6b00] bg-clip-text uppercase tracking-wider animate-text-gradient">
                          {firstTeam.name}
                        </h2>
                        {totalStats.chickenCount > 0 && (
                          <div className="flex items-center gap-1">
                            <GiChickenOven className="h-6 w-6 text-[#ffd700]" />
                            {totalStats.chickenCount > 1 && (
                              <span className="text-[#ffd700] font-bold">
                                x{totalStats.chickenCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-lg text-gray-300 mt-2">
                        Total Points:{" "}
                        <span className="text-[#00a8ff] font-bold glow-text">
                          {totalStats.placePoints + totalStats.killPoints}
                        </span>
                      </p>
                      <p className="text-lg font-bold text-transparent bg-gradient-to-r from-[#ffd700] to-[#ff6b00] bg-clip-text flex gap-4 items-center mt-2 capitalize">
                        The King of the Arena! 👑🔥
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 relative bg-[#1a2234] rounded-lg p-4 border border-[#ffd700]/20 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00a8ff20] to-[#ff6b0020] rounded-lg" />
                    <div className="relative z-10 flex justify-between items-center">
                      {[
                        {
                          label: "Rank",
                          value: "#1",
                          color: "text-[#ffd700]",
                        },
                        {
                          label: "Place Points",
                          value: totalStats.placePoints,
                          color: "text-[#00a8ff]",
                        },
                        {
                          label: "Elims Points",
                          value: totalStats.killPoints,
                          color: "text-[#ff6b00]",
                        },
                        {
                          label: "Total Points",
                          value: totalStats.placePoints + totalStats.killPoints,
                          color: "text-[#ffd700]",
                        },
                      ].map((item, index) => (
                        <div key={index} className="text-center">
                          <p className="text-sm text-gray-400">{item.label}</p>
                          <p
                            className={`text-2xl font-bold ${item.color} glow-text`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-full aspect-[3/4] z-0">
                  <div className="relative w-full h-full">
                    {/* Base gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#24304285] to-transparent z-10" />

                    {/* Tactical energy glow effect */}
                    <div className="absolute -inset-2 energy-glow rounded-lg z-20" />

                    {/* Dynamic highlight effects */}
                    <div className="absolute inset-0 character-highlight">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#00a8ff40] via-[#ffd70040] to-[#ff6b0040] animate-tactical-pulse" />
                    </div>

                    {/* Character image with professional animation */}
                    <div className="relative h-full w-full animate-float-pro">
                      <Image
                        src="/character.png"
                        alt="PUBG Character"
                        fill
                        className="object-contain object-right mix-blend-plus-darker"
                        priority
                      />

                      {/* Intensity overlays */}
                      <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#00a8ff20] via-transparent to-[#ff6b0020] mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#ffd70010] to-[#243042] opacity-70" />
                      </div>

                      {/* Strategic highlight lines */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-[#00a8ff50] to-transparent top-1/4 -translate-y-1/2 animate-tactical-pulse" />
                        <div
                          className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-[#ffd70050] to-transparent top-2/4 -translate-y-1/2 animate-tactical-pulse"
                          style={{ animationDelay: "-1.5s" }}
                        />
                        <div
                          className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-[#ff6b0050] to-transparent top-3/4 -translate-y-1/2 animate-tactical-pulse"
                          style={{ animationDelay: "-3s" }}
                        />
                      </div>
                    </div>

                    {/* Ambient effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#243042] opacity-50" />

                    {/* Edge highlight */}
                    <div className="absolute -right-2 inset-y-0 w-1 bg-gradient-to-b from-transparent via-[#ffd70030] to-transparent animate-tactical-pulse" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          {/* Bottom Section: Leaderboard */}
          <div className="p-6 relative z-10 space-y-2">
            <div className="text-lg text-center font-bold text-transparent bg-gradient-to-r from-[#ffd700] to-[#ff6b00] bg-clip-text -mt-[5px]">
              Top 8 Guns of the Arena! 
            </div>
            <SplitLeaderboard teams={teams} />
          </div>
        </div>
      </div>
    </main>
  );
}
