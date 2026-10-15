"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  ScanText,
  Trash2,
  Upload,
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
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ScreenshotViewer } from "@/components/admin/ScreenshotViewer";
import { DeleteDataButton } from "@/components/admin/DeleteDataButton";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";
import {
  toLobbyRow,
  uid,
  type LobbyRow,
  type LobbyRowInput,
} from "@/components/admin/PlayerMappingBoard";
import type {
  ComparisonRow,
  EditableResultRow,
  PointsPreview,
  ResultsMappingRow,
  SavedRosterPlayer,
  TeamOption,
} from "@/types/verify";

const LOBBY_STATUS_VARIANT = {
  matched: "success",
  ambiguous: "warning",
  unmatched: "danger",
} as const;

const RESULT_STATUS_VARIANT = {
  match: "success",
  mismatch: "warning",
  unmatched: "muted",
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

const RESULT_ROW_BG: Record<EditableResultRow["status"], string> = {
  match: "bg-emerald-500/5",
  mismatch: "bg-amber-500/5",
  unmatched: "bg-slate-500/5",
};

const RESULT_ROW_ACCENT: Record<EditableResultRow["status"], string> = {
  match: "border-l-2 border-l-emerald-500",
  mismatch: "border-l-2 border-l-amber-500",
  unmatched: "border-l-2 border-l-slate-400",
};

const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error)
    ? (error.response?.data?.message as string | undefined)
    : undefined) || fallback;

