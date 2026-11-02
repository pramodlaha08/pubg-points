import type {
  BroadcastLayout,
  BroadcastLayoutEntry,
  BroadcastLayoutKey,
} from "@/types/broadcast";

export const DEFAULT_BROADCAST_LAYOUT: BroadcastLayout = {
  pointsTable: { x: 3.5, y: 16, width: 0, scale: 100 },
  killFeed: { x: 80, y: 66, width: 0, scale: 100 },
  notification: { x: 4, y: 64, width: 24, scale: 100 },
  lowerThird: { x: 4, y: 80, width: 34, scale: 100 },
  countdown: { x: 42.5, y: 4, width: 0, scale: 100 },
  winner: { x: 22, y: 25, width: 56, scale: 100 },
};

export const LAYOUT_KEYS = Object.keys(
  DEFAULT_BROADCAST_LAYOUT
) as BroadcastLayoutKey[];

export const LAYOUT_LABELS: Record<BroadcastLayoutKey, string> = {
  pointsTable: "Points table",
  killFeed: "Kill feed",
  notification: "Elimination notification",
  lowerThird: "Lower third",
  countdown: "Countdown",
  winner: "Winner splash",
};

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
};

export const normalizeLayoutEntry = (
  entry: Partial<BroadcastLayoutEntry> | undefined,
  fallback: BroadcastLayoutEntry
): BroadcastLayoutEntry => ({
  x: clamp(entry?.x, 0, 100, fallback.x),
  y: clamp(entry?.y, 0, 100, fallback.y),
  width: clamp(entry?.width, 0, 100, fallback.width),
  scale: clamp(entry?.scale, 40, 200, fallback.scale),
});

export const normalizeLayout = (
  layout?: Partial<BroadcastLayout> | null
): BroadcastLayout =>
  Object.fromEntries(
    LAYOUT_KEYS.map((key) => [
      key,
      normalizeLayoutEntry(layout?.[key], DEFAULT_BROADCAST_LAYOUT[key]),
    ])
  ) as BroadcastLayout;

export const cloneLayout = (layout?: Partial<BroadcastLayout> | null) =>
  normalizeLayout(layout);
