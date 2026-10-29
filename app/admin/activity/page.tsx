"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";
import type { TeamLogEntry } from "@/types/team";

const PAGE_SIZES = [25, 50, 100, 200];

const EVENT_OPTIONS: { value: string; label: string }[] = [
  { value: "KILL_ADDED", label: "Kill added" },
  { value: "KILL_UPDATED", label: "Kills set" },
  { value: "KILL_DECREASED", label: "Kill removed" },
  { value: "POSITION_UPDATED", label: "Placement set" },
  { value: "ELIMINATION_UPDATED", label: "Player eliminated/revived" },
  { value: "LOG_REVERTED", label: "Undo" },
  { value: "ROUND_CREATED", label: "Round opened" },
  { value: "ROUND_DELETED", label: "Round removed" },
  { value: "TEAM_CREATED", label: "Team registered" },
  { value: "TEAM_UPDATED", label: "Team updated" },
  { value: "TEAM_DELETED", label: "Team removed" },
];

const EVENT_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_OPTIONS.map((option) => [option.value, option.label])
);

const REVERTABLE = new Set([
  "KILL_ADDED",
  "KILL_UPDATED",
  "KILL_DECREASED",
  "POSITION_UPDATED",
  "ELIMINATION_UPDATED",
]);

const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error)
    ? (error.response?.data?.message as string | undefined)
    : undefined) || fallback;

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const severityVariant = (severity: TeamLogEntry["severity"]) =>
  severity === "critical"
    ? "danger"
    : severity === "highlight"
      ? "warning"
      : "muted";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ActivityLogPage() {
  const router = useRouter();
  const { ready, canScore } = useAuth();

  const [logs, setLogs] = useState<TeamLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [eventType, setEventType] = useState("");
  const [roundNumber, setRoundNumber] = useState("");

  useEffect(() => {
    if (ready && !canScore) {
      router.replace("/admin/overview");
    }
  }, [ready, canScore, router]);

  const loadLogs = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (eventType) query.set("eventType", eventType);
        if (roundNumber.trim()) query.set("roundNumber", roundNumber.trim());

        const response = await api.get(`/team-log?${query.toString()}`);
        const data = response.data?.data as
          | { items: TeamLogEntry[]; pagination: Pagination }
          | undefined;
        setLogs(data?.items ?? []);
        setPagination(data?.pagination ?? null);
      } catch (error) {
        notifyError(errorMessage(error, "Could not load the activity log"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, limit, eventType, roundNumber]
  );

  useEffect(() => {
    if (ready && canScore) void loadLogs();
  }, [ready, canScore, loadLogs]);

  const handleRevert = async (log: TeamLogEntry) => {
    if (
      !window.confirm(
        `Undo this action?\n\n${log.title}\n${log.message}\n\nThis restores the previous scoring state.`
      )
    ) {
      return;
    }
    setRevertingId(log._id);
    try {
      await api.post(`/team-log/${log._id}/revert`);
      notifySuccess(`Reverted: ${log.title}`);
      await loadLogs(true);
    } catch (error) {
      notifyError(errorMessage(error, "Could not revert this action"));
    } finally {
      setRevertingId(null);
    }
  };

  const total = pagination?.total ?? logs.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  const rangeLabel = useMemo(() => {
    if (!logs.length) return "No entries";
    const start = (page - 1) * limit + 1;
    const end = start + logs.length - 1;
    return `${start}–${end} of ${total}`;
  }, [logs.length, page, limit, total]);

  if (!ready || !canScore) {
    return (
      <div className="py-20 text-center text-sm text-[var(--adm-muted)]">
        Checking permissions…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Activity Log"
        description="Every scoring change, with one-click undo for kills, placements and eliminations"
        actions={
          <Button variant="outline" size="sm" onClick={() => loadLogs()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:w-56">
            <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
              Action type
            </label>
            <Select
              value={eventType}
              onChange={(event) => {
                setEventType(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All actions</option>
              {EVENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-32">
            <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
              Round
            </label>
            <Input
              type="number"
              min={1}
              value={roundNumber}
              onChange={(event) => {
                setRoundNumber(event.target.value);
                setPage(1);
              }}
              placeholder="Any"
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
              Page size
            </label>
            <Select
              value={String(limit)}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
          {(eventType || roundNumber.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEventType("");
                setRoundNumber("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH className="w-36">When</TH>
                <TH className="w-44">Action</TH>
                <TH className="w-40">Team</TH>
                <TH className="w-16">Round</TH>
                <TH>Detail</TH>
                <TH className="w-28 text-right">Undo</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD
                    colSpan={6}
                    className="py-10 text-center text-[var(--adm-muted)]"
                  >
                    Loading activity…
                  </TD>
                </TR>
              ) : logs.length === 0 ? (
                <TR>
                  <TD
                    colSpan={6}
                    className="py-10 text-center text-[var(--adm-muted)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <History className="h-4 w-4" />
                      No activity matches these filters.
                    </span>
                  </TD>
                </TR>
              ) : (
                logs.map((log) => {
                  const revertable =
                    REVERTABLE.has(log.eventType) && !log.revertedAt;
                  return (
                    <TR key={log._id}>
                      <TD className="whitespace-nowrap text-xs text-[var(--adm-muted)]">
                        {formatWhen(log.createdAt)}
                      </TD>
                      <TD>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={severityVariant(log.severity)}>
                            {EVENT_LABELS[log.eventType] ?? log.eventType}
                          </Badge>
                          {log.revertedAt ? (
                            <Badge variant="muted">
                              Undone
                              {log.revertedByName
                                ? ` by ${log.revertedByName}`
                                : ""}
                            </Badge>
                          ) : null}
                        </div>
                      </TD>
                      <TD className="font-medium">
                        <span className="whitespace-nowrap">
                          #{log.slot} {log.teamName}
                        </span>
                      </TD>
                      <TD className="text-[var(--adm-muted)]">
                        {log.roundNumber ?? "—"}
                      </TD>
                      <TD>
                        <div className="max-w-[28rem]">
                          <p className="font-medium text-[var(--adm-fg)]">
                            {log.title}
                          </p>
                          <p className="text-xs text-[var(--adm-muted)]">
                            {log.message}
                          </p>
                        </div>
                      </TD>
                      <TD className="text-right">
                        {revertable ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={revertingId === log._id}
                            onClick={() => handleRevert(log)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            {revertingId === log._id ? "Undoing…" : "Undo"}
                          </Button>
                        ) : (
                          <span className="text-xs text-[var(--adm-muted)]">
                            —
                          </span>
                        )}
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>

          <div className="mt-4 flex flex-col gap-2 border-t border-[var(--adm-border)] pt-3 text-xs text-[var(--adm-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>{rangeLabel}</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canGoBack || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="px-1 font-medium text-[var(--adm-fg)]">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!canGoForward || loading}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