function Alert({
  tone,
  children,
}: {
  tone: "warning" | "success";
  children: React.ReactNode;
}) {
  const styles =
    tone === "warning"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {tone === "warning" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function AutoScoringPage() {
  const { teams } = useTeams();
  const [roundNumber, setRoundNumber] = useState("1");

  const [serverTeams, setServerTeams] = useState<TeamOption[]>([]);
  const teamOptions = serverTeams.length ? serverTeams : teams;

  // Lobby / registration step
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

  // Results step
  const [resultBusy, setResultBusy] = useState(false);
  const [resultHash, setResultHash] = useState("");
  const [resultRaw, setResultRaw] = useState("");
  const [resultWarnings, setResultWarnings] = useState<string[]>([]);
  const [resultImages, setResultImages] = useState(0);
  const [serverResultsMapping, setServerResultsMapping] = useState<
    ResultsMappingRow[]
  >([]);
  const [comparison, setComparison] = useState<EditableResultRow[]>([]);
  const [unmatched, setUnmatched] = useState<ComparisonRow[] | { name: string }[]>([]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [resultFiles, setResultFiles] = useState<File[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PointsPreview | null>(null);

  const round = Number(roundNumber) || 0;

  const rosterStats = useMemo(() => {
    const assigned = rows.filter((row) => row.teamId).length;
    return { total: rows.length, assigned };
  }, [rows]);

  // Live per-team results mapping (players from the saved roster + edited kills).
  const resultsMapping = useMemo(() => {
    const playersById = new Map(
      serverResultsMapping.map((item) => [item.teamId, item.players])
    );
    return comparison.map((row) => ({
      teamId: row.teamId,
      slot: row.slot,
      name: row.name,
      players: playersById.get(row.teamId) ?? [],
      verifiedKills: row.verifiedKills === "" ? null : Number(row.verifiedKills),
      verifiedPosition:
        row.verifiedPosition === "" ? null : Number(row.verifiedPosition),
      status: row.status,
    }));
  }, [comparison, serverResultsMapping]);

  // Load any previously saved roster for the selected round so a re-upload can
  // update only the unmatched rows and leave confirmed ones untouched.
  useEffect(() => {
    const roundNum = Number(roundNumber);
    setLobbyFiles([]);
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
        const players: SavedRosterPlayer[] =
          response.data?.data?.roster?.players ?? [];
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
        setLobbyHash(response.data?.data?.roster?.imageHash ?? "");
        setLobbyRaw(response.data?.data?.roster?.rawText ?? "");
      } catch {
        /* no saved roster for this round */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roundNumber]);

  const handleLobbyUpload = async (files: File[]) => {
    if (!files.length) return;
    setLobbyFiles(files);
    setLobbyBusy(true);
    setRosterSaved(false);
    try {
      const form = new FormData();
      for (const file of files) form.append("images", file);
      form.append("roundNumber", String(round));
      const response = await api.post("/match/lobby", form);
      const data = response.data?.data;
      setServerTeams(data.teams ?? []);
      setLobbyHash(data.imageHash ?? "");
      setLobbyRaw(data.rawText ?? "");
      setLobbyWarnings(data.warnings ?? []);
      setLobbyConfidence(data.ocr?.confidence ?? null);
      setLobbyFromMemory(data.ocr?.fromMemory ?? 0);
      setLobbyEngine(data.ocr?.engine ?? "tesseract");
      setLobbyImages(data.ocr?.images ?? files.length);
      setRows(
        (data.entries ?? []).map((entry: LobbyRowInput) => toLobbyRow(entry))
      );
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
    const players = rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        slot: row.slot === "" ? null : Number(row.slot),
        teamId: row.teamId || null,
      }));
    if (!players.length) {
      return notifyError("No players to save");
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
      notifySuccess(`Saved ${players.length} player mapping(s) for round ${round}.`);
    } catch (error) {
      notifyError(errorMessage(error, "Could not save the roster"));
    } finally {
      setSavingRoster(false);
    }
  };

  const handleResultUpload = async (files: File[]) => {
    if (!files.length) return;
    setResultFiles(files);
    setResultBusy(true);
    setApplied(false);
    setPreviewData(null);
    setPreviewOpen(false);
    try {
      const form = new FormData();
      for (const file of files) form.append("images", file);
      form.append("roundNumber", String(round));
      const response = await api.post("/match/results", form);
      const data = response.data?.data;
      setResultHash(data.imageHash ?? "");
      setResultRaw(data.rawText ?? "");
      setResultWarnings(data.warnings ?? []);
      setResultImages(data.ocr?.images ?? files.length);
      setServerResultsMapping(data.mapping ?? []);
      setUnmatched(data.unmatched ?? []);
      setComparison(
        (data.comparison ?? []).map((row: ComparisonRow) => ({
          teamId: row.teamId,
          slot: row.slot,
          name: row.name,
          liveKills: row.liveKills,
          livePosition: row.livePosition,
          livePlacementPoints: row.livePlacementPoints,
          verifiedKills: row.verifiedKills == null ? "" : String(row.verifiedKills),
          verifiedPosition:
            row.verifiedPosition == null ? "" : String(row.verifiedPosition),
          status: row.status,
        }))
      );
      notifySuccess(
        `Results processed from ${files.length} screenshot(s). Review the differences below.`
      );
    } catch (error) {
      notifyError(errorMessage(error, "Could not process the results screenshot"));
    } finally {
      setResultBusy(false);
    }
  };

  const updateComparison = (teamId: string, patch: Partial<EditableResultRow>) => {
    setComparison((prev) =>
      prev.map((row) => (row.teamId === teamId ? { ...row, ...patch } : row))
    );
  };

  const buildVerified = () =>
    comparison
      .map((row) => ({
        slot: row.slot,
        teamId: row.teamId,
        kills: row.verifiedKills === "" ? null : Number(row.verifiedKills),
        position: row.verifiedPosition === "" ? null : Number(row.verifiedPosition),
      }))
      .filter((row) => row.kills !== null || row.position !== null);

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
    setResultHash("");
    setResultRaw("");
    setResultWarnings([]);
    setResultImages(0);
    setServerResultsMapping([]);
    setComparison([]);
    setUnmatched([]);
    setApplied(false);
    setResultFiles([]);
    setPreviewData(null);
    setPreviewOpen(false);
  };

  const requestApply = async () => {
    const verified = buildVerified();
    if (!verified.length) {
      return notifyError("Nothing to apply — no verified values to write.");
    }
    setPreviewLoading(true);
    try {
      const response = await api.post("/match/preview", {
        roundNumber: round,
        verified,
      });
      setPreviewData((response.data?.data as PointsPreview) ?? null);
      setPreviewOpen(true);
    } catch (error) {
      notifyError(errorMessage(error, "Could not compute the points preview"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const doApply = async (force = false) => {    const verified = buildVerified();
    if (!verified.length) {
      return notifyError("Nothing to apply — no verified values to write.");
    }

    setApplying(true);
    try {
      const comparisonPayload = comparison.map((row) => ({
        slot: row.slot,
        teamId: row.teamId,
        name: row.name,
        liveKills: row.liveKills,
        verifiedKills: row.verifiedKills === "" ? null : Number(row.verifiedKills),
        livePosition: row.livePosition,
        verifiedPosition:
          row.verifiedPosition === "" ? null : Number(row.verifiedPosition),
        livePlacementPoints: row.livePlacementPoints,
        status: row.status,
      }));

      await api.post("/match/apply", {
        roundNumber: round,
        imageHash: resultHash,
        verified,
        comparison: comparisonPayload,
        unmatched,
        rawText: resultRaw,
        force,
      });
      setApplied(true);
      setPreviewOpen(false);
      notifySuccess("Leaderboard updated with the verified results.");
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        const retry = window.confirm(
          `${errorMessage(error, "This screenshot was already applied.")}\n\nApply again anyway?`
        );
        if (retry) {
          await doApply(true);
        }
      } else {
        notifyError(errorMessage(error, "Could not apply the verified results"));
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Auto Scoring"
        description="Register players from a lobby screenshot, then verify results from the final screenshot"
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
            Player mappings and verified results are stored per round. Pick the
            round before uploading.
          </p>
          <DeleteDataButton roundNumber={round} onCleared={resetAll} />
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Step 1 — Lobby registration                                      */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--adm-primary)] text-xs text-[var(--adm-primary-fg)]">
              1
            </span>
            Register players from lobby screenshot
          </CardTitle>
          {rosterSaved && <Badge variant="success">Roster saved</Badge>}
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
          </div>

          {lobbyWarnings.length > 0 && (
            <Alert tone="warning">
              {lobbyWarnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </Alert>
          )}

          {rows.length > 0 && (
            <div
              className={
                lobbyFiles.length
                  ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
                  : "space-y-4"
              }
            >
              <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--adm-muted)]">
                  {rosterStats.assigned}/{rosterStats.total} rows assigned to a team.
                  Correct names and team assignments before saving.
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
                  {rows.map((row) => (
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

              <div className="flex justify-end">
                <Button onClick={handleSaveRoster} disabled={savingRoster}>
                  <CheckCircle2 className="h-4 w-4" />
                  {savingRoster ? "Saving..." : "Save player mapping"}
                </Button>
              </div>
              </div>
              {lobbyFiles.length > 0 && (
                <div className="h-fit lg:sticky lg:top-4">
                  <ScreenshotViewer files={lobbyFiles} label="Lobby screenshot(s)" />
                </div>
              )}
            </div>
          )}

          {rows.length === 0 && !lobbyBusy && (
            <EmptyState
              icon={ImageIcon}
              title="No lobby screenshot yet"
              description="Upload the lobby screenshot showing slots and player names to begin."
            />
          )}
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Step 2 — Results verification                                    */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--adm-primary)] text-xs text-[var(--adm-primary-fg)]">
              2
            </span>
            Verify results from final screenshot
          </CardTitle>
          {applied && <Badge variant="success">Applied</Badge>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--adm-border)] bg-transparent px-3 py-2 text-sm hover:bg-[var(--adm-surface-2)]">
              <ImageIcon className="h-4 w-4" />
              Choose results screenshot(s)
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/bmp"
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length) void handleResultUpload(files);
                  event.target.value = "";
                }}
              />
            </label>
            {resultBusy && (
              <span className="flex items-center gap-2 text-sm text-[var(--adm-muted)]">
                <ScanText className="h-4 w-4 animate-pulse" />
                Reading screenshot(s)...
              </span>
            )}
            {resultImages > 0 && !resultBusy && (
              <Badge variant="muted">{resultImages} image(s)</Badge>
            )}
          </div>

          {resultWarnings.length > 0 && (
            <Alert tone="warning">
              {resultWarnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </Alert>
          )}

          {comparison.length > 0 && (
            <div
              className={
                resultFiles.length
                  ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
                  : "space-y-4"
              }
            >
              <div className="space-y-4">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Team</TH>
                    <TH className="w-14">Slot</TH>
                    <TH className="w-20">Live Kills</TH>
                    <TH className="w-24">Verified Kills</TH>
                    <TH className="w-24">Live Pts</TH>
                    <TH className="w-24">Verified Pts</TH>
                    <TH className="w-20">Position</TH>
                    <TH className="w-24">Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {comparison.map((row) => {
                    const verifiedPositionNum =
                      row.verifiedPosition === "" ? null : Number(row.verifiedPosition);
                    return (
                      <TR key={row.teamId} className={RESULT_ROW_BG[row.status]}>
                        <TD
                          className={`font-medium ${RESULT_ROW_ACCENT[row.status]}`}
                        >
                          {row.name}
                        </TD>
                        <TD className="text-[var(--adm-muted)]">{row.slot}</TD>
                        <TD>{row.liveKills}</TD>
                        <TD>
                          <Input
                            type="number"
                            min={0}
                            value={row.verifiedKills}
                            onChange={(event) =>
                              updateComparison(row.teamId, {
                                verifiedKills: event.target.value,
                              })
                            }
                            className="h-8 w-20"
                          />
                        </TD>
                        <TD>{row.livePlacementPoints}</TD>
                        <TD className="text-[var(--adm-muted)]">
                          {verifiedPositionNum != null
                            ? `position ${verifiedPositionNum}`
                            : "—"}
                        </TD>
                        <TD>
                          <Input
                            type="number"
                            min={0}
                            value={row.verifiedPosition}
                            onChange={(event) =>
                              updateComparison(row.teamId, {
                                verifiedPosition: event.target.value,
                              })
                            }
                            className="h-8 w-16"
                          />
                        </TD>
                        <TD>
                          <Badge variant={RESULT_STATUS_VARIANT[row.status]}>
                            {row.status}
                          </Badge>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>

              <div className="rounded-lg border border-[var(--adm-border)] p-3">
                <p className="mb-2 text-xs font-medium">
                  Mapping overview — which players belong to which team
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {resultsMapping.map((item) => (
                    <div
                      key={item.teamId}
                      className="rounded-md bg-[var(--adm-surface-2)] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold">
                          S{item.slot} · {item.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-[var(--adm-muted)]">
                          {item.verifiedPosition != null
                            ? `#${item.verifiedPosition}`
                            : "#—"}{" "}
                          · {item.verifiedKills ?? 0} kills
                        </span>
                      </div>
                      <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--adm-muted)]">
                        {item.players.length ? (
                          item.players.map((player, index) => (
                            <li key={index}>{player}</li>
                          ))
                        ) : (
                          <li>— no players mapped —</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {unmatched.length > 0 && (
                <Alert tone="warning">
                  <p className="font-medium">
                    {unmatched.length} row(s) could not be matched to a team:
                  </p>
                  <p className="text-xs">
                    {unmatched
                      .map((row) => ("name" in row ? row.name : ""))
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--adm-muted)]">
                  Only teams with a verified kill or position value are updated.
                  Empty cells are left untouched.
                </p>
                <Button
                  onClick={requestApply}
                  disabled={applying || previewLoading}
                >
                  <Upload className="h-4 w-4" />
                  {previewLoading
                    ? "Calculating..."
                    : applying
                    ? "Applying..."
                    : "Review & apply results"}
                </Button>
              </div>
              </div>
              {resultFiles.length > 0 && (
                <div className="h-fit lg:sticky lg:top-4">
                  <ScreenshotViewer files={resultFiles} label="Results screenshot(s)" />
                </div>
              )}
            </div>
          )}

          {comparison.length === 0 && !resultBusy && (
            <EmptyState
              icon={ImageIcon}
              title="No results screenshot yet"
              description="Upload the final results screenshot to compare against live scores."
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Points impact preview — round ${round}`}
        className="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => doApply(false)} disabled={applying}>
              <Upload className="h-4 w-4" />
              {applying ? "Applying..." : "Confirm & apply"}
            </Button>
          </>
        }
      >
        {previewData ? (
          <div className="space-y-4">
            <p className="text-xs text-[var(--adm-muted)]">
              Applying will overwrite the live kills/placement for{" "}
              {previewData.changes.length} team(s) in round{" "}
              {previewData.roundNumber}. Kill point multiplier:{" "}
              {previewData.killPointMultiplier}.
            </p>

            {previewData.changes.length > 0 ? (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Team</TH>
                    <TH className="w-24">Kills</TH>
                    <TH className="w-24">Position</TH>
                    <TH className="w-32">Total points</TH>
                    <TH className="w-16">Δ</TH>
                    <TH className="w-28">Rank</TH>
                  </TR>
                </THead>
                <TBody>
                  {previewData.changes.map((row) => (
                    <TR key={row.teamId}>
                      <TD className="font-medium">
                        <span className="mr-1 text-[var(--adm-muted)]">
                          S{row.slot}
                        </span>
                        {row.name}
                      </TD>
                      <TD>
                        {row.currentKills} →{" "}
                        <span className="font-semibold">{row.newKills}</span>
                      </TD>
                      <TD>
                        {row.currentPosition} →{" "}
                        <span className="font-semibold">{row.newPosition}</span>
                      </TD>
                      <TD>
                        {row.currentTotal} →{" "}
                        <span className="font-semibold">{row.projectedTotal}</span>
                      </TD>
                      <TD>
                        <Badge
                          variant={
                            row.delta > 0
                              ? "success"
                              : row.delta < 0
                              ? "danger"
                              : "muted"
                          }
                        >
                          {row.delta > 0 ? `+${row.delta}` : row.delta}
                        </Badge>
                      </TD>
                      <TD className="text-[var(--adm-muted)]">
                        #{row.currentRank} → #{row.projectedRank}
                        {row.rankDelta !== 0 && (
                          <span
                            className={
                              row.rankDelta > 0
                                ? "ml-1 text-emerald-600 dark:text-emerald-400"
                                : "ml-1 text-red-600 dark:text-red-400"
                            }
                          >
                            ({row.rankDelta > 0 ? "+" : ""}
                            {row.rankDelta})
                          </span>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <p className="text-sm text-[var(--adm-muted)]">
                No registered team matches the verified rows, so nothing would be
                written.
              </p>
            )}

            {previewData.skipped.length > 0 && (
              <Alert tone="warning">
                <p className="font-medium">
                  {previewData.skipped.length} slot(s) have no registered team and
                  will be ignored:
                </p>
                <p className="text-xs">
                  {previewData.skipped.map((item) => `S${item.slot}`).join(", ")}
                </p>
              </Alert>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--adm-muted)]">
            No changes to preview.
          </p>
        )}
      </Modal>

      <p className="text-xs text-[var(--adm-muted)]">
        OCR is best-effort: always review and correct the preview. Nothing is
        written to the leaderboard until you press Apply, and re-uploading the
        same screenshot will not add points twice.
      </p>
    </div>
  );
}
