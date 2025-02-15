"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { GiDeathSkull, GiCrossedSabres, GiShotgun } from "react-icons/gi";

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
  const [killValues, setKillValues] = useState<{ [key: string]: string }>({});

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
    // Initial fetch
    fetchTeams();
  }, []); // Only fetch data once when the component mounts

  const handleKillUpdate = async (teamId: string) => {
    const kills = Number.parseInt(killValues[teamId] || "0");
    if (isNaN(kills)) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/team/${teamId}/kills`,
        { kills }
      );
      setKillValues((prev) => ({ ...prev, [teamId]: "" }));
      await fetchTeams(); // Refresh data after updating kills
    } catch (error) {
      console.error("Error updating kills:", error);
    }
  };

  const handleElimination = async (teamId: string, playerIndex: number) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/team/${teamId}/elimination`,
        { playerIndex }
      );
      await fetchTeams(); // Refresh data after updating eliminations
    } catch (error) {
      console.error("Error updating elimination:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-red-500 mb-8 flex items-center gap-3">
          <GiCrossedSabres className="text-4xl sm:text-5xl animate-pulse" />
          Team Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const currentRound = team.rounds.find(
              (r) => r.roundNumber === team.currentRound
            );

            return (
              <div
                key={team._id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 
                border-2 border-red-500/30 hover:border-red-500/50 transition-all duration-300 shadow-2xl
                hover:shadow-red-500/20 relative overflow-hidden animate-glowing-border"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                      <GiDeathSkull className="text-2xl" />
                      {team.name}
                    </h2>
                    <p className="text-gray-400 text-sm">Slot #{team.slot}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-500">
                      {team.totalPoints}
                    </p>
                    <p className="text-xs text-gray-400">Total Points</p>
                  </div>
                </div>

                {/* Elimination Bars */}
                <div className="flex gap-2 mb-6">
                  {[0, 1, 2, 3].map((playerIndex) => (
                    <button
                      key={playerIndex}
                      onClick={() => handleElimination(team._id, playerIndex)}
                      className={`w-full h-20 rounded-lg transition-all duration-200 flex items-center justify-center ${
                        currentRound?.eliminatedPlayers?.includes(playerIndex)
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      <span className="text-xs text-white">
                        P{playerIndex + 1}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Kill Input */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    value={killValues[team._id] || ""}
                    onChange={(e) =>
                      setKillValues((prev) => ({
                        ...prev,
                        [team._id]: e.target.value,
                      }))
                    }
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg flex-1 border border-red-500/30
                      focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 w-full sm:w-auto"
                    placeholder="Add kills"
                    min="0"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleKillUpdate(team._id)
                    }
                  />
                  <button
                    onClick={() => handleKillUpdate(team._id)}
                    disabled={
                      !killValues[team._id] ||
                      Number.parseInt(killValues[team._id]) <= 0
                    }
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2
                      disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full sm:w-auto"
                  >
                    <GiShotgun className="text-lg" />
                    Add Kills
                  </button>
                </div>

                {/* Round Info */}
                <div className="mt-4 pt-4 border-t border-red-500/20">
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
