"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { GiDeathSkull, GiCrossedSabres } from "react-icons/gi";

interface Team {
  _id: string;
  name: string;
  slot: number;
  logo: string;
  currentRound: number;
  totalPoints: number;
  rounds: Array<{
    roundNumber: number;
    kills: number;
    killPoints: number;
    position: number;
    positionPoints: number;
    eliminationCount: number;
    eliminatedPlayers: number[];
    status: string;
  }>;
  isEliminated: boolean;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/team`
      );
      setTeams(response.data.data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []); // Removed fetchTeams from dependencies

  const updateKills = async (teamId: string, action: "add" | "decrease") => {
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/team/${teamId}/${action}-kill`;
      await axios.post(endpoint);
      fetchTeams();
    } catch (error) {
      console.error(`Error ${action}ing kills:`, error);
    }
  };

  const handleElimination = async (teamId: string, playerIndex: number) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/team/${teamId}/elimination`,
        { playerIndex }
      );
      fetchTeams();
    } catch (error) {
      console.error("Error updating elimination:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-red-500 mb-8 flex items-center gap-3">
          <GiCrossedSabres className="text-4xl sm:text-5xl animate-pulse" />
          Team Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {teams.map((team) => {
            const currentRound = team.rounds.find(
              (r) => r.roundNumber === team.currentRound
            );

            return (
              <div
                key={team._id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-red-500/30 hover:border-red-500/50 transition-all duration-300 shadow-2xl hover:shadow-red-500/20 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                      <GiDeathSkull className="text-3xl" />
                      {team.name}
                    </h2>
                    <p className="text-gray-400 text-sm">Slot #{team.slot}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-500">
                      {team.totalPoints}
                    </p>
                    <p className="text-sm text-gray-400">Total Points</p>
                  </div>
                </div>

                {/* Player Elimination and Kill Counter */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-6">
                  <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                    {[0, 1, 2, 3].map((playerIndex) => (
                      <button
                        key={playerIndex}
                        onClick={() => handleElimination(team._id, playerIndex)}
                        className={`w-full h-12 sm:w-16 sm:h-16 rounded-xl transition-all duration-200 flex items-center justify-center text-sm text-white font-bold ${
                          currentRound?.eliminatedPlayers?.includes(playerIndex)
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        P{playerIndex + 1}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center sm:flex-col gap-1">
                    <button
                      onClick={() => updateKills(team._id, "decrease")}
                      className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl text-white text-xl font-bold shadow-md transition-all duration-200"
                    >
                      -
                    </button>
                    <span className="text-3xl font-bold text-white w-16 text-center">
                      {currentRound?.kills || 0}
                    </span>
                    <button
                      onClick={() => updateKills(team._id, "add")}
                      className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-white text-xl font-bold shadow-md transition-all duration-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Round Info */}
                <div className="mt-6 pt-4 border-t border-red-500/20">
                  <div className="flex justify-between text-sm">
                    <div className="text-gray-400">
                      <p>Current Round: {team.currentRound}</p>
                      <p>
                        Eliminations: {currentRound?.eliminationCount || 0}/4
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400">
                        +{currentRound?.killPoints || 0} KP
                      </p>
                      <p className="text-blue-400">
                        +{currentRound?.positionPoints || 0} PP
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
