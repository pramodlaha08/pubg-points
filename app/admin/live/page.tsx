"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, Pin } from "lucide-react";
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

const CARDS_PER_ROW_KEY = "pubg_live_cards_per_row";
const FIXED_SLOTS_KEY = "pubg_live_fixed_slots";
const DEFAULT_CARDS_PER_ROW = 3;
const MIN_CARDS_PER_ROW = 1;
const MAX_CARDS_PER_ROW = 20;

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
  const [cardsPerRow, setCardsPerRow] = useState(DEFAULT_CARDS_PER_ROW);
  const [fixedSlots, setFixedSlots] = useState(false);

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

  // Cards-per-row is a local display preference only (never sent to the DB).
  useEffect(() => {
    const stored = Number.parseInt(
      window.localStorage.getItem(CARDS_PER_ROW_KEY) ?? "",
      10,
    );
    if (
      Number.isFinite(stored) &&
      stored >= MIN_CARDS_PER_ROW &&
      stored <= MAX_CARDS_PER_ROW
    ) {
      setCardsPerRow(stored);
    }
    setFixedSlots(window.localStorage.getItem(FIXED_SLOTS_KEY) === "1");
  }, []);

  const updateCardsPerRow = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(
      MAX_CARDS_PER_ROW,
      Math.max(MIN_CARDS_PER_ROW, parsed),
    );
    setCardsPerRow(clamped);
    window.localStorage.setItem(CARDS_PER_ROW_KEY, String(clamped));
  };

  // Fixed slots keeps every card in its slot position; otherwise eliminated
  // teams drop to the bottom of the panel.
  const toggleFixedSlots = () => {
    setFixedSlots((prev) => {
      const next = !prev;
      window.localStorage.setItem(FIXED_SLOTS_KEY, next ? "1" : "0");
      return next;
    });
  };

  const sortTeams = (a: Team, b: Team) =>
    fixedSlots ? a.slot - b.slot : orderTeams(a, b);

  // Tighten spacing as more cards share a row, and let dense grids use the
  // full screen instead of being boxed into the 1400px reading width.
  const gridGap =
    cardsPerRow >= 9
      ? "0.5rem"
      : cardsPerRow >= 6
        ? "0.75rem"
        : cardsPerRow >= 4
          ? "1rem"
          : "1.5rem";

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
      <div
        className={`mx-auto w-full ${
          cardsPerRow >= 4 ? "max-w-none" : "max-w-[1400px]"
        }`}
      >
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-red-500 flex items-center gap-3">
            <GiCrossedSabres className="text-4xl sm:text-5xl animate-pulse" />
            Team Dashboard
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              Cards per row
              <input
                type="number"
                min={MIN_CARDS_PER_ROW}
                max={MAX_CARDS_PER_ROW}
                value={cardsPerRow}
                onChange={(event) => updateCardsPerRow(event.target.value)}
                className="w-20 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-center font-semibold text-white focus:border-red-500 focus:outline-none"
              />
            </label>

            <button
              type="button"
              onClick={toggleFixedSlots}
              aria-pressed={fixedSlots}
              title={
                fixedSlots
                  ? "Cards stay in their slot position even when eliminated"
                  : "Eliminated teams move to the bottom"
              }
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                fixedSlots
                  ? "border-red-500 bg-red-600 text-white"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-red-500/60 hover:text-white"
              }`}
            >
              {fixedSlots ? (
                <Pin className="h-4 w-4" />
              ) : (
                <ArrowDownUp className="h-4 w-4" />
              )}
              {fixedSlots ? "Fixed slots" : "Auto order"}
            </button>
          </div>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`,
            gap: gridGap,
          }}
        >
          {[...teams].filter((team) => !team.absent).sort(sortTeams).map((team) => (
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
