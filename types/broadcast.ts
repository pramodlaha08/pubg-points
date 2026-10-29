export interface BroadcastOverlays {
  pointsTable: boolean;
  leaderboard: boolean;
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

export interface BroadcastState {
  tournamentId: string;
  serverTime: string;
  overlays: BroadcastOverlays;
  lowerThird: LowerThirdState;
  countdown: CountdownState;
}
