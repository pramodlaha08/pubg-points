"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { GiDeathSkull, GiCancel } from "react-icons/gi";
import { Flame } from "lucide-react";

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
}

export default function DeleteTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/team`
      );
      setTeams(response.data.data);
    } catch (err) {
      setError("Failed to fetch teams");
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      setLoading(true);
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/team/${teamId}`);
      setSuccess("Team deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
      fetchTeams();
    } catch (err) {
      setError("Failed to delete team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <GiDeathSkull className="text-4xl text-red-500 animate-pulse" />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
            Manage Teams
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-800/50 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-800/50 text-green-300 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-red-500/30 hover:border-red-500/50 transition-all duration-300 shadow-2xl hover:shadow-red-500/20 relative overflow-hidden"
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

              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-gray-400">
                    Current Round: {team.currentRound}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTeam(team._id)}
                  disabled={loading}
                  className="flex items-center rounded-xl gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white transition-all duration-200 disabled:opacity-50"
                >
                  <GiCancel className="text-xl" />
                  {loading ? "Deleting..." : "Delete Team"}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-red-500/20">
                <div className="flex justify-between text-sm">
                  <div className="text-gray-400">
                    <p>Total Rounds: {team.rounds.length}</p>
                    <p>
                      Total Kills:{" "}
                      {team.rounds.reduce((sum, round) => sum + round.kills, 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400">
                      Last Round:{" "}
                      {team.rounds[team.rounds.length - 1]?.roundNumber || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
