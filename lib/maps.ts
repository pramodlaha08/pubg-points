export const PUBG_MAPS = ["Erangel", "Miramar", "Rondo", "Sanhok"] as const;

export type PubgMap = (typeof PUBG_MAPS)[number];

export const isKnownMap = (value: string): value is PubgMap =>
  (PUBG_MAPS as readonly string[]).includes(value);
