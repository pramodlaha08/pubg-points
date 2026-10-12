export interface PointsTableColors {
  headerFrom: string;
  headerTo: string;
  rankFrom: string;
  rankTo: string;
  teamFrom: string;
  teamTo: string;
  cellBg: string;
  border: string;
  borderSoft: string;
  accent: string;
  aliveBar: string;
  deadBar: string;
  textPrimary: string;
  panelFrom: string;
  panelTo: string;
  placeColor: string;
  elimColor: string;
  totalColor: string;
  danger: string;
  warning: string;
  notificationFrom: string;
  notificationTo: string;
}

export interface PointsTableColumns {
  logo: boolean;
  alive: boolean;
  pts: boolean;
  elims: boolean;
}

export interface PointsTableHeader {
  title: string;
  logoUrl: string;
}

export interface PointsTableLayout {
  width: number;
  rowHeight: number;
  fontScale: number;
  showTrophy: boolean;
}

export interface NotificationSettings {
  showLogo: boolean;
  showKills: boolean;
  showRank: boolean;
  showRound: boolean;
  durationMs: number;
}

export interface LeaderboardSettings {
  showLogo: boolean;
  showPlace: boolean;
  showElims: boolean;
  showTotal: boolean;
  showChickens: boolean;
}

export interface MatchSettings {
  showLogo: boolean;
  showRank: boolean;
  showElims: boolean;
  showPlace: boolean;
  showTotal: boolean;
}

export interface PointsTableSettings {
  preset: string;
  colors: PointsTableColors;
  columns: PointsTableColumns;
  header: PointsTableHeader;
  layout: PointsTableLayout;
  notifications: NotificationSettings;
  leaderboard: LeaderboardSettings;
  match: MatchSettings;
}

export interface AppSettings {
  key?: string;
  pointsTable: PointsTableSettings;
}

export const DEFAULT_POINTS_TABLE: PointsTableSettings = {
  preset: "esports-blue",
  colors: {
    headerFrom: "#4D78D6",
    headerTo: "#5A6EFF",
    rankFrom: "#001FFF",
    rankTo: "#5A96E6",
    teamFrom: "#001FFF",
    teamTo: "#5A96E6",
    cellBg: "#FFFFFF",
    border: "#3A3E5A",
    borderSoft: "#E6EEFF",
    accent: "#4D78D6",
    aliveBar: "#0000FF",
    deadBar: "#EF4444",
    textPrimary: "#0F172A",
    panelFrom: "#F5F8FF",
    panelTo: "#EAF2FF",
    placeColor: "#2563EB",
    elimColor: "#D97706",
    totalColor: "#0F172A",
    danger: "#DC2626",
    warning: "#F59E0B",
    notificationFrom: "#FFFFFF",
    notificationTo: "#EFF6FF",
  },
  columns: { logo: true, alive: true, pts: true, elims: true },
  header: { title: "", logoUrl: "" },
  layout: { width: 300, rowHeight: 36, fontScale: 1, showTrophy: true },
  notifications: {
    showLogo: true,
    showKills: true,
    showRank: true,
    showRound: true,
    durationMs: 5000,
  },
  leaderboard: {
    showLogo: true,
    showPlace: true,
    showElims: true,
    showTotal: true,
    showChickens: true,
  },
  match: {
    showLogo: true,
    showRank: true,
    showElims: true,
    showPlace: true,
    showTotal: true,
  },
};

export const COLOR_FIELDS: { key: keyof PointsTableColors; label: string }[] = [
  { key: "headerFrom", label: "Header (start)" },
  { key: "headerTo", label: "Header (end)" },
  { key: "rankFrom", label: "Rank column (start)" },
  { key: "rankTo", label: "Rank column (end)" },
  { key: "teamFrom", label: "Team column (start)" },
  { key: "teamTo", label: "Team column (end)" },
  { key: "cellBg", label: "Stat cells background" },
  { key: "border", label: "Border" },
  { key: "borderSoft", label: "Soft border" },
  { key: "accent", label: "Accent" },
  { key: "aliveBar", label: "Alive indicator" },
  { key: "deadBar", label: "Eliminated indicator" },
  { key: "textPrimary", label: "Primary text" },
  { key: "panelFrom", label: "Panel background (start)" },
  { key: "panelTo", label: "Panel background (end)" },
  { key: "placeColor", label: "Place points text" },
  { key: "elimColor", label: "Elims text" },
  { key: "totalColor", label: "Total points text" },
  { key: "danger", label: "Danger / notification" },
  { key: "warning", label: "Warning / highlight" },
  { key: "notificationFrom", label: "Notification bg (start)" },
  { key: "notificationTo", label: "Notification bg (end)" },
];

