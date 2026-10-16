"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GiCrossedSabres } from "react-icons/gi";
import TeamCard from "@/components/TeamCard";

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
  absent?: boolean;
}

// Alive teams first (so their boxes rise), fully-eliminated teams last.
// Slot order is preserved within each group.
const orderTeams = (a: Team, b: Team) => {
  const eliminatedDiff = Number(a.isEliminated) - Number(b.isEliminated);
  if (eliminatedDiff !== 0) return eliminatedDiff;
  return a.slot - b.slot;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isRoundInfoExpanded, setIsRoundInfoExpanded] = useState(false);

  const upsertTeam = (updatedTeam: Team) => {
    setTeams((prev) => {
      const exists = prev.some((team) => team._id === updatedTeam._id);
      if (!exists) {
        return [...prev, updatedTeam];
      }
      return prev.map((team) =>
        team._id === updatedTeam._id ? updatedTeam : team,
      );
    });
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get("/team");
      setTeams(response.data.data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const updateKills = async (teamId: string, action: "add" | "decrease") => {
    try {
      const endpoint = `/team/${teamId}/${action}-kill`;
      const response = await api.post(endpoint);
      const updatedTeam = response?.data?.data as Team | undefined;
      if (updatedTeam) {
        upsertTeam(updatedTeam);
      } else {
        fetchTeams();
      }
    } catch (error) {
      console.error(`Error ${action}ing kills:`, error);
    }
  };

  const handleElimination = async (teamId: string, playerIndex: number) => {
    try {
      const response = await api.put(`/team/${teamId}/elimination`, {
        playerIndex,
      });
      const updatedTeam = response?.data?.data as Team | undefined;
      if (updatedTeam) {
        upsertTeam(updatedTeam);
      } else {
        fetchTeams();
      }
    } catch (error) {
      console.error("Error updating elimination:", error);
    }
  };

  // Toggle round info for all cards
  const toggleRoundInfo = () => {
    setIsRoundInfoExpanded((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-red-500 mb-8 flex items-center gap-3">
          <GiCrossedSabres className="text-4xl sm:text-5xl animate-pulse" />
          Team Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {[...teams].filter((team) => !team.absent).sort(orderTeams).map((team) => (
              <TeamCard
                key={team._id}
                team={team}
                updateKills={updateKills}
                handleElimination={handleElimination}
                isRoundInfoExpanded={isRoundInfoExpanded}
                toggleRoundInfo={toggleRoundInfo}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
