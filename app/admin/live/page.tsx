"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { GiCrossedSabres } from "react-icons/gi";
import TeamCard from "@/components/TeamCard";
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

  // Latest in-flight request per team, so a slow/out-of-order response can
  // never overwrite a newer optimistic change.
  const requestSeqRef = useRef<Record<string, number>>({});

  const applyOptimisticKills = (teamId: string, action: "add" | "decrease") => {
    const delta = action === "add" ? 1 : -1;
    setTeams((prev) =>
      prev.map((team) =>
        team._id !== teamId
          ? team
          : {
              ...team,
              rounds: team.rounds.map((round) =>
                round.roundNumber === team.currentRound
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
          if (round.roundNumber !== team.currentRound) return round;
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
        const current = rounds.find((r) => r.roundNumber === team.currentRound);
        return {
          ...team,
          rounds,
          isEliminated: (current?.eliminationCount ?? 0) === full,
        };
      }),
    );
  };

  const updateKills = async (teamId: string, action: "add" | "decrease") => {
    applyOptimisticKills(teamId, action);
    const seq = (requestSeqRef.current[teamId] ?? 0) + 1;
    requestSeqRef.current[teamId] = seq;
    try {
      const endpoint = `/team/${teamId}/${action}-kill`;
      const response = await api.post(endpoint);
      if (requestSeqRef.current[teamId] !== seq) return;
      const updatedTeam = response?.data?.data as Team | undefined;
      if (updatedTeam) {
        upsertTeam(updatedTeam);
      } else {
        fetchTeams();
      }
    } catch (error) {
      console.error(`Error ${action}ing kills:`, error);
      if (requestSeqRef.current[teamId] === seq) fetchTeams();
    }
  };

  const handleElimination = async (teamId: string, playerIndex: number) => {
    applyOptimisticElimination(teamId, playerIndex);
    const seq = (requestSeqRef.current[teamId] ?? 0) + 1;
    requestSeqRef.current[teamId] = seq;
    try {
      const response = await api.put(`/team/${teamId}/elimination`, {
        playerIndex,
      });
      if (requestSeqRef.current[teamId] !== seq) return;
      const updatedTeam = response?.data?.data as Team | undefined;
      if (updatedTeam) {
        upsertTeam(updatedTeam);
      } else {
        fetchTeams();
      }
    } catch (error) {
      console.error("Error updating elimination:", error);
      if (requestSeqRef.current[teamId] === seq) fetchTeams();
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
