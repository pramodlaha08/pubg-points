"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { Image as ImageIcon, RefreshCw, ScanText, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { useTournament } from "@/components/providers/TournamentProvider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ScreenshotViewer } from "@/components/admin/ScreenshotViewer";
import { DeleteDataButton } from "@/components/admin/DeleteDataButton";
import InlineAlert from "@/components/admin/InlineAlert";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";
import type {
  ComparisonRow,
  EditableResultRow,
  PointsPreview,
  ResultsMappingRow,
} from "@/types/verify";

const RESULT_STATUS_VARIANT = {
  match: "success",
  mismatch: "warning",
  unmatched: "muted",
} as const;

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

export default function AutoScoringPage() {
  const { activeTournament } = useTournament();
  // Position-first events hide every kill control; only placement is scored.
  const trackKills = activeTournament?.scoring?.trackKills ?? false;
  const [roundNumber, setRoundNumber] = useState("1");

  const [resultBusy, setResultBusy] = useState(false);
  const [resultHash, setResultHash] = useState("");
  const [resultRaw, setResultRaw] = useState("");
  const [resultWarnings, setResultWarnings] = useState<string[]>([]);
  const [resultEngine, setResultEngine] = useState("");
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

  const handleResultUpload = async (files: File[]) => {
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
      setResultEngine(data.ocr?.engine ?? "tesseract");
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
        kills:
          trackKills && row.verifiedKills !== ""
            ? Number(row.verifiedKills)
            : null,
        position: row.verifiedPosition === "" ? null : Number(row.verifiedPosition),
      }))
      .filter((row) => row.kills !== null || row.position !== null);

  const resetAll = () => {
    setResultHash("");
    setResultRaw("");
    setResultWarnings([]);
    setResultEngine("");
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
      notifyError("Nothing to apply — no verified values to write.");
      return;
    }
    setPreviewLoading(true);
    try {
      const response = await api.post("/match/preview", {
        roundNumber: Number(roundNumber) || 0,
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

  const doApply = async (force = false) => {
    const verified = buildVerified();
    if (!verified.length) {
      notifyError("Nothing to apply — no verified values to write.");
      return;
    }

    setApplying(true);
    try {
      const comparisonPayload = comparison.map((row) => ({
        slot: row.slot,
        teamId: row.teamId,
        name: row.name,
        liveKills: row.liveKills,
        verifiedKills:
          trackKills && row.verifiedKills !== ""
            ? Number(row.verifiedKills)
            : null,
        livePosition: row.livePosition,
        verifiedPosition:
          row.verifiedPosition === "" ? null : Number(row.verifiedPosition),
        livePlacementPoints: row.livePlacementPoints,
        status: row.status,
      }));

      await api.post("/match/apply", {
        roundNumber: Number(roundNumber) || 0,
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
        description="Verify results from the final screenshot and reconcile them with the live scores"
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
            Verified results are stored per round. Pick the round before
            uploading.
          </p>
          <DeleteDataButton roundNumber={round} onCleared={resetAll} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Verify results from final screenshot</CardTitle>
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
            {resultEngine.startsWith("ai:") && (
              <Badge variant="info">AI assist</Badge>
            )}
            {resultEngine === "tesseract" && (
              <Badge variant="warning">OCR fallback</Badge>
            )}
          </div>

          {resultWarnings.length > 0 && (
            <InlineAlert tone="warning">
              {resultWarnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </InlineAlert>
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
                    {trackKills && <TH className="w-20">Live Kills</TH>}
                    {trackKills && <TH className="w-24">Verified Kills</TH>}
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
                        {trackKills && <TD>{row.liveKills}</TD>}
                        {trackKills && (
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
                        )}
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
                            : "#—"}
                          {trackKills ? ` · ${item.verifiedKills ?? 0} kills` : ""}
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
                <InlineAlert tone="warning">
                  <p className="font-medium">
                    {unmatched.length} row(s) could not be matched to a team:
                  </p>
                  <p className="text-xs">
                    {unmatched
                      .map((row) => ("name" in row ? row.name : ""))
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </InlineAlert>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--adm-muted)]">
                  {trackKills
                    ? "Only teams with a verified kill or position value are updated. Empty cells are left untouched."
                    : "Only teams with a verified position are updated. Empty cells are left untouched. Kills are not scored for this tournament."}
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
              Applying will overwrite the live{" "}
              {trackKills ? "kills/placement" : "placement"} for{" "}
              {previewData.changes.length} team(s) in round{" "}
              {previewData.roundNumber}.
              {trackKills
                ? ` Kill point multiplier: ${previewData.killPointMultiplier}.`
                : " Kills are not scored for this tournament."}
            </p>

            {previewData.changes.length > 0 ? (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Team</TH>
                    {trackKills && <TH className="w-24">Kills</TH>}
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
                      {trackKills && (
                        <TD>
                          {row.currentKills} →{" "}
                          <span className="font-semibold">{row.newKills}</span>
                        </TD>
                      )}
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
                No changes to preview.
              </p>
            )}

            {previewData.skipped.length > 0 && (
              <InlineAlert tone="warning">
                <p className="font-medium">
                  {previewData.skipped.length} slot(s) have no registered team and
                  will be ignored:
                </p>
                <p className="text-xs">
                  {previewData.skipped.map((item) => `S${item.slot}`).join(", ")}
                </p>
              </InlineAlert>
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
