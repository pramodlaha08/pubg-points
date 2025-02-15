"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";

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

export default function TeamTable() {
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
      } catch (error) {
        console.error("Error fetching teams:", error.message);
      }
    };
    fetchTeams();
    const interval = setInterval(fetchTeams, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-[600px] mx-auto">
        <div className="flex flex-col rounded-lg overflow-hidden">
          <div className="flex h-12 bg-blue-900 text-white font-sans text-lg font-bold">
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
          <div className="flex-1">
            {teams.map((team, index) => {
              // Get the latest round data
              const currentRound = team.rounds.find(
                (r) => r.roundNumber === team.currentRound
              );

              const isEliminated = currentRound?.eliminationCount >= 4;

              return (
                <div
                  key={team._id}
                  className={`flex h-14 border-b border-blue-700 ${
                    isEliminated
                      ? "bg-blue-800/30 text-white/50"
                      : "bg-blue-800/50 text-white"
                  } font-sans text-xl hover:bg-blue-700/50 transition-colors`}
                >
                  <div className="w-[60px] flex items-center justify-center font-bold text-2xl">
                    {index + 1}
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
                    <span className="font-bold tracking-wider">
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
                              ? "bg-red-500"
                              : "bg-white"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-[80px] font-bold">
                    {team.totalPoints}
                  </div>
                  <div className="flex items-center justify-center w-[80px] font-bold">
                    {currentRound?.kills || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
