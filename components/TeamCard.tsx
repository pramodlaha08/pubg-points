"use client";

import { GiDeathSkull } from "react-icons/gi";
import { Flame, ChevronDown, ChevronUp } from "lucide-react";

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
  team: Team;
  updateKills: (teamId: string, action: "add" | "decrease") => Promise<void>;
  handleElimination: (teamId: string, playerIndex: number) => Promise<void>;
  isRoundInfoExpanded: boolean;
  toggleRoundInfo: () => void;
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

  const isKillButtonsDisabled = currentRound?.eliminationCount === 4;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-red-500/30 hover:border-red-500/50 transition-all duration-300 shadow-2xl hover:shadow-red-500/20 relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-red-400 flex items-center gap-2">
            <GiDeathSkull className="text-3xl" />
            {team.name}
          </h2>
          <p className="text-gray-400 text-sm">Slot #{team.slot}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-red-500">{team.totalPoints}</p>
          <p className="text-sm text-gray-400">Total Points</p>
        </div>
      </div>

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
            className={`bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl text-white text-xl font-bold shadow-md transition-all duration-200 ${
              isKillButtonsDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isKillButtonsDisabled}
          >
            -
          </button>
          <span className="text-3xl font-bold text-white w-16 text-center">
            {currentRound?.kills || 0}
          </span>
          <button
            onClick={() => updateKills(team._id, "add")}
            className={`bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-white text-xl font-bold shadow-md transition-all duration-200 ${
              isKillButtonsDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isKillButtonsDisabled}
          >
            +
          </button>
        </div>
      </div>

      {/* Round Info Toggle */}
      <div className="mt-6 flex items-center justify-between border-t border-red-500/20 pt-4">
        <button
          onClick={toggleRoundInfo}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors duration-200"
        >
          <Flame className="w-5 h-5" />
          <span className="font-semibold">Round Info</span>
          {isRoundInfoExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Collapsible Round Info */}
      <div
        className={`mt-4 text-sm overflow-hidden transition-all duration-300 ${
          isRoundInfoExpanded ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex justify-between">
          <div className="text-gray-400">
            <p>Current Round: {team.currentRound}</p>
            <p>Eliminations: {currentRound?.eliminationCount || 0}/4</p>
          </div>
          <div className="text-right">
            <p className="text-red-400">+{currentRound?.killPoints || 0} KP</p>
            <p className="text-blue-400">
              +{currentRound?.positionPoints || 0} PP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
