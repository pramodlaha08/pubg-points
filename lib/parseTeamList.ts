export type ParsedTeamStatus =
  | "new"
  | "update"
  | "unchanged"
  | "conflict"
  | "duplicate"
  | "invalid";

export interface ParsedTeamRow {
  raw: string;
  slot: number | null;
  name: string;
  status: ParsedTeamStatus;
  note?: string;
}

export interface ExistingTeamRef {
  slot: number;
  name: string;
}

const BORDER_ONLY =
  /^[\s│┃|┌┐└┘├┤┬┴┼─━═▬•·✦✧★☆\-–—_=]+$/;

const LEADING_SEPARATORS = /^[\s✦✧★☆•·>*:#|│┃\-–—]+/;
const TRAILING_SEPARATORS = /[\s|│┃✦✧★☆•·_=]+$/;
const TRAILING_FRACTION = /\s+[0-9]+\s*\/\s*[0-9]+\s*$/;
const SLOT_TOKEN = /slot\s*([0-9]{1,3})/i;

export function normalizeLine(input: string): string {
  return input.normalize("NFKC");
}

/**
 * Parse a pasted slot list into structured team rows.
 *
 * Handles fancy unicode (e.g. 𝐒𝐋𝐎𝐓 𝟎𝟑, fullwidth digits), box-drawing
 * borders, ✦ separators and trailing "x/y" score fractions.
 */
export function parseTeamList(
  input: string,
  existing: ExistingTeamRef[] = []
): ParsedTeamRow[] {
  const existingBySlot = new Map(existing.map((t) => [t.slot, t.name]));
  const existingByName = new Map(
    existing.map((t) => [t.name.toLowerCase(), t.slot])
  );

  const rows: ParsedTeamRow[] = [];
  const seenSlots = new Set<number>();

  for (const rawLine of input.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (BORDER_ONLY.test(trimmed)) continue;

    const line = normalizeLine(trimmed);
    const match = line.match(SLOT_TOKEN);

    if (!match || match.index === undefined) {
      rows.push({
        raw: trimmed,
        slot: null,
        name: "",
        status: "invalid",
        note: "No slot number found",
      });
      continue;
    }

    const slot = parseInt(match[1], 10);
    const remainder = line.slice(match.index + match[0].length);
    const name = remainder
      .replace(LEADING_SEPARATORS, "")
      .replace(TRAILING_FRACTION, "")
      .replace(TRAILING_SEPARATORS, "")
      .trim();

    if (!name) {
      rows.push({
        raw: trimmed,
        slot,
        name: "",
        status: "invalid",
        note: "Missing team name",
      });
      continue;
    }

    let status: ParsedTeamStatus;
    let note: string | undefined;

    if (seenSlots.has(slot)) {
      status = "duplicate";
      note = "Duplicate slot in list";
    } else {
      const occupiedName = existingByName.get(name.toLowerCase());
      const currentName = existingBySlot.get(slot);

      if (currentName !== undefined) {
        if (currentName === name) {
          status = "unchanged";
        } else if (occupiedName !== undefined && occupiedName !== slot) {
          status = "conflict";
          note = `Name already used by slot ${occupiedName}`;
        } else {
          status = "update";
          note = `Renames slot ${slot} ("${currentName}")`;
        }
      } else if (occupiedName !== undefined) {
        status = "conflict";
        note = `Name already used by slot ${occupiedName}`;
      } else {
        status = "new";
      }
    }

    seenSlots.add(slot);
    rows.push({ raw: trimmed, slot, name, status, note });
  }

  return rows;
}

export const STATUS_LABEL: Record<ParsedTeamStatus, string> = {
  new: "New",
  update: "Update",
  unchanged: "Unchanged",
  conflict: "Conflict",
  duplicate: "Duplicate",
  invalid: "Invalid",
};
