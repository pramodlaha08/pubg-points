"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  ScanText,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useTeams } from "@/hooks/useTeams";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DeleteDataButton } from "@/components/admin/DeleteDataButton";
import InlineAlert from "@/components/admin/InlineAlert";
import { ScreenshotViewer } from "@/components/admin/ScreenshotViewer";
import {
  toLobbyRow,
  uid,
  type LobbyRow,
  type LobbyRowInput,
} from "@/components/admin/PlayerMappingBoard";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";
import type { SavedRosterPlayer, TeamOption } from "@/types/verify";

const LOBBY_STATUS_VARIANT = {
  matched: "success",
  ambiguous: "warning",
  unmatched: "danger",
} as const;

const LOBBY_ROW_BG: Record<LobbyRow["status"], string> = {
  matched: "bg-emerald-500/5",
  ambiguous: "bg-amber-500/5",
  unmatched: "bg-red-500/5",
};

const LOBBY_ROW_ACCENT: Record<LobbyRow["status"], string> = {
  matched: "border-l-2 border-l-emerald-500",
  ambiguous: "border-l-2 border-l-amber-500",
  unmatched: "border-l-2 border-l-red-500",
};

const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error)
    ? (error.response?.data?.message as string | undefined)
    : undefined) || fallback;

export default function PlayersRegisterPage() {
  const { teams } = useTeams();
  const [roundNumber, setRoundNumber] = useState("1");

  const [serverTeams, setServerTeams] = useState<TeamOption[]>([]);
  // Always offer teams in slot order (S1, S2, …) so the dropdown is predictable.
  const teamOptions = useMemo(
    () =>
      [...(serverTeams.length ? serverTeams : teams)].sort(
        (a, b) => a.slot - b.slot,
      ),
    [serverTeams, teams],
  );

  const [lobbyBusy, setLobbyBusy] = useState(false);
  const [lobbyHash, setLobbyHash] = useState("");
  const [lobbyRaw, setLobbyRaw] = useState("");
  const [lobbyWarnings, setLobbyWarnings] = useState<string[]>([]);
  const [lobbyConfidence, setLobbyConfidence] = useState<number | null>(null);
  const [lobbyFromMemory, setLobbyFromMemory] = useState(0);
  const [lobbyEngine, setLobbyEngine] = useState("");
  const [lobbyImages, setLobbyImages] = useState(0);
  const [rows, setRows] = useState<LobbyRow[]>([]);
  const [lobbyFiles, setLobbyFiles] = useState<File[]>([]);
  const [savingRoster, setSavingRoster] = useState(false);
  const [rosterSaved, setRosterSaved] = useState(false);
  const [carriedFrom, setCarriedFrom] = useState<number | null>(null);

  const round = Number(roundNumber) || 0;

  const rosterStats = useMemo(() => {
    const assigned = rows.filter((row) => row.teamId).length;
    return { total: rows.length, assigned };
  }, [rows]);

  // Show players in slot order; rows without a slot stay at the end in the
  // order they were added, so a re-upload never reshuffles confirmed rows.
  const orderedRows = useMemo(() => {
    const withSlot = rows
      .filter((row) => String(row.slot).trim() !== "")
      .sort((a, b) => Number(a.slot) - Number(b.slot));
    const withoutSlot = rows.filter((row) => String(row.slot).trim() === "");
    return [...withSlot, ...withoutSlot];
  }, [rows]);

  // Load any previously saved roster for the selected round so a re-upload can
  // update only the unmatched rows and leave confirmed ones untouched. When the
  // round has no registration yet, carry the previous round's roster forward so
  // only the changes need reviewing.
  useEffect(() => {
    const roundNum = Number(roundNumber);
    setLobbyFiles([]);
    setCarriedFrom(null);
    if (!Number.isInteger(roundNum) || roundNum < 1) {
      setRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get("/match/roster", {
          params: { roundNumber: roundNum },
        });
        if (cancelled) return;
        const data = response.data?.data;
        const source = data?.roster ?? data?.previous ?? null;
        setCarriedFrom(data?.roster ? null : data?.previous?.roundNumber ?? null);
        const players: SavedRosterPlayer[] = source?.players ?? [];
        setRows(
          players.map((player) =>
            toLobbyRow({
              name: player.name,
              slot: player.slot,
              status: player.teamId ? "matched" : "unmatched",
              teamId: player.teamId,
              confidence: player.teamId ? 1 : 0,
              source: "saved",
              origin: "existing",
            })
          )
        );
        setLobbyHash(source?.imageHash ?? "");
        setLobbyRaw(source?.rawText ?? "");
      } catch {
        setRows([]);
        setCarriedFrom(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roundNumber]);

  const handleLobbyUpload = async (files: File[]) => {
    setLobbyFiles(files);
    setLobbyBusy(true);
    try {
      const form = new FormData();
      for (const file of files) form.append("images", file);
      form.append("roundNumber", String(round));
      const response = await api.post("/match/lobby", form);
      const data = response.data?.data;
      setLobbyHash(data.imageHash ?? "");
      setLobbyRaw(data.rawText ?? "");
      setLobbyWarnings(data.warnings ?? []);
      setCarriedFrom(data.carriedFrom ?? null);
      setLobbyConfidence(data.ocr?.confidence ?? null);
      setLobbyFromMemory(data.ocr?.fromMemory ?? 0);
      setLobbyEngine(data.ocr?.engine ?? "tesseract");
      setLobbyImages(data.ocr?.images ?? files.length);
      // The AI/OCR pass is constrained to the registered teams, but the server
      // can also refresh the team list we offer in the dropdown.
      if (Array.isArray(data.teams)) setServerTeams(data.teams);
      setRows(
        (data.entries ?? []).map((entry: LobbyRowInput) => toLobbyRow(entry))
      );
      setRosterSaved(false);
      notifySuccess(
        `Read ${data.entries?.length ?? 0} player row(s) from ${files.length} screenshot(s).`
      );
    } catch (error) {
      notifyError(errorMessage(error, "Could not process the lobby screenshot"));
    } finally {
      setLobbyBusy(false);
    }
  };

  const updateRow = (key: string, patch: Partial<LobbyRow>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const handleSaveRoster = async () => {
    const players = orderedRows
      .filter((row) => row.name)
      .map((row) => ({
        name: row.name,
        slot: row.slot ? Number(row.slot) : null,
        teamId: row.teamId || null,
      }));
    if (!players.length) {
      notifyError("Nothing to save — add at least one player row.");
      return;
    }
    setSavingRoster(true);
    try {
      await api.post("/match/roster", {
        roundNumber: round,
        players,
        imageHash: lobbyHash,
        rawText: lobbyRaw,
      });
      setRosterSaved(true);
      notifySuccess(`Saved ${players.length} player(s) for round ${round}.`);
    } catch (error) {
      notifyError(errorMessage(error, "Could not save the player mapping"));
    } finally {
      setSavingRoster(false);
    }
  };

  const resetAll = () => {
    setServerTeams([]);
    setLobbyHash("");
    setLobbyRaw("");
    setLobbyWarnings([]);
    setLobbyConfidence(null);
    setLobbyFromMemory(0);
    setLobbyEngine("");
    setLobbyImages(0);
    setRows([]);
    setLobbyFiles([]);
    setRosterSaved(false);
    setCarriedFrom(null);
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Players Register"
        description="Register players from a lobby screenshot for the selected round"
        actions={
          <>
            <DeleteDataButton allData onCleared={resetAll} />
            <Link href="/admin/live">
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
                Leaderboard
              </Button>
            </Link>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
              Match / Round number
            </label>
            <Input
              type="number"
              min={1}
              value={roundNumber}
              onChange={(event) => setRoundNumber(event.target.value)}
            />
          </div>
          <p className="mr-auto text-xs text-[var(--adm-muted)]">
            Player registrations are stored per round. Pick the round before
            uploading.
          </p>
          <DeleteDataButton roundNumber={round} onCleared={resetAll} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Register players from lobby screenshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--adm-border)] bg-transparent px-3 py-2 text-sm hover:bg-[var(--adm-surface-2)]">
              <ImageIcon className="h-4 w-4" />
              Choose lobby screenshot(s)
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/bmp"
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length) void handleLobbyUpload(files);
                  event.target.value = "";
                }}
              />
            </label>
            {lobbyBusy && (
              <span className="flex items-center gap-2 text-sm text-[var(--adm-muted)]">
                <ScanText className="h-4 w-4 animate-pulse" />
                Reading screenshot(s)...
              </span>
            )}
            {lobbyImages > 0 && !lobbyBusy && (
              <Badge variant="muted">{lobbyImages} image(s)</Badge>
            )}
            {lobbyConfidence != null && !lobbyBusy && (
              <Badge
                variant={
                  lobbyConfidence >= 75
                    ? "success"
                    : lobbyConfidence >= 55
                    ? "warning"
                    : "danger"
                }
              >
                OCR {Math.round(lobbyConfidence)}%
              </Badge>
            )}
            {lobbyFromMemory > 0 && (
              <Badge variant="info">{lobbyFromMemory} remembered</Badge>
            )}
            {lobbyEngine.startsWith("ai:") && (
              <Badge variant="info">AI assist</Badge>
            )}
            {lobbyEngine === "tesseract" && (
              <Badge variant="warning">OCR fallback</Badge>
            )}
            {rosterSaved && <Badge variant="success">Saved</Badge>}
          </div>

          {lobbyWarnings.length > 0 && (
            <InlineAlert tone="warning">
              {lobbyWarnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </InlineAlert>
          )}

          {carriedFrom !== null && (
            <InlineAlert tone="success">
              <p>
                Carried the round {carriedFrom} registration forward. Review it,
                delete any team that is not playing this round, then save.
              </p>
            </InlineAlert>
          )}

          {rows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--adm-muted)]">
                  Correct names and team assignments, then save the registration.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setRows((prev) => [
                      ...prev,
                      {
                        key: uid(),
                        name: "",
                        slot: "",
                        teamId: "",
                        status: "unmatched",
                        confidence: 0,
                        source: "fuzzy",
                        suggestion: null,
                        origin: "new",
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add row
                </Button>
              </div>

              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH className="w-16">Slot</TH>
                    <TH>Extracted name</TH>
                    <TH className="w-56">Assign to team</TH>
                    <TH className="w-28">Match</TH>
                    <TH className="w-10" />
                  </TR>
                </THead>
                <TBody>
                  {orderedRows.map((row) => (
                    <TR key={row.key} className={LOBBY_ROW_BG[row.status]}>
                      <TD className={LOBBY_ROW_ACCENT[row.status]}>
                        <Input
                          type="number"
                          min={1}
                          max={25}
                          value={row.slot}
                          onChange={(event) =>
                            updateRow(row.key, { slot: event.target.value })
                          }
                          className="h-8 w-14"
                        />
                      </TD>
                      <TD>
                        <Input
                          value={row.name}
                          onChange={(event) =>
                            updateRow(row.key, { name: event.target.value })
                          }
                          className="h-8"
                        />
                        {row.origin !== "new" && (
                          <p className="mt-1 text-[11px] text-[var(--adm-muted)]">
                            {row.origin === "existing"
                              ? "Saved previously"
                              : "Updated from screenshot"}
                          </p>
                        )}
                      </TD>
                      <TD>
                        <Select
                          value={row.teamId}
                          onChange={(event) =>
                            updateRow(row.key, { teamId: event.target.value })
                          }
                          className="h-8"
                        >
                          <option value="">— none —</option>
                          {teamOptions.map((team) => (
                            <option key={team._id} value={team._id}>
                              S{team.slot} · {team.name}
                            </option>
                          ))}
                        </Select>
                        {row.suggestion && !row.teamId && (
                          <p className="mt-1 text-[11px] text-[var(--adm-muted)]">
                            Suggestion: {row.suggestion}
                          </p>
                        )}
                        {row.source === "memory" && row.teamId ? (
                          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                            Remembered from a previous match
                          </p>
                        ) : row.source === "slot" && row.teamId ? (
                          <p className="mt-1 text-[11px] text-[var(--adm-muted)]">
                            Matched by team slot
                          </p>
                        ) : null}
                      </TD>
                      <TD>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={LOBBY_STATUS_VARIANT[row.status]}>
                            {row.status}
                          </Badge>
                          {row.confidence > 0 && (
                            <span className="text-[11px] text-[var(--adm-muted)]">
                              {Math.round(row.confidence * 100)}% match
                            </span>
                          )}
                        </div>
                      </TD>
                      <TD>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setRows((prev) => prev.filter((r) => r.key !== row.key))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>

              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--adm-muted)]">
                  {rosterStats.assigned}/{rosterStats.total} row(s) assigned to a
                  team.
                </p>
                <Button onClick={handleSaveRoster} disabled={savingRoster}>
                  <CheckCircle2 className="h-4 w-4" />
                  {savingRoster ? "Saving..." : "Save registration"}
                </Button>
              </div>

              {lobbyFiles.length > 0 && (
                <ScreenshotViewer files={lobbyFiles} label="Lobby screenshot(s)" />
              )}
            </div>
          )}

          {rows.length === 0 && !lobbyBusy && (
            <p className="text-sm text-[var(--adm-muted)]">
              Upload the lobby screenshot showing slots and player names to begin.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-[var(--adm-muted)]">
        Registering players is best-effort OCR: always review the names and team
        assignments before saving. Saved registrations feed the Auto Scoring step.
      </p>
    </div>
  );
}
