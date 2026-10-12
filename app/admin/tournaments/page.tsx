"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import {
  Archive,
  CheckCircle2,
  Copy,
  Plus,
  Star,
  Trash2,
  Trophy,
} from "lucide-react";
import { api } from "@/lib/api";
import { useTournament } from "@/components/providers/TournamentProvider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";
import type { Tournament } from "@/types/tournament";

const statusVariant = (status: Tournament["status"]) => {
  switch (status) {
    case "active":
      return "success" as const;
    case "draft":
      return "info" as const;
    case "completed":
      return "default" as const;
    default:
      return "muted" as const;
  }
};

const errorMessage = (error: unknown, fallback: string) =>
  isAxiosError(error)
    ? ((error.response?.data?.message as string | undefined) ?? fallback)
    : fallback;

export default function TournamentsPage() {
  const { tournaments, tournamentId, setTournamentId, isLoading, refresh } =
    useTournament();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [cloneFrom, setCloneFrom] = useState("");
  const [includeTeams, setIncludeTeams] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setSeason("");
    setCloneFrom("");
    setIncludeTeams(false);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      notifyError("Tournament name is required");
      return;
    }
    setBusy("create");
    try {
      await api.post("/tournaments", {
        name: name.trim(),
        season: season.trim(),
        cloneFrom: cloneFrom || undefined,
        includeTeams: cloneFrom ? includeTeams : false,
      });
      notifySuccess("Tournament created");
      resetForm();
      await refresh();
    } catch (error) {
      notifyError(errorMessage(error, "Failed to create tournament"));
    } finally {
      setBusy(null);
    }
  };

  const runAction = async (
    id: string,
    action: string,
    path: string,
    body?: Record<string, unknown>,
    successMessage = "Done"
  ) => {
    setBusy(`${action}:${id}`);
    try {
      await api.post(`/tournaments/${id}${path}`, body ?? {});
      notifySuccess(successMessage);
      await refresh();
    } catch (error) {
      notifyError(errorMessage(error, "Action failed"));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (tournament: Tournament) => {
    if (
      !window.confirm(
        `Delete "${tournament.name}" and ALL of its teams, logs and notifications? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(`delete:${tournament._id}`);
    try {
      await api.delete(`/tournaments/${tournament._id}`);
      notifySuccess("Tournament deleted");
      await refresh();
    } catch (error) {
      notifyError(errorMessage(error, "Failed to delete tournament"));
    } finally {
      setBusy(null);
    }
  };

  const handleClone = async (tournament: Tournament) => {
    const cloneName = window.prompt(
      "Name for the cloned tournament:",
      `${tournament.name} (Copy)`
    );
    if (!cloneName) return;
    const withTeams = window.confirm(
      "Also copy this tournament's teams and rounds?\nOK = include teams, Cancel = settings only."
    );
    await runAction(
      tournament._id,
      "clone",
      "/clone",
      { name: cloneName.trim(), includeTeams: withTeams },
      "Tournament cloned"
    );
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Tournaments"
        description="Run multiple tournaments side by side. Switch the working tournament from the top bar."
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            New Tournament
          </Button>
        }
      />

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create tournament</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--adm-muted)]">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PMWC Season 2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--adm-muted)]">
                Season / sub-label
              </label>
              <Input
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g. Season 2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--adm-muted)]">
                Copy settings from
              </label>
              <Select
                value={cloneFrom}
                onChange={(e) => setCloneFrom(e.target.value)}
              >
                <option value="">Start fresh (default design)</option>
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2 self-end text-sm text-[var(--adm-fg)]">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={includeTeams}
                disabled={!cloneFrom}
                onChange={(e) => setIncludeTeams(e.target.checked)}
              />
              Also copy teams &amp; rounds
            </label>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button onClick={handleCreate} disabled={busy === "create"}>
                {busy === "create" ? "Creating..." : "Create"}
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Create your first tournament to get started."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => {
            const isCurrent = tournament._id === tournamentId;
            return (
              <Card
                key={tournament._id}
                className={
                  isCurrent
                    ? "ring-2 ring-[var(--adm-ring)]"
                    : undefined
                }
              >
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--adm-fg)]">
                        {tournament.name}
                      </h3>
                      <p className="text-xs text-[var(--adm-muted)]">
                        {tournament.season || "No season"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={statusVariant(tournament.status)}>
                        {tournament.status}
                      </Badge>
                      {tournament.isDefault ? (
                        <Badge variant="warning">
                          <Star className="mr-1 h-3 w-3" /> default
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-sm text-[var(--adm-muted)]">
                    {tournament.teamCount} team
                    {tournament.teamCount === 1 ? "" : "s"}
                  </p>

                  <div className="flex flex-wrap items-center gap-1 border-t border-[var(--adm-border)] pt-3">
                    <Button
                      size="sm"
                      variant={isCurrent ? "default" : "outline"}
                      disabled={isCurrent}
                      onClick={() => setTournamentId(tournament._id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isCurrent ? "Current" : "Work on this"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Activate"
                      disabled={busy === `activate:${tournament._id}`}
                      onClick={() =>
                        runAction(
                          tournament._id,
                          "activate",
                          "/activate",
                          undefined,
                          "Tournament activated"
                        )
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Archive"
                      disabled={busy === `archive:${tournament._id}`}
                      onClick={() =>
                        runAction(
                          tournament._id,
                          "archive",
                          "/archive",
                          undefined,
                          "Tournament archived"
                        )
                      }
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Clone"
                      disabled={busy === `clone:${tournament._id}`}
                      onClick={() => handleClone(tournament)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Set as default"
                      disabled={
                        tournament.isDefault ||
                        busy === `setDefault:${tournament._id}`
                      }
                      onClick={() =>
                        runAction(
                          tournament._id,
                          "setDefault",
                          "/set-default",
                          undefined,
                          "Default tournament updated"
                        )
                      }
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete"
                      className="ml-auto text-red-500 hover:text-red-600"
                      disabled={
                        tournament.isDefault ||
                        busy === `delete:${tournament._id}`
                      }
                      onClick={() => handleDelete(tournament)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
