"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GiCrossedSabres } from "react-icons/gi";
import { useParams } from "next/navigation";
import TeamCard from "@/components/TeamCard";
import { useActiveRound } from "@/hooks/useActiveRound";
import { useTeamMutationQueue } from "@/hooks/useTeamMutationQueue";
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

  const enqueueTeamMutation = useTeamMutationQueue<Team>(upsertTeam);

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

  const applyOptimisticKills = (teamId: string, action: "add" | "decrease") => {
    const delta = action === "add" ? 1 : -1;
    setTeams((prev) =>
      prev.map((team) =>
        team._id !== teamId
          ? team
          : {
              ...team,
              rounds: team.rounds.map((round) =>
                round.roundNumber === activeRound
                  ? { ...round, kills: Math.max(0, round.kills + delta) }
                  : round,
              ),
            },
      ),
    );
  };

  const applyOptimisticElimination = (teamId: string, playerIndex: number) => {
    const full = SQUAD_CONFIG.fullEliminationCount;
    setTeams((prev) =>
      prev.map((team) => {
        if (team._id !== teamId) return team;
        const rounds = team.rounds.map((round) => {
          if (round.roundNumber !== activeRound) return round;
          const alreadyOut = round.eliminatedPlayers.includes(playerIndex);
          const eliminatedPlayers = alreadyOut
            ? round.eliminatedPlayers.filter((p) => p !== playerIndex)
            : [...round.eliminatedPlayers, playerIndex];
          const eliminationCount = Math.max(
            0,
            Math.min(full, round.eliminationCount + (alreadyOut ? -1 : 1)),
          );
          return {
            ...round,
            eliminatedPlayers,
            eliminationCount,
            status: eliminationCount === full ? "eliminated" : "alive",
          };
        });
        if (activeRound !== team.currentRound) {
          return { ...team, rounds };
        }
        const current = rounds.find((r) => r.roundNumber === activeRound);
        return {
          ...team,
          rounds,
          isEliminated: (current?.eliminationCount ?? 0) === full,
        };
      }),
    );
  };

  const applyOptimisticWipe = (teamId: string) => {
    const full = SQUAD_CONFIG.fullEliminationCount;
    const allPlayers = SQUAD_CONFIG.playerIndices();
    setTeams((prev) =>
      prev.map((team) => {
        if (team._id !== teamId) return team;
        const rounds = team.rounds.map((round) =>
          round.roundNumber === activeRound
            ? {
                ...round,
                eliminatedPlayers: allPlayers,
                eliminationCount: full,
                status: "eliminated",
              }
            : round,
        );
        if (activeRound !== team.currentRound) {
          return { ...team, rounds };
        }
        return { ...team, rounds, isEliminated: true };
      }),
    );
  };

  const updateKills = async (teamId: string, action: "add" | "decrease") => {
    if (!activeRound) return;
    const roundNumber = activeRound;
    applyOptimisticKills(teamId, action);
    enqueueTeamMutation(teamId, async () => {
      const response = await api.post(`/team/${teamId}/${action}-kill`, {
        roundNumber,
      });
      return response?.data?.data as Team | undefined;
    });
  };

  const handleElimination = async (teamId: string, playerIndex: number) => {
    if (!activeRound) return;
    const roundNumber = activeRound;
    applyOptimisticElimination(teamId, playerIndex);
    enqueueTeamMutation(teamId, async () => {
      const response = await api.put(`/team/${teamId}/elimination`, {
        playerIndex,
        roundNumber,
      });
      return response?.data?.data as Team | undefined;
    });
  };

  const handleWipeTeam = async (teamId: string) => {
    if (!activeRound) return;
    const roundNumber = activeRound;
    applyOptimisticWipe(teamId);
    enqueueTeamMutation(teamId, async () => {
      const response = await api.put(`/team/${teamId}/elimination`, {
        all: true,
        roundNumber,
      });
      return response?.data?.data as Team | undefined;
    });
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
              handleWipeTeam={handleWipeTeam}
              isRoundInfoExpanded={isRoundInfoExpanded}
              toggleRoundInfo={toggleRoundInfo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
