export interface BroadcastOverlays {
  pointsTable: boolean;
  leaderboard: boolean;
  killFeed: boolean;
}

export interface LowerThirdState {
  visible: boolean;
  title: string;
  subtitle: string;
}

export interface CountdownState {
  visible: boolean;
  running: boolean;
  title: string;
  durationSeconds: number;
  remainingSeconds: number;
  endsAt: string | null;
}

export interface WinnerState {
  visible: boolean;
  teamId: string | null;
  title: string;
  subtitle: string;
}

export interface BroadcastState {
  tournamentId: string;
  serverTime: string;
  overlays: BroadcastOverlays;
  lowerThird: LowerThirdState;
  countdown: CountdownState;
  winner: WinnerState;
}
