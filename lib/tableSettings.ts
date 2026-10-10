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
}

export interface PointsTableColumns {
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

export interface PointsTableSettings {
  preset: string;
  colors: PointsTableColors;
  columns: PointsTableColumns;
  header: PointsTableHeader;
  layout: PointsTableLayout;
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
  },
  columns: { alive: true, pts: true, elims: true },
  header: { title: "", logoUrl: "" },
  layout: { width: 300, rowHeight: 36, fontScale: 1, showTrophy: true },
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
  }),
];

export function mergePointsTable(input?: Partial<PointsTableSettings> | null): PointsTableSettings {
  if (!input) return structuredClone(DEFAULT_POINTS_TABLE);
  return {
    preset: input.preset ?? DEFAULT_POINTS_TABLE.preset,
    colors: { ...DEFAULT_POINTS_TABLE.colors, ...(input.colors ?? {}) },
    columns: { ...DEFAULT_POINTS_TABLE.columns, ...(input.columns ?? {}) },
    header: { ...DEFAULT_POINTS_TABLE.header, ...(input.header ?? {}) },
    layout: { ...DEFAULT_POINTS_TABLE.layout, ...(input.layout ?? {}) },
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
