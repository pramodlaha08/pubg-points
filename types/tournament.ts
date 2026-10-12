export type TournamentStatus = "draft" | "active" | "completed" | "archived";

export interface TournamentMeta {
  startDate?: string | null;
  endDate?: string | null;
  location?: string;
  notes?: string;
}

export interface TournamentScoring {
  positionPoints: Record<string, number>;
  killPointMultiplier: number;
  fullEliminationCount: number;
}

export interface Tournament {
  _id: string;
  name: string;
  season: string;
  status: TournamentStatus;
  isDefault: boolean;
  isArchived: boolean;
  teamCount: number;
  scoring?: TournamentScoring;
  meta?: TournamentMeta;
  createdAt: string;
  updatedAt: string;
}
