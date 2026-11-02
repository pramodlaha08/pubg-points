export interface BroadcastOverlays {
  pointsTable: boolean;
  leaderboard: boolean;
  killFeed: boolean;
  notification: boolean;
}

export interface LowerThirdState {
  visible: boolean;
  title: string;
  subtitle: string;
  eventLogoUrl: string;
  sponsorLogos: string[];
  mapName: string;
  mapImageUrl: string;
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
  auto?: boolean;
  backgroundImageUrl: string;
  playerImageUrl: string;
  playerName: string;
  teamLogoUrl: string;
}

export interface BroadcastLayoutEntry {
  x: number;
  y: number;
  width: number;
  scale: number;
}

export type BroadcastLayoutKey =
  | "pointsTable"
  | "killFeed"
  | "notification"
  | "lowerThird"
  | "countdown"
  | "winner";

export type BroadcastLayout = Record<
  BroadcastLayoutKey,
  BroadcastLayoutEntry
>;

export interface BroadcastState {
  tournamentId: string;
  serverTime: string;
  overlays: BroadcastOverlays;
  lowerThird: LowerThirdState;
  countdown: CountdownState;
  winner: WinnerState;
  layout: BroadcastLayout;
}
