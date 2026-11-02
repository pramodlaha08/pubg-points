"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GiCrossedSabres } from "react-icons/gi";
import { useParams } from "next/navigation";
import TeamCard from "@/components/TeamCard";
import { useActiveRound } from "@/hooks/useActiveRound";
import SQUAD_CONFIG from "@/lib/squadConfig";

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

// Alive teams first (so their boxes rise), fully-eliminated teams last.
// Slot order is preserved within each group.
const isTeamOut = (team: Team, roundNumber: number) => {
  const round = team.rounds.find((item) => item.roundNumber === roundNumber);
  return (
    (round?.eliminationCount ?? 0) === SQUAD_CONFIG.fullEliminationCount
  );
};

const orderTeams = (a: Team, b: Team, activeRound: number) => {
  const aOut = activeRound ? isTeamOut(a, activeRound) : a.isEliminated;
  const bOut = activeRound ? isTeamOut(b, activeRound) : b.isEliminated;
  const eliminatedDiff = Number(aOut) - Number(bOut);
  if (eliminatedDiff !== 0) return eliminatedDiff;
  return a.slot - b.slot;
};

export default function FilteredTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const params = useParams();
  const [isRoundInfoExpanded, setIsRoundInfoExpanded] = useState(false);
  const { activeRound } = useActiveRound();

  const upsertTeam = (updatedTeam: Team) => {
    setTeams((prev) => {
      const exists = prev.some((team) => team._id === updatedTeam._id);
      if (!exists) {
        return [...prev, updatedTeam];
      }
      return prev.map((team) =>
        team._id === updatedTeam._id ? updatedTeam : team
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
  const toggleRoundInfo = () => {
    setIsRoundInfoExpanded((prev) => !prev);
  };

  useEffect(() => {
    fetchTeams();
  }, []); // Removed params from dependencies

  const updateKills = async (teamId: string, action: "add" | "decrease") => {
    if (!activeRound) return;
    try {
      const endpoint = `/team/${teamId}/${action}-kill`;
      const response = await api.post(endpoint, { roundNumber: activeRound });
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
    if (!activeRound) return;
    try {
      const response = await api.put(`/team/${teamId}/elimination`, {
        playerIndex,
        roundNumber: activeRound,
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

  // Parse slot numbers from the URL
  const rawSlots = Array.isArray(params.slots)
    ? params.slots
    : params.slots
      ? [params.slots]
      : [];
  const slotNumbers = rawSlots.map(Number).filter((n) => !Number.isNaN(n));

  // Filter, then order: alive teams first, eliminated teams last.
  const filteredAndSortedTeams = teams
    .filter((team) => slotNumbers.includes(team.slot))
    .sort((a, b) => orderTeams(a, b, activeRound));

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-red-500 mb-8 flex items-center gap-3">
          <GiCrossedSabres className="text-4xl sm:text-5xl animate-pulse" />
          Filtered Team Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredAndSortedTeams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              activeRound={activeRound}
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
