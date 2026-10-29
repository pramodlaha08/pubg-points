export interface TeamRound {
  roundNumber: number;
  kills: number;
  killPoints: number;
  position: number;
  positionPoints: number;
  eliminationCount: number;
  eliminatedPlayers: number[];
  status: string;
}

export interface Team {
  _id: string;
  name: string;
  logo: string;
  slot: number;
  currentRound: number;
  totalPoints: number;
  isEliminated: boolean;
  rounds: TeamRound[];
}

export interface TeamLogEntry {
  _id: string;
  eventType: string;
  severity: "info" | "highlight" | "critical";
  title: string;
  message: string;
  teamName: string;
  slot: number;
  roundNumber: number | null;
  createdAt: string;
  teamId?: string | null;
  changes?: {
    field: string;
    previous?: unknown;
    current?: unknown;
    delta?: number | null;
  }[];
  meta?: Record<string, unknown>;
  revertedAt?: string | null;
  revertedByName?: string | null;
}

export interface ActivityEntry {
  id: string;
  eventType: string;
  severity: "info" | "highlight" | "critical";
  title: string;
  message: string;
  teamName: string;
  slot: number;
  roundNumber: number | null;
  createdAt: string;
}

export interface LeaderboardEntry {  id: string;
  name: string;
  slot: number;
  logo: string;
  totalPoints: number;
  isEliminated: boolean;
}

export interface DashboardStats {
  teams: number;
  aliveTeams: number;
  eliminatedTeams: number;
  currentRound: number;
  totalKills: number;
  totalEliminations: number;
  leaderboard: LeaderboardEntry[];
  recentActivity: ActivityEntry[];
  generatedAt: string;
}
