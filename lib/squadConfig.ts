/**
 * Squad Size Configuration (Frontend)
 * Controls player count per team across the entire UI system
 * 
 * Supported values: 2 (duo), 4 (squad)
 * Reads from NEXT_PUBLIC_TEAM_SQUAD_SIZE environment variable
 * Default: 4
 */

const SQUAD_SIZE = process.env.NEXT_PUBLIC_TEAM_SQUAD_SIZE
  ? parseInt(process.env.NEXT_PUBLIC_TEAM_SQUAD_SIZE, 10)
  : 4;

if (![2, 4].includes(SQUAD_SIZE)) {
  console.warn(
    `Invalid NEXT_PUBLIC_TEAM_SQUAD_SIZE: ${SQUAD_SIZE}. Must be 2 or 4. Defaulting to 4.`
  );
}

export const SQUAD_CONFIG = {
  /** Maximum players per team */
  maxPlayers: SQUAD_SIZE,
  /** Maximum player index (0-based) */
  maxPlayerIndex: SQUAD_SIZE - 1,
  /** Valid elimination states: full elimination at this count */
  fullEliminationCount: SQUAD_SIZE,
  /** Player display format (e.g., "P1", "P2") */
  getPlayerLabel: (index: number): string => `P${index + 1}`,
  /** Validation helper for player indices */
  isValidPlayerIndex: (index: unknown): index is number =>
    typeof index === "number" && index >= 0 && index < SQUAD_SIZE,
  /** Generate array of player indices for iteration */
  playerIndices: (): number[] => Array.from({ length: SQUAD_SIZE }, (_, i) => i),
};

export default SQUAD_CONFIG;
