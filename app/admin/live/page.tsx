"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  Crown,
  Eye,
  EyeOff,
  ListOrdered,
  Pause,
  Pin,
  Play,
  RotateCcw,
  Settings2,
  Skull,
  Timer,
  Type,
} from "lucide-react";
import { api } from "@/lib/api";
import { GiCrossedSabres } from "react-icons/gi";
import TeamCard from "@/components/TeamCard";
import SQUAD_CONFIG from "@/lib/squadConfig";
import { useActiveRound } from "@/hooks/useActiveRound";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useAuth } from "@/components/providers/AuthProvider";

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

const QUICK_BASE =
  "flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const QUICK_ON =
  "border-emerald-400/60 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25";
const QUICK_OFF =
  "border-gray-700 bg-gray-900 text-gray-300 hover:border-red-500/60 hover:text-white";

const isTeamOut = (team: Team, roundNumber: number) => {
  const round = team.rounds.find((item) => item.roundNumber === roundNumber);
  return (
    (round?.eliminationCount ?? 0) === SQUAD_CONFIG.fullEliminationCount
  );
};

// Alive teams first (so their boxes rise), fully-eliminated teams last.
// Slot order is preserved within each group.
const orderTeams = (a: Team, b: Team, activeRound: number) => {
  const aOut = activeRound ? isTeamOut(a, activeRound) : a.isEliminated;
  const bOut = activeRound ? isTeamOut(b, activeRound) : b.isEliminated;
  const eliminatedDiff = Number(aOut) - Number(bOut);
  if (eliminatedDiff !== 0) return eliminatedDiff;
  return a.slot - b.slot;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isRoundInfoExpanded, setIsRoundInfoExpanded] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(DEFAULT_CARDS_PER_ROW);
  const [fixedSlots, setFixedSlots] = useState(false);
  const [roundNotice, setRoundNotice] = useState("");
  const {
    activeRound,
    setActiveRound,
    isLoading: isLoadingActiveRound,
  } = useActiveRound();
  const { canScore } = useAuth();
  const { broadcast, refresh: refreshBroadcast } = useBroadcast();
  const [broadcastBusy, setBroadcastBusy] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState("");
  const [winnerPick, setWinnerPick] = useState("");

  const availableRounds = useMemo(
    () =>
      [...new Set(teams.flatMap((team) => team.rounds.map((r) => r.roundNumber)))]
        .sort((a, b) => a - b),
    [teams],
  );

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
    fixedSlots ? a.slot - b.slot : orderTeams(a, b, activeRound);

  useEffect(() => {
    setWinnerPick(broadcast?.winner.teamId ?? "");
  }, [broadcast?.winner.teamId]);

  const patchBroadcast = async (
    body: Record<string, unknown>,
    success?: string,
  ) => {
    if (!canScore) {
      setBroadcastNotice("Scorer access is required to drive overlays.");
      return;
    }
    setBroadcastBusy(true);
    setBroadcastNotice("");
    try {
      await api.patch("/broadcast", body);
      await refreshBroadcast();
      if (success) setBroadcastNotice(success);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Could not update the live overlay.";
      setBroadcastNotice(message);
    } finally {
      setBroadcastBusy(false);
    }
  };

  const showWinner = () => {
    if (!winnerPick) {
      setBroadcastNotice("Pick the winning team first.");
      return;
    }
    void patchBroadcast(
      { winner: { visible: true, teamId: winnerPick } },
      "Winner splash is live",
    );
  };

  const handleActiveRoundChange = async (value: string) => {
    const nextRound = Number(value);
    if (!Number.isInteger(nextRound) || nextRound < 1) return;
    setRoundNotice("");
    try {
      await setActiveRound(nextRound);
    } catch {
      setRoundNotice("Could not switch the active round. Try again.");
    }
  };

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

  const updateKills = async (teamId: string, action: "add" | "decrease") => {
    if (!activeRound) return;
    applyOptimisticKills(teamId, action);
    const seq = (requestSeqRef.current[teamId] ?? 0) + 1;
    requestSeqRef.current[teamId] = seq;
    try {
      const endpoint = `/team/${teamId}/${action}-kill`;
      const response = await api.post(endpoint, { roundNumber: activeRound });
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
    if (!activeRound) return;
    applyOptimisticElimination(teamId, playerIndex);
    const seq = (requestSeqRef.current[teamId] ?? 0) + 1;
    requestSeqRef.current[teamId] = seq;
    try {
      const response = await api.put(`/team/${teamId}/elimination`, {
        playerIndex,
        roundNumber: activeRound,
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

  const pointsOn = broadcast?.overlays.pointsTable !== false;
  const feedOn = broadcast?.overlays.killFeed !== false;
  const lowerThirdOn = Boolean(broadcast?.lowerThird.visible);
  const lowerThirdReady = lowerThirdOn || Boolean(broadcast?.lowerThird.title);
  const countdown = broadcast?.countdown;
  const winner = broadcast?.winner;
  const overlayBusy = broadcastBusy || !broadcast || !canScore;

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
              Live round
              <select
                value={activeRound || ""}
                onChange={(event) => handleActiveRoundChange(event.target.value)}
                disabled={isLoadingActiveRound || availableRounds.length === 0}
                className="rounded-md border border-red-500/50 bg-gray-800 px-3 py-2 font-semibold text-white focus:border-red-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {availableRounds.length === 0 && (
                  <option value="">No rounds</option>
                )}
                {activeRound > 0 &&
                  !availableRounds.includes(activeRound) && (
                    <option value={activeRound}>R{activeRound}</option>
                  )}
                {availableRounds.map((round) => (
                  <option key={round} value={round}>
                    Round {round}
                  </option>
                ))}
              </select>
            </label>

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

        <div className="mb-6 rounded-xl border border-red-500/30 bg-gray-800/80 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Quick broadcast
              {winner?.auto ? (
                <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-300">
                  AUTO WINNER
                </span>
              ) : null}
            </p>
            <a
              href="/admin/control"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition-colors hover:text-white"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Layout & full control
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={overlayBusy}
              onClick={() =>
                patchBroadcast(
                  { overlays: { pointsTable: !pointsOn } },
                  pointsOn ? "Points table hidden" : "Points table shown",
                )
              }
              className={`${QUICK_BASE} ${pointsOn ? QUICK_ON : QUICK_OFF}`}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              Table
              {pointsOn ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </button>

            <button
              type="button"
              disabled={overlayBusy}
              onClick={() =>
                patchBroadcast(
                  { overlays: { killFeed: !feedOn } },
                  feedOn ? "Kill feed hidden" : "Kill feed shown",
                )
              }
              className={`${QUICK_BASE} ${feedOn ? QUICK_ON : QUICK_OFF}`}
            >
              <Skull className="h-3.5 w-3.5" />
              Feed
              {feedOn ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </button>

            <button
              type="button"
              disabled={overlayBusy || !lowerThirdReady}
              title={
                lowerThirdReady
                  ? "Toggle lower third"
                  : "Add a lower-third title in the control room first"
              }
              onClick={() =>
                patchBroadcast(
                  { lowerThird: { visible: !lowerThirdOn } },
                  lowerThirdOn ? "Lower third hidden" : "Lower third is live",
                )
              }
              className={`${QUICK_BASE} ${
                lowerThirdOn ? QUICK_ON : QUICK_OFF
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              Lower 3
              {lowerThirdOn ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </button>

            <span className="mx-1 hidden h-7 w-px bg-gray-700 sm:block" />

            <button
              type="button"
              disabled={overlayBusy}
              onClick={() =>
                patchBroadcast(
                  { countdown: { action: "start" } },
                  "Countdown started",
                )
              }
              className={`${QUICK_BASE} ${
                countdown?.running ? QUICK_ON : QUICK_OFF
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              Start
            </button>
            <button
              type="button"
              disabled={overlayBusy || !countdown?.running}
              onClick={() => patchBroadcast({ countdown: { action: "pause" } })}
              className={`${QUICK_BASE} ${QUICK_OFF}`}
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </button>
            <button
              type="button"
              disabled={overlayBusy}
              onClick={() =>
                patchBroadcast({ countdown: { action: "reset" } }, "Countdown reset")
              }
              className={`${QUICK_BASE} ${QUICK_OFF}`}
              title="Reset countdown"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={overlayBusy}
              onClick={() =>
                patchBroadcast(
                  { countdown: { action: countdown?.visible ? "hide" : "show" } },
                  countdown?.visible ? "Countdown hidden" : "Countdown shown",
                )
              }
              className={`${QUICK_BASE} ${
                countdown?.visible ? QUICK_ON : QUICK_OFF
              }`}
            >
              <Timer className="h-3.5 w-3.5" />
              {countdown?.visible ? "Hide" : "Show"}
            </button>

            <span className="mx-1 hidden h-7 w-px bg-gray-700 sm:block" />

            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-300" />
              <select
                value={winnerPick}
                onChange={(event) => setWinnerPick(event.target.value)}
                disabled={overlayBusy}
                className="max-w-[170px] rounded-md border border-gray-700 bg-gray-900 px-2.5 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none disabled:opacity-50"
              >
                <option value="">Winner…</option>
                {[...teams]
                  .sort((a, b) => a.slot - b.slot)
                  .map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={overlayBusy}
                onClick={showWinner}
                className={`${QUICK_BASE} ${QUICK_OFF}`}
              >
                <Play className="h-3 w-3" />
                Show
              </button>
              <button
                type="button"
                disabled={overlayBusy || !winner?.visible}
                onClick={() =>
                  patchBroadcast(
                    { winner: { visible: false } },
                    "Winner splash hidden",
                  )
                }
                className={`${QUICK_BASE} ${QUICK_OFF}`}
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {broadcastNotice ? (
            <p className="mt-2 text-xs font-medium text-amber-300">
              {broadcastNotice}
            </p>
          ) : null}
        </div>

        {roundNotice && (
          <p className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {roundNotice}
          </p>
        )}

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
