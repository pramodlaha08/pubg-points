import type { Team } from "@/types/team";

export interface StandingsTotals {
  placementPoints: number;
  eliminationPoints: number;
  totalPoints: number;
}

export const resolveStandingsRound = (
  team: Pick<Team, "currentRound">,
  activeRound?: number | null
) => {
  const round = Number(activeRound) || 0;
  return round > 0 ? round : Number(team.currentRound) || 0;
};


export const getStandingsTotals = (
  team: Pick<Team, "currentRound" | "rounds">,
  activeRound?: number | null,
  finalRound?: number | null
): StandingsTotals => {
  const cutoff = resolveStandingsRound(team, activeRound);
  const lastRound = Number(finalRound) || 0;
  const includeCurrentPlacement = lastRound > 0 && cutoff >= lastRound;

  const placementPoints = (team.rounds ?? []).reduce((sum, round) => {
    const counts = includeCurrentPlacement
      ? round.roundNumber <= cutoff
      : round.roundNumber < cutoff;
    return counts ? sum + (round.positionPoints ?? 0) : sum;
  }, 0);

  const eliminationPoints = (team.rounds ?? []).reduce(
    (sum, round) =>
      round.roundNumber <= cutoff ? sum + (round.killPoints ?? 0) : sum,
    0
  );

  return {
    placementPoints,
    eliminationPoints,
    totalPoints: placementPoints + eliminationPoints,
  };
};

const bestPlacementFor = (team: Pick<Team, "rounds">) => {
  const positions = (team.rounds ?? [])
    .map((round) => round.position)
    .filter((position) => position > 0 && position < 9999);
  return positions.length ? Math.min(...positions) : 9999;
};

export const compareStandings = (
  a: Pick<Team, "currentRound" | "rounds" | "slot">,
  b: Pick<Team, "currentRound" | "rounds" | "slot">,
  activeRound?: number | null,
  finalRound?: number | null
) => {
  const aTotals = getStandingsTotals(a, activeRound, finalRound);
  const bTotals = getStandingsTotals(b, activeRound, finalRound);

  return (
    bTotals.totalPoints - aTotals.totalPoints ||
    bTotals.placementPoints - aTotals.placementPoints ||
    bTotals.eliminationPoints - aTotals.eliminationPoints ||
    bestPlacementFor(a) - bestPlacementFor(b) ||
    a.slot - b.slot
  );
};
