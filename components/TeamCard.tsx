"use client";

import { GiDeathSkull } from "react-icons/gi";
import { Flame, ChevronDown, ChevronUp } from "lucide-react";
import SQUAD_CONFIG from "@/lib/squadConfig";
import { useRoundInfo } from "@/hooks/useRoundInfo";

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

interface TeamCardProps {
  readonly team: Team;
  readonly updateKills: (teamId: string, action: "add" | "decrease") => Promise<void>;
  readonly handleElimination: (teamId: string, playerIndex: number) => Promise<void>;
  readonly isRoundInfoExpanded: boolean;
  readonly toggleRoundInfo: () => void;
}

export default function TeamCard({
  team,
  updateKills,
  handleElimination,
  isRoundInfoExpanded,
  toggleRoundInfo,
}: TeamCardProps) {
  const currentRound = team.rounds.find(
    (r) => r.roundNumber === team.currentRound
  );

  const { mapByRound } = useRoundInfo();
  const currentMap = mapByRound[team.currentRound];

  const isKillButtonsDisabled = currentRound?.eliminationCount === SQUAD_CONFIG.fullEliminationCount;

  return (
    <div
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-[clamp(0.5rem,4cqi,1.5rem)] border-2 transition-all duration-300 shadow-2xl relative overflow-hidden [container-type:inline-size] ${
        team.isEliminated
          ? "border-gray-700 opacity-60 grayscale hover:opacity-80"
          : "border-red-500/30 hover:border-red-500/50 hover:shadow-red-500/20"
      }`}
    >
      <div className="mb-[clamp(0.4rem,3cqi,1.5rem)] flex flex-wrap items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-1 text-[clamp(0.7rem,5.5cqi,1.5rem)] font-bold uppercase leading-tight text-red-400">
            <span
              aria-label={`Slot ${team.slot}`}
              className="shrink-0 rounded-md bg-red-600 px-[clamp(0.3rem,1.5cqi,0.5rem)] py-0.5 text-[clamp(0.75rem,4.5cqi,1.25rem)] font-black leading-none tabular-nums text-white shadow-md ring-1 ring-white/20"
            >
              #{team.slot}
            </span>
            <GiDeathSkull className="shrink-0 text-[clamp(0.9rem,6cqi,1.875rem)]" />
            <span className="min-w-0 break-words">{team.name}</span>
            {team.isEliminated && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[0.5rem] font-bold tracking-wide text-white">
                OUT
              </span>
            )}
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[clamp(0.9rem,7cqi,1.875rem)] font-bold leading-none text-red-500">
            {team.totalPoints}
          </p>
          <p className="text-[clamp(0.45rem,2.6cqi,0.875rem)] text-gray-400">
            Total Points
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-[clamp(0.3rem,2.5cqi,1.5rem)]">
        <div className="grid shrink-0 grid-cols-2 gap-[clamp(0.2rem,1.2cqi,0.5rem)]">
          {SQUAD_CONFIG.playerIndices().map((playerIndex) => (
            <button
              key={playerIndex}
              onClick={() => handleElimination(team._id, playerIndex)}
              className={`h-[clamp(2.25rem,5cqi,3rem)] w-[clamp(2.25rem,5cqi,3rem)] rounded-[clamp(0.25rem,1.5cqi,0.75rem)] text-[clamp(0.6rem,3cqi,0.875rem)] font-bold text-white transition-all duration-200 ${
                currentRound?.eliminatedPlayers?.includes(playerIndex)
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {SQUAD_CONFIG.getPlayerLabel(playerIndex)}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 basis-[6.5rem] items-center justify-center gap-[clamp(0.15rem,1cqi,0.4rem)]">
          <button
            onClick={() => updateKills(team._id, "decrease")}
            className={`h-[clamp(2rem,5.5cqi,2.75rem)] w-[clamp(2rem,5.5cqi,2.75rem)] shrink-0 rounded-[clamp(0.25rem,1.8cqi,0.75rem)] bg-red-600 text-[clamp(0.85rem,4.5cqi,1.25rem)] font-bold leading-none text-white shadow-md transition-all duration-200 hover:bg-red-700 ${
              isKillButtonsDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isKillButtonsDisabled}
          >
            -
          </button>
          <span className="min-w-0 flex-1 text-center text-[clamp(0.9rem,6cqi,1.75rem)] font-bold tabular-nums text-white">
            {currentRound?.kills ?? 0}
          </span>
          <button
            onClick={() => updateKills(team._id, "add")}
            className={`h-[clamp(2rem,5.5cqi,2.75rem)] w-[clamp(2rem,5.5cqi,2.75rem)] shrink-0 rounded-[clamp(0.25rem,1.8cqi,0.75rem)] bg-green-600 text-[clamp(0.85rem,4.5cqi,1.25rem)] font-bold leading-none text-white shadow-md transition-all duration-200 hover:bg-green-700 ${
              isKillButtonsDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isKillButtonsDisabled}
          >
            +
          </button>
        </div>
      </div>

      {/* Round Info Toggle */}
      <div className="mt-[clamp(0.5rem,4cqi,1.5rem)] flex flex-wrap items-center justify-between gap-1 border-t border-red-500/20 pt-[clamp(0.4rem,3cqi,1rem)]">
        <button
          onClick={toggleRoundInfo}
          className="flex items-center gap-1 text-[clamp(0.55rem,3.6cqi,1rem)] font-semibold text-red-400 transition-colors duration-200 hover:text-red-300"
        >
          <Flame className="h-[clamp(0.7rem,4cqi,1.25rem)] w-[clamp(0.7rem,4cqi,1.25rem)] shrink-0" />
          <span>Round Info</span>
          {isRoundInfoExpanded ? (
            <ChevronUp className="h-[clamp(0.6rem,3.5cqi,1rem)] w-[clamp(0.6rem,3.5cqi,1rem)] shrink-0" />
          ) : (
            <ChevronDown className="h-[clamp(0.6rem,3.5cqi,1rem)] w-[clamp(0.6rem,3.5cqi,1rem)] shrink-0" />
          )}
        </button>
      </div>

      {/* Collapsible Round Info */}
      <div
        className={`mt-[clamp(0.3rem,2cqi,1rem)] overflow-hidden text-[clamp(0.5rem,3cqi,0.875rem)] transition-all duration-300 ${
          isRoundInfoExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex justify-between gap-2">
          <div className="min-w-0 break-words text-gray-400">
            <p>Current Round: {team.currentRound}</p>
            <p>Map: {currentMap || "—"}</p>
            <p>
              Eliminations: {currentRound?.eliminationCount ?? 0}/
              {SQUAD_CONFIG.fullEliminationCount}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-red-400">+{currentRound?.killPoints ?? 0} KP</p>
            <p className="text-blue-400">
              +{currentRound?.positionPoints ?? 0} PP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
