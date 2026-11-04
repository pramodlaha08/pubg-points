import { LEGACY_PRESET_DATA } from "./legacyPresets";

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
  place: boolean;
  pts: boolean;
  elims: boolean;
}

export interface PointsTableHeader {
  title: string;
  subtitle: string;
  logoUrl: string;
}

export interface PointsTableLayout {
  template: OverlayTemplate;
  width: number;
  rowHeight: number;
  fontScale: number;
  showTrophy: boolean;
  gap: number;
}

export interface NotificationSettings {
  template: OverlayTemplate;
  showLogo: boolean;
  showKills: boolean;
  showRank: boolean;
  showRound: boolean;
  durationMs: number;
  position: OverlayPosition;
}

export interface LeaderboardSettings {
  template: OverlayTemplate;
  showTitle: boolean;
  title: string;
  subtitle: string;
  showLogo: boolean;
  showPlace: boolean;
  showElims: boolean;
  showTotal: boolean;
  showChickens: boolean;
  bannerImage: string;
  logoSize: number;
  logoRounding: number;
  footerNote: string;
  headerLabels: LeaderboardHeaderLabels;
}

export interface LeaderboardHeaderLabels {
  rank: string;
  team: string;
  place: string;
  elims: string;
  total: string;
}

export interface MatchSettings {
  template: OverlayTemplate;
  showTitle: boolean;
  title: string;
  subtitle: string;
  showLogo: boolean;
  showRank: boolean;
  showElims: boolean;
  showPlace: boolean;
  showTotal: boolean;
  bannerImage: string;
  footerNote: string;
}

export type OverlayTemplate =
  | "arena"
  | "editorial"
  | "editorial-cards"
  | "editorial-podium"
  | "editorial-minimal"
  | "split"
  | "ticker"
  | "spotlight"
  | "scoreboard"
  | "ledger"
  | "matrix"
  | "strip"
  | "classic"
  | "lower-third"
  | "card-stack"
  | "big-board"
  | "hairline";

export const EDITORIAL_TEMPLATES: OverlayTemplate[] = [
  "arena",
  "editorial",
  "editorial-cards",
  "editorial-podium",
  "editorial-minimal",
  "split",
  "ticker",
  "spotlight",
  "scoreboard",
  "ledger",
  "matrix",
  "strip",
];

export const isEditorialTemplate = (template?: string | null) =>
  !!template && EDITORIAL_TEMPLATES.includes(template as OverlayTemplate);

export interface OverlayTypography {
  fontFamily: string;
  fontScale: number;
  uppercase: boolean;
  letterSpacing: number;
}

export type SurfaceStyle =
  | "solid"
  | "gradient"
  | "glass"
  | "transparent"
  | "none";

export type EntranceAnimation =
  | "fade-up"
  | "fade"
  | "slide-left"
  | "slide-right"
  | "scale"
  | "flip"
  | "none";

export type AmbientEffect = "float-shine" | "float" | "shine" | "pulse";

export interface OverlaySurface {
  style: SurfaceStyle;
  opacity: number;
  blur: number;
  radius: number;
  borderWidth: number;
  shadow: boolean;
  scanline: boolean;
  animate: boolean;
  entrance: EntranceAnimation;
  entranceDuration: number;
  stagger: number;
  ambient: AmbientEffect;
  backgroundImage: string;
  backgroundImageOpacity: number;
  backgroundImageBlur: number;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
}

export type WatermarkCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface OverlayWatermark {
  enabled: boolean;
  image: string;
  corner: WatermarkCorner;
  size: number;
  opacity: number;
  offset: number;
}

export type VerticalAnchor = "top" | "middle" | "bottom";
export type HorizontalAnchor = "left" | "center" | "right";

export interface OverlayPosition {
  vertical: VerticalAnchor;
  horizontal: HorizontalAnchor;
  offsetX: number;
  offsetY: number;
}

