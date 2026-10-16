"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { LobbyOrigin, LobbySource, TeamOption } from "@/types/verify";

export type LobbyRow = {
  key: string;
  name: string;
  slot: string;
  teamId: string;
  status: "matched" | "ambiguous" | "unmatched";
  confidence: number;
  source: LobbySource;
  suggestion: string | null;
  origin: LobbyOrigin;
};

export type LobbyRowInput = {
  name: string;
  slot: number | null;
  status: LobbyRow["status"];
  teamId: string | null;
  confidence?: number;
  source?: LobbySource;
  candidates?: { name: string }[];
  origin?: LobbyOrigin;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const toLobbyRow = (entry: LobbyRowInput): LobbyRow => ({
  key: uid(),
  name: entry.name,
  slot: entry.slot != null ? String(entry.slot) : "",
  teamId: entry.status === "matched" ? entry.teamId ?? "" : "",
  status: entry.status,
  confidence: entry.confidence ?? 0,
  source: entry.source ?? "fuzzy",
  suggestion:
    entry.status !== "matched" && entry.candidates?.length
      ? entry.candidates[0].name
      : null,
  origin: entry.origin ?? "new",
});

type MappingTeamCardProps = {
  team: TeamOption;
  players: LobbyRow[];
  teamOptions: TeamOption[];
  onRename: (key: string, name: string) => void;
  onMove: (key: string, teamId: string) => void;
  onRemove: (key: string) => void;
  onAdd: (teamId: string, name: string) => void;
};

function MappingTeamCard({
  team,
  players,
  teamOptions,
  onRename,
  onMove,
  onRemove,
  onAdd,
}: MappingTeamCardProps) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    onAdd(team._id, name);
    setDraft("");
  };

  return (
    <div className="rounded-md bg-[var(--adm-surface-2)] p-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">
          S{team.slot} · {team.name}
        </p>
        <Badge variant="muted">{players.length}</Badge>
      </div>

      <div className="mt-1 space-y-1">
        {players.map((row) => (
          <div key={row.key} className="flex items-center gap-1">
            <Input
              value={row.name}
              onChange={(event) => onRename(row.key, event.target.value)}
              className="h-7 text-[11px]"
            />
            <Select
              value={row.teamId}
              onChange={(event) => onMove(row.key, event.target.value)}
              className="h-7 w-20 text-[11px]"
            >
              <option value="">— none —</option>
              {teamOptions.map((option) => (
                <option key={option._id} value={option._id}>
                  S{option.slot} · {option.name}
                </option>
              ))}
            </Select>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(row.key)}
              aria-label="Remove player"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center gap-1">
        <Input
          value={draft}
          placeholder="Add player"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="h-7 text-[11px]"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={submit}
          aria-label="Add player"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function PlayerMappingBoard({
  rows,
  setRows,
  teams,
}: {
  rows: LobbyRow[];
  setRows: React.Dispatch<React.SetStateAction<LobbyRow[]>>;
  teams: TeamOption[];
}) {
  // Keep teams (cards and every "assign to team" dropdown) in slot order.
  const orderedTeams = useMemo(
    () => [...teams].sort((a, b) => a.slot - b.slot),
    [teams]
  );

  const teamById = useMemo(
    () => new Map(orderedTeams.map((team) => [team._id, team])),
    [orderedTeams]
  );

  // Live "which player -> which team" groupings derived from the editable rows.
  const { byTeam, unassigned } = useMemo(() => {
    const grouped = new Map<string, LobbyRow[]>();
    const loose: LobbyRow[] = [];
    for (const row of rows) {
      if (!row.name.trim()) continue;
      if (row.teamId && teamById.has(row.teamId)) {
        if (!grouped.has(row.teamId)) grouped.set(row.teamId, []);
        grouped.get(row.teamId)!.push(row);
      } else {
        loose.push(row);
      }
    }
    return { byTeam: grouped, unassigned: loose };
  }, [rows, teamById]);

  const renamePlayer = (key: string, name: string) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, name } : row))
    );

  const movePlayer = (key: string, teamId: string) =>
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? { ...row, teamId, status: teamId ? "matched" : "unmatched" }
          : row
      )
    );

  const removePlayer = (key: string) =>
    setRows((prev) => prev.filter((row) => row.key !== key));

  const addPlayerToTeam = (teamId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRows((prev) => [
      ...prev,
      {
        key: uid(),
        name: trimmed,
        slot: "",
        teamId,
        status: "matched",
        confidence: 0,
        source: "fuzzy",
        suggestion: null,
        origin: "new",
      },
    ]);
  };

  const assigned = rows.filter((row) => row.teamId).length;

  return (
    <div className="rounded-lg border border-[var(--adm-border)] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium">
          Mapping overview — add, rename, move or remove players per team
        </p>
        <span className="text-[11px] text-[var(--adm-muted)]">
          {assigned}/{rows.length} assigned
        </span>
      </div>

      {teams.length === 0 ? (
        <p className="text-[11px] text-[var(--adm-muted)]">
          No teams available for this tournament yet.
        </p>
      ) : (
        <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {orderedTeams.map((team) => (
            <MappingTeamCard
              key={team._id}
              team={team}
              players={byTeam.get(team._id) ?? []}
              teamOptions={orderedTeams}
              onRename={renamePlayer}
              onMove={movePlayer}
              onRemove={removePlayer}
              onAdd={addPlayerToTeam}
            />
          ))}
        </div>
      )}

      {unassigned.length > 0 && (
        <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2">
          <p className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Unassigned ({unassigned.length})
          </p>
          <div className="space-y-1">
            {unassigned.map((row) => (
              <div key={row.key} className="flex items-center gap-1">
                <Input
                  value={row.name}
                  onChange={(event) => renamePlayer(row.key, event.target.value)}
                  className="h-7 text-[11px]"
                />
                <Select
                  value=""
                  onChange={(event) => movePlayer(row.key, event.target.value)}
                  className="h-7 w-32 text-[11px]"
                >
                  <option value="">Assign to…</option>
                  {orderedTeams.map((team) => (
                    <option key={team._id} value={team._id}>
                      S{team.slot} · {team.name}
                    </option>
                  ))}
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removePlayer(row.key)}
                  aria-label="Remove player"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
