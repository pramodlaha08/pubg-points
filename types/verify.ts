export type MatchStatus = "matched" | "ambiguous" | "unmatched";

export type LobbySource = "memory" | "slot" | "saved" | "fuzzy";
export type LobbyOrigin = "existing" | "updated" | "new";

export interface TeamOption {
  _id: string;
  slot: number;
  name: string;
  logo: string;
}

export interface LobbyCandidate {
  teamId: string;
  slot: number;
  name: string;
  score: number;
}

export interface LobbyEntry {
  slot: number | null;
  name: string;
  normalized: string;
  canonical: string;
  status: MatchStatus;
  teamId: string | null;
  confidence: number;
  source: LobbySource;
  candidates: LobbyCandidate[];
  origin?: LobbyOrigin;
}

export interface ImageInfo {
  imageHash: string;
  count: number;
  engine: string;
}

export interface MappingTeam {
  teamId: string;
  slot: number;
  name: string;
  players: string[];
}

export interface LobbyMapping {
  teams: MappingTeam[];
  unassigned: string[];
}

export interface LobbyUploadResult {
  imageHash: string;
  imageHashes: string[];
  perImage: ImageInfo[];
  rawText: string;
  entries: LobbyEntry[];
  teams: TeamOption[];
  mapping: LobbyMapping;
  duplicates: { name: string; count: number }[];
  warnings: string[];
  ocr: {
    confidence: number | null;
    fromMemory: number;
    engine: string;
    images: number;
  };
}

export interface ComparisonRow {
  teamId: string;
  slot: number;
  name: string;
  liveKills: number;
  verifiedKills: number | null;
  livePosition: number;
  verifiedPosition: number | null;
  livePlacementPoints: number;
  verifiedPlacementPoints: number | null;
  status: "match" | "mismatch" | "unmatched";
}

export interface ResultsMappingRow {
  teamId: string;
  slot: number;
  name: string;
  players: string[];
  verifiedKills: number | null;
  verifiedPosition: number | null;
  status: ComparisonRow["status"];
}

export interface ResultUploadResult {
  imageHash: string;
  imageHashes: string[];
  perImage: ImageInfo[];
  roundNumber: number;
  rawText: string;
  comparison: ComparisonRow[];
  unmatched: { name: string; kills: number | null; rank: number | null }[];
  hasRoster: boolean;
  mapping: ResultsMappingRow[];
  warnings: string[];
  ocr: { confidence: number | null; engine: string; images: number };
}

// Local, editable version of a reconciliation row.
export interface EditableResultRow {
  teamId: string;
  slot: number;
  name: string;
  liveKills: number;
  livePosition: number;
  livePlacementPoints: number;
  verifiedKills: string;
  verifiedPosition: string;
  status: ComparisonRow["status"];
}

export interface SavedRosterPlayer {
  name: string;
  slot: number | null;
  teamId: string | null;
  normalized: string;
}

// Dry-run projection of what applying verified results would do.
export interface PointsPreviewRow {
  teamId: string;
  name: string;
  slot: number;
  currentKills: number;
  currentPosition: number;
  newKills: number;
  newPosition: number;
  currentKillPoints: number;
  currentPositionPoints: number;
  newKillPoints: number;
  newPositionPoints: number;
  currentTotal: number;
  projectedTotal: number;
  delta: number;
  targeted: boolean;
  currentRank: number;
  projectedRank: number;
  rankDelta: number;
}

export interface PointsPreview {
  roundNumber: number;
  changes: PointsPreviewRow[];
  skipped: { slot: number; reason: string }[];
  leaderboard: PointsPreviewRow[];
  killPointMultiplier: number;
}