export type OverlayCardStyle = "editorial" | "spotlight" | "minimal";

export interface OverlayCardSettings {
  winner: OverlayCardStyle;
  countdown: OverlayCardStyle;
  lowerThird: OverlayCardStyle;
}

export const CARD_STYLE_LABELS: {
  key: OverlayCardStyle;
  label: string;
  blurb: string;
}[] = [
  {
    key: "editorial",
    label: "Editorial",
    blurb: "Structured broadcast panel with a restrained accent",
  },
  {
    key: "spotlight",
    label: "Spotlight",
    blurb: "Large centred type built for the main scene",
  },
  {
    key: "minimal",
    label: "Minimal",
    blurb: "Type-only treatment that sits over the footage",
  },
];

export interface PointsTableSettings {
  preset: string;
  colors: PointsTableColors;
  typography: OverlayTypography;
  surface: OverlaySurface;
  columns: PointsTableColumns;
  header: PointsTableHeader;
  layout: PointsTableLayout;
  cards: OverlayCardSettings;
  notifications: NotificationSettings;
  leaderboard: LeaderboardSettings;
  match: MatchSettings;
  watermark: OverlayWatermark;
}

export interface AppSettings {
  key?: string;
  pointsTable: PointsTableSettings;
}

export const DEFAULT_POINTS_TABLE: PointsTableSettings = {
  preset: "esports-blue",
  colors: {
    headerFrom: "#050A14",
    headerTo: "#0B1424",
    rankFrom: "#07111F",
    rankTo: "#0D1B2E",
    teamFrom: "#050A14",
    teamTo: "#0A1220",
    cellBg: "#070C15",
    border: "#1A3550",
    borderSoft: "#14283D",
    accent: "#22D3EE",
    aliveBar: "#34D399",
    deadBar: "#FB7185",
    textPrimary: "#E8FAFF",
    panelFrom: "#071019",
    panelTo: "#0B1727",
    placeColor: "#7CB3CC",
    elimColor: "#F0A6C8",
    totalColor: "#FFFFFF",
    danger: "#FB7185",
    warning: "#FBBF24",
    notificationFrom: "#071019",
    notificationTo: "#102235",
  },
  typography: {
    fontFamily: "Bahnschrift, 'DIN Alternate', 'Segoe UI', sans-serif",
    fontScale: 1,
    uppercase: true,
    letterSpacing: 0,
  },
  surface: {
    style: "gradient",
    opacity: 0.94,
    blur: 10,
    radius: 2,
    borderWidth: 1,
    shadow: true,
    scanline: true,
    animate: true,
    entrance: "slide-left",
    entranceDuration: 520,
    stagger: 42,
    ambient: "shine",
    backgroundImage: "",
    backgroundImageOpacity: 0.25,
    backgroundImageBlur: 0,
    gradientFrom: "#071019",
    gradientTo: "#0B1727",
    gradientAngle: 135,
  },
  columns: { logo: true, alive: true, place: true, pts: true, elims: true },
  header: { title: "", subtitle: "", logoUrl: "" },
  layout: {
    template: "arena",
    width: 320,
    rowHeight: 38,
    fontScale: 1,
    showTrophy: true,
    gap: 2,
  },
  cards: {
    winner: "editorial",
    countdown: "editorial",
    lowerThird: "editorial",
  },
  notifications: {
    template: "classic",
    showLogo: true,
    showKills: true,
    showRank: true,
    showRound: true,
    durationMs: 5000,
    position: {
      vertical: "bottom",
      horizontal: "left",
      offsetX: 48,
      offsetY: 288,
    },
  },
  leaderboard: {
    template: "classic",
    showTitle: true,
    title: "",
    subtitle: "",
    showLogo: true,
    showPlace: true,
    showElims: true,
    showTotal: true,
    showChickens: true,
    bannerImage: "",
    logoSize: 30,
    logoRounding: 4,
    footerNote: "",
    headerLabels: {
      rank: "RANK",
      team: "TEAM",
      place: "PLACE",
      elims: "ELIMS",
      total: "TOTAL",
    },
  },
  match: {
    template: "classic",
    showTitle: true,
    title: "",
    subtitle: "",
    showLogo: true,
    showRank: true,
    showElims: true,
    showPlace: true,
    showTotal: true,
    bannerImage: "",
    footerNote: "",
  },
  watermark: {
    enabled: false,
    image: "",
    corner: "top-right",
    size: 72,
    opacity: 0.85,
    offset: 24,
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

export type GameTheme = "universal" | "pubg" | "freefire";

export const GAME_LABELS: { key: GameTheme; label: string; blurb: string }[] = [
  {
    key: "pubg",
    label: "PUBG",
    blurb: "Battlegrounds, military and map-inspired themes",
  },
  {
    key: "freefire",
    label: "Free Fire",
    blurb: "Booyah, fire and character-inspired themes",
  },
  {
    key: "universal",
    label: "Universal",
    blurb: "Game-agnostic esports themes",
  },
];

export const TEMPLATE_LABELS: {
  key: OverlayTemplate;
  label: string;
  blurb: string;
}[] = [
  {
    key: "editorial-minimal",
    label: "Editorial Minimal",
    blurb: "Type-only broadcast strip with no panel background",
  },
  {
    key: "classic",
    label: "Classic Table",
    blurb: "Columns with the animated broadcast header",
  },
  {
    key: "lower-third",
    label: "Lower Third",
    blurb: "Angled broadcast bands, traditional esports look",
  },
  {
    key: "card-stack",
    label: "Card Stack",
    blurb: "One tile per team with the full team name",
  },
  {
    key: "big-board",
    label: "Big Board",
    blurb: "Large type built to be read at a glance",
  },
  {
    key: "hairline",
    label: "Hairline",
    blurb: "Type only, no panels, sits in the footage",
  },
  {
    key: "arena",
    label: "Arena Board",
    blurb: "Tactical rank blocks with glowing leader emphasis",
  },
  {
    key: "split",
    label: "Split Standings",
    blurb: "Two balanced standings lanes side by side",
  },
  {
    key: "ticker",
    label: "Broadcast Ticker",
    blurb: "Fast one-line standings with oversized points",
  },
  {
    key: "spotlight",
    label: "Leader Spotlight",
    blurb: "Hero leader card followed by the chasing pack",
  },
  {
    key: "scoreboard",
    label: "Scoreboard Grid",
    blurb: "Large score cards built for instant reading",
  },
  {
    key: "ledger",
    label: "Ledger Bands",
    blurb: "Full-width alternating bands with broadcast stats",
  },
  {
    key: "matrix",
    label: "Matrix Grid",
    blurb: "Dense three-column team tiles",
  },
  {
    key: "strip",
    label: "Compact Strip",
    blurb: "Stacked clipped strips with a strong leader line",
  },
];

export const SURFACE_STYLE_LABELS: {
  key: SurfaceStyle;
  label: string;
}[] = [
  { key: "transparent", label: "Transparent" },
  { key: "glass", label: "Glass" },
  { key: "gradient", label: "Gradient" },
  { key: "solid", label: "Solid" },
  { key: "none", label: "No panel" },
];

export const ENTRANCE_LABELS: {
  key: EntranceAnimation;
  label: string;
}[] = [
  { key: "fade-up", label: "Fade up" },
  { key: "fade", label: "Fade in" },
  { key: "slide-left", label: "Slide from left" },
  { key: "slide-right", label: "Slide from right" },
  { key: "scale", label: "Scale in" },
  { key: "flip", label: "Flip in" },
  { key: "none", label: "Instant" },
];

export const AMBIENT_LABELS: {
  key: AmbientEffect;
  label: string;
}[] = [
  { key: "float-shine", label: "Float + shine" },
  { key: "float", label: "Float" },
  { key: "shine", label: "Shine sweep" },
  { key: "pulse", label: "Pulse" },
];

export const WATERMARK_CORNER_LABELS: {
  key: WatermarkCorner;
  label: string;
}[] = [
  { key: "top-right", label: "Top right" },
  { key: "top-left", label: "Top left" },
  { key: "bottom-right", label: "Bottom right" },
  { key: "bottom-left", label: "Bottom left" },
];

export const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', sans-serif" },
  { label: "Rajdhani (tech)", value: "Rajdhani, sans-serif" },
  { label: "Teko (condensed)", value: "Teko, sans-serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
  { label: "Courier (mono)", value: "'Courier New', monospace" },
];

export type ThemeMotion =
  | "surge"
  | "pulse"
  | "glitch"
  | "sweep"
  | "rise"
  | "zoom"
  | "drift"
  | "flash"
  | "cascade"
  | "slide";

export type ThemePattern =
  | "grid"
  | "chevron"
  | "scan"
  | "hex"
  | "diagonal"
  | "dots"
  | "circuit"
  | "rays"
  | "rings"
  | "stripes"
  | "triangles"
  | "waves"
  | "crosshatch"
  | "mosaic";

export interface TablePreset {
  id: string;
  label: string;
  tagline: string;
  game: GameTheme;
  motion: ThemeMotion;
  pattern: ThemePattern;
  pointsTable: PointsTableSettings;
}

type ThemePresetDef = {
  id: string;
  label: string;
  tagline: string;
  game: GameTheme;
  motion: ThemeMotion;
  pattern: ThemePattern;
  design?: OverlayTemplate;
  base: string;
  accent: string;
  text: string;
  surfaceStyle?: SurfaceStyle;
  radius?: number;
  borderWidth?: number;
  width?: number;
  rowHeight?: number;
  gap?: number;
  fontFamily?: string;
};

const parseHex = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value.slice(0, 6);
  const number = Number.parseInt(full, 16);
  if (Number.isNaN(number)) return [0, 0, 0];
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
};

const mixHex = (from: string, to: string, amount: number) => {
  const [r1, g1, b1] = parseHex(from);
  const [r2, g2, b2] = parseHex(to);
  const ratio = Math.max(0, Math.min(1, amount));
  const channel = (a: number, b: number) =>
    Math.round(a + (b - a) * ratio)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
};

const paletteFrom = (
  base: string,
  accent: string,
  text: string
): PointsTableColors => ({
  ...DEFAULT_POINTS_TABLE.colors,
  headerFrom: base,
  headerTo: mixHex(base, accent, 0.2),
  rankFrom: mixHex(base, accent, 0.05),
  rankTo: mixHex(base, accent, 0.26),
  teamFrom: base,
  teamTo: mixHex(base, accent, 0.1),
  cellBg: mixHex(base, "#000000", 0.18),
  border: mixHex(base, accent, 0.44),
  borderSoft: mixHex(base, accent, 0.2),
  accent,
  aliveBar: mixHex(accent, "#34D399", 0.58),
  deadBar: mixHex(text, "#FB7185", 0.58),
  textPrimary: text,
  panelFrom: base,
  panelTo: mixHex(base, accent, 0.16),
  placeColor: mixHex(text, base, 0.46),
  elimColor: mixHex(text, accent, 0.42),
  totalColor: text,
  danger: mixHex(accent, "#FB7185", 0.52),
  warning: mixHex(accent, "#FBBF24", 0.5),
  notificationFrom: base,
  notificationTo: mixHex(base, accent, 0.18),
});

const FONT_STACKS = [
  "Bahnschrift, 'DIN Alternate', 'Segoe UI', sans-serif",
  "Oswald, 'Arial Narrow', sans-serif",
  "'Arial Black', Impact, sans-serif",
  "'Trebuchet MS', 'Segoe UI', sans-serif",
  "'Courier New', monospace",
  "Georgia, 'Times New Roman', serif",
];

const entranceFor = (motion: ThemeMotion): EntranceAnimation => {
  if (motion === "rise") return "fade-up";
  if (motion === "slide" || motion === "surge") return "slide-left";
  if (motion === "zoom" || motion === "pulse") return "scale";
  if (motion === "flash") return "fade";
  if (motion === "cascade") return "flip";
  if (motion === "drift") return "slide-right";
  return "slide-left";
};

const PRESET_DESIGNS: OverlayTemplate[] = [
  "arena",
  "editorial",
  "editorial-cards",
  "editorial-podium",
  "editorial-minimal",
  "split",
  "classic",
  "spotlight",
  "editorial-cards",
  "ticker",
  "lower-third",
  "ledger",
  "matrix",
  "editorial",
  "scoreboard",
  "strip",
  "big-board",
  "editorial-cards",
  "arena",
  "card-stack",
  "spotlight",
  "split",
  "hairline",
  "classic",
  "editorial-minimal",
  "editorial-podium",
  "scoreboard",
  "matrix",
  "ticker",
  "ledger",
];

const themePreset = (def: ThemePresetDef, index: number): TablePreset => {
  const colors = paletteFrom(def.base, def.accent, def.text);
  const design = def.design ?? PRESET_DESIGNS[index] ?? "arena";
  const surfaceStyle = def.surfaceStyle ?? "gradient";
  const glass = surfaceStyle === "glass";
  const fontFamily =
    def.fontFamily ?? FONT_STACKS[index % FONT_STACKS.length];
  return {
    id: def.id,
    label: def.label,
    tagline: def.tagline,
    game: def.game,
    motion: def.motion,
    pattern: def.pattern,
    pointsTable: {
      ...DEFAULT_POINTS_TABLE,
      preset: def.id,
      colors,
      typography: {
        ...DEFAULT_POINTS_TABLE.typography,
        fontFamily,
        fontScale: 1,
        uppercase: true,
        letterSpacing: index % 3 === 0 ? 0.4 : 0,
      },
      surface: {
        ...DEFAULT_POINTS_TABLE.surface,
        style: surfaceStyle,
        opacity: glass ? 0.76 : 0.95,
        blur: glass ? 18 : 10,
        radius: def.radius ?? (glass ? 12 : 2),
        borderWidth: def.borderWidth ?? 1,
        shadow: true,
        scanline: true,
        animate: true,
        entrance: entranceFor(def.motion),
        entranceDuration: 420 + (index % 5) * 60,
        stagger: 28 + (index % 6) * 8,
        ambient:
          def.motion === "pulse" || def.motion === "flash" ? "pulse" : "shine",
        gradientFrom: def.base,
        gradientTo: mixHex(def.base, def.accent, 0.18),
        gradientAngle: 90 + ((index * 37) % 180),
      },
      layout: {
        ...DEFAULT_POINTS_TABLE.layout,
        template: design,
        width: def.width ?? (300 + (index % 4) * 20),
        rowHeight: def.rowHeight ?? (index % 3 === 0 ? 36 : 38),
        fontScale: 1,
        showTrophy: true,
        gap: def.gap ?? (index % 2 === 0 ? 2 : 4),
      },
      cards: {
        winner: "editorial",
        countdown: "editorial",
        lowerThird: "editorial",
      },
    },
  };
};

const THEME_DEFS: ThemePresetDef[] = [];

const LEGACY_BASE_COLORS: PointsTableColors = {
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
};

const legacyPreset = (
  id: string,
  label: string,
  game: GameTheme,
  colors: Record<string, string>
): TablePreset => ({
  id,
  label,
  tagline: "Restored classic broadcast preset",
  game,
  motion: "surge",
  pattern: "grid",
  pointsTable: {
    ...structuredClone(DEFAULT_POINTS_TABLE),
    preset: id,
    colors: { ...LEGACY_BASE_COLORS, ...colors } as PointsTableColors,
    typography: {
      ...DEFAULT_POINTS_TABLE.typography,
      fontFamily: "",
      fontScale: 1,
      uppercase: true,
      letterSpacing: 0,
    },
    surface: {
      ...DEFAULT_POINTS_TABLE.surface,
      style: "transparent",
      opacity: 0.92,
      blur: 8,
      radius: 12,
      borderWidth: 1,
      shadow: true,
      scanline: false,
      animate: true,
      entrance: "fade-up",
      entranceDuration: 420,
      stagger: 30,
      ambient: "float-shine",
      backgroundImage: "",
      backgroundImageOpacity: 0.25,
      backgroundImageBlur: 0,
      gradientFrom: "",
      gradientTo: "",
      gradientAngle: 140,
    },
    layout: {
      ...DEFAULT_POINTS_TABLE.layout,
      template: "classic",
      width: 300,
      rowHeight: 36,
      fontScale: 1,
      showTrophy: true,
      gap: 0,
    },
    cards: {
      winner: "editorial",
      countdown: "editorial",
      lowerThird: "editorial",
    },
  },
});

export const LEGACY_TABLE_PRESETS: TablePreset[] = LEGACY_PRESET_DATA.map(
  (preset) => legacyPreset(preset.id, preset.label, preset.game, preset.colors)
);

export const TABLE_PRESETS: TablePreset[] = [
  ...LEGACY_TABLE_PRESETS,
  ...THEME_DEFS.map(themePreset),
];

export function getTablePreset(id?: string | null): TablePreset {
  return (
    TABLE_PRESETS.find((item) => item.id === id) ??
    TABLE_PRESETS.find((item) => item.id === DEFAULT_POINTS_TABLE.preset) ??
    TABLE_PRESETS[0]
  );
}

export function mergePointsTable(
  input?: Partial<PointsTableSettings> | null
): PointsTableSettings {
  if (!input) return structuredClone(DEFAULT_POINTS_TABLE);
  return {
    preset: input.preset ?? DEFAULT_POINTS_TABLE.preset,
    colors: { ...DEFAULT_POINTS_TABLE.colors, ...(input.colors ?? {}) },
    typography: {
      ...DEFAULT_POINTS_TABLE.typography,
      ...(input.typography ?? {}),
    },
    surface: { ...DEFAULT_POINTS_TABLE.surface, ...(input.surface ?? {}) },
    columns: { ...DEFAULT_POINTS_TABLE.columns, ...(input.columns ?? {}) },
    header: { ...DEFAULT_POINTS_TABLE.header, ...(input.header ?? {}) },
    layout: {
      ...DEFAULT_POINTS_TABLE.layout,
      ...(input.layout ?? {}),
      template:
        input.layout?.template &&
        !TEMPLATE_LABELS.some(({ key }) => key === input.layout?.template)
          ? DEFAULT_POINTS_TABLE.layout.template
          : input.layout?.template ?? DEFAULT_POINTS_TABLE.layout.template,
    },
    cards: { ...DEFAULT_POINTS_TABLE.cards, ...(input.cards ?? {}) },
    notifications: {
      ...DEFAULT_POINTS_TABLE.notifications,
      ...(input.notifications ?? {}),
      position: {
        ...DEFAULT_POINTS_TABLE.notifications.position,
        ...(input.notifications?.position ?? {}),
      },
    },
    leaderboard: {
      ...DEFAULT_POINTS_TABLE.leaderboard,
      ...(input.leaderboard ?? {}),
      headerLabels: {
        ...DEFAULT_POINTS_TABLE.leaderboard.headerLabels,
        ...(input.leaderboard?.headerLabels ?? {}),
      },
    },
    match: { ...DEFAULT_POINTS_TABLE.match, ...(input.match ?? {}) },
    watermark: { ...DEFAULT_POINTS_TABLE.watermark, ...(input.watermark ?? {}) },
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