const preset = (
  id: string,
  label: string,
  colors: Partial<PointsTableColors>
): { id: string; label: string; pointsTable: PointsTableSettings } => ({
  id,
  label,
  pointsTable: {
    ...DEFAULT_POINTS_TABLE,
    preset: id,
    colors: { ...DEFAULT_POINTS_TABLE.colors, ...colors },
  },
});

export const TABLE_PRESETS = [
  preset("esports-blue", "Esports Blue", {}),
  preset("dark-neon", "Dark Neon", {
    headerFrom: "#1F2937",
    headerTo: "#111827",
    rankFrom: "#7C3AED",
    rankTo: "#4F46E5",
    teamFrom: "#0F172A",
    teamTo: "#1E293B",
    cellBg: "#111827",
    border: "#374151",
    borderSoft: "#1F2937",
    accent: "#22D3EE",
    aliveBar: "#22D3EE",
    deadBar: "#F43F5E",
    textPrimary: "#E5E7EB",
    panelFrom: "#111827",
    panelTo: "#0B1120",
    placeColor: "#22D3EE",
    elimColor: "#F472B6",
    totalColor: "#E5E7EB",
    danger: "#F43F5E",
    warning: "#FBBF24",
    notificationFrom: "#020617",
    notificationTo: "#3B0764",
  }),
  preset("gold-rush", "Gold Rush", {
    headerFrom: "#B45309",
    headerTo: "#D97706",
    rankFrom: "#78350F",
    rankTo: "#B45309",
    teamFrom: "#92400E",
    teamTo: "#B45309",
    cellBg: "#FFFBEB",
    border: "#78350F",
    borderSoft: "#FDE68A",
    accent: "#F59E0B",
    aliveBar: "#F59E0B",
    deadBar: "#DC2626",
    textPrimary: "#451A03",
    panelFrom: "#FFFBEB",
    panelTo: "#FEF3C7",
    placeColor: "#B45309",
    elimColor: "#DC2626",
    totalColor: "#451A03",
    danger: "#DC2626",
    warning: "#F59E0B",
  }),
  preset("crimson", "Crimson", {
    headerFrom: "#991B1B",
    headerTo: "#DC2626",
    rankFrom: "#450A0A",
    rankTo: "#991B1B",
    teamFrom: "#7F1D1D",
    teamTo: "#B91C1C",
    cellBg: "#FEF2F2",
    border: "#7F1D1D",
    borderSoft: "#FECACA",
    accent: "#EF4444",
    aliveBar: "#EF4444",
    deadBar: "#7F1D1D",
    textPrimary: "#450A0A",
    panelFrom: "#FEF2F2",
    panelTo: "#FEE2E2",
    placeColor: "#B91C1C",
    elimColor: "#9A3412",
    totalColor: "#450A0A",
    danger: "#EF4444",
    warning: "#F97316",
  }),
  preset("emerald", "Emerald", {
    headerFrom: "#047857",
    headerTo: "#10B981",
    rankFrom: "#064E3B",
    rankTo: "#059669",
    teamFrom: "#065F46",
    teamTo: "#047857",
    cellBg: "#ECFDF5",
    border: "#065F46",
    borderSoft: "#A7F3D0",
    accent: "#10B981",
    aliveBar: "#22C55E",
    deadBar: "#EF4444",
    textPrimary: "#022C22",
    panelFrom: "#ECFDF5",
    panelTo: "#D1FAE5",
    placeColor: "#047857",
    elimColor: "#B45309",
    totalColor: "#022C22",
    danger: "#DC2626",
    warning: "#F59E0B",
  }),
  preset("midnight-purple", "Midnight Purple", {
    headerFrom: "#4C1D95",
    headerTo: "#7C3AED",
    rankFrom: "#2E1065",
    rankTo: "#6D28D9",
    teamFrom: "#3B0764",
    teamTo: "#5B21B6",
    cellBg: "#F5F3FF",
    border: "#4C1D95",
    borderSoft: "#DDD6FE",
    accent: "#8B5CF6",
    aliveBar: "#A78BFA",
    deadBar: "#F43F5E",
    textPrimary: "#1E1B4B",
    panelFrom: "#F5F3FF",
    panelTo: "#EDE9FE",
    placeColor: "#6D28D9",
    elimColor: "#DB2777",
    totalColor: "#1E1B4B",
    danger: "#DB2777",
    warning: "#F59E0B",
  }),
  preset("ice", "Ice", {
    headerFrom: "#0E7490",
    headerTo: "#22D3EE",
    rankFrom: "#164E63",
    rankTo: "#0891B2",
    teamFrom: "#155E75",
    teamTo: "#0E7490",
    cellBg: "#ECFEFF",
    border: "#155E75",
    borderSoft: "#A5F3FC",
    accent: "#06B6D4",
    aliveBar: "#38BDF8",
    deadBar: "#F43F5E",
    textPrimary: "#083344",
    panelFrom: "#ECFEFF",
    panelTo: "#CFFAFE",
    placeColor: "#0E7490",
    elimColor: "#E11D48",
    totalColor: "#083344",
    danger: "#F43F5E",
    warning: "#F59E0B",
  }),
  preset("sunset", "Sunset", {
    headerFrom: "#C2410C",
    headerTo: "#FB923C",
    rankFrom: "#7C2D12",
    rankTo: "#EA580C",
    teamFrom: "#9A3412",
    teamTo: "#C2410C",
    cellBg: "#FFF7ED",
    border: "#9A3412",
    borderSoft: "#FED7AA",
    accent: "#F97316",
    aliveBar: "#FB923C",
    deadBar: "#DC2626",
    textPrimary: "#431407",
    panelFrom: "#FFF7ED",
    panelTo: "#FFEDD5",
    placeColor: "#C2410C",
    elimColor: "#BE123C",
    totalColor: "#431407",
    danger: "#DC2626",
    warning: "#F59E0B",
  }),
  preset("carbon", "Carbon", {
    headerFrom: "#334155",
    headerTo: "#0F172A",
    rankFrom: "#1E293B",
    rankTo: "#334155",
    teamFrom: "#0F172A",
    teamTo: "#1E293B",
    cellBg: "#F1F5F9",
    border: "#334155",
    borderSoft: "#CBD5E1",
    accent: "#64748B",
    aliveBar: "#38BDF8",
    deadBar: "#EF4444",
    textPrimary: "#0F172A",
    panelFrom: "#F8FAFC",
    panelTo: "#E2E8F0",
    placeColor: "#334155",
    elimColor: "#B45309",
    totalColor: "#0F172A",
    danger: "#EF4444",
    warning: "#F59E0B",
  }),
  preset("cyberpunk", "Cyberpunk", {
    headerFrom: "#BE185D",
    headerTo: "#7C3AED",
    rankFrom: "#831843",
    rankTo: "#BE185D",
    teamFrom: "#2E1065",
    teamTo: "#6D28D9",
    cellBg: "#FDF2F8",
    border: "#9D174D",
    borderSoft: "#FBCFE8",
    accent: "#EC4899",
    aliveBar: "#22D3EE",
    deadBar: "#F43F5E",
    textPrimary: "#1E1B4B",
    panelFrom: "#FDF2F8",
    panelTo: "#FAE8FF",
    placeColor: "#BE185D",
    elimColor: "#7C3AED",
    totalColor: "#1E1B4B",
    danger: "#DB2777",
    warning: "#FACC15",
  }),
];

export function mergePointsTable(
  input?: Partial<PointsTableSettings> | null
): PointsTableSettings {
  if (!input) return structuredClone(DEFAULT_POINTS_TABLE);
  return {
    preset: input.preset ?? DEFAULT_POINTS_TABLE.preset,
    colors: { ...DEFAULT_POINTS_TABLE.colors, ...(input.colors ?? {}) },
    columns: { ...DEFAULT_POINTS_TABLE.columns, ...(input.columns ?? {}) },
    header: { ...DEFAULT_POINTS_TABLE.header, ...(input.header ?? {}) },
    layout: { ...DEFAULT_POINTS_TABLE.layout, ...(input.layout ?? {}) },
    notifications: {
      ...DEFAULT_POINTS_TABLE.notifications,
      ...(input.notifications ?? {}),
    },
    leaderboard: {
      ...DEFAULT_POINTS_TABLE.leaderboard,
      ...(input.leaderboard ?? {}),
    },
    match: { ...DEFAULT_POINTS_TABLE.match, ...(input.match ?? {}) },
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const expanded =
    value.length === 3
      ? value.split("").map((c) => c + c).join("")
      : value;
  const int = parseInt(expanded.slice(0, 6), 16);
  if (Number.isNaN(int)) return hex;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
