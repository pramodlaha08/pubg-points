"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Pencil, Plus, Search, Trash2, Users, ListPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useTeams } from "@/hooks/useTeams";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { notifyError, notifySuccess, ToastContainer } from "@/utils/ToastifyNotification";
import type { Team } from "@/types/team";

export default function TeamsPage() {
  const { teams, isLoading, refresh } = useTeams();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? teams.filter(
          (team) =>
            team.name.toLowerCase().includes(q) || String(team.slot) === q
        )
      : teams;
    return [...list].sort((a, b) => a.slot - b.slot);
  }, [teams, query]);

  const handleDelete = async (team: Team) => {
    if (!window.confirm(`Delete "${team.name}" (Slot ${team.slot})?`)) return;
    setBusyId(team._id);
    try {
      await api.delete(`/team/${team._id}`);
      notifySuccess("Team deleted");
      refresh();
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : undefined;
      notifyError(message || "Failed to delete team");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Teams"
        description="Create, edit and remove tournament teams"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/teams/bulk">
              <Button size="sm" variant="outline">
                <ListPlus className="h-4 w-4" />
                Bulk Import
              </Button>
            </Link>
            <Link href="/admin/teams/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Team
              </Button>
            </Link>
          </div>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or slot"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={teams.length === 0 ? "No teams yet" : "No matches"}
              description={
                teams.length === 0
                  ? "Add your first team to get started."
                  : "Try a different search term."
              }
            />
          ) : (
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="w-16">Slot</TH>
                  <TH>Team</TH>
                  <TH className="text-right">Points</TH>
                  <TH className="text-right">Rounds</TH>
                  <TH>Status</TH>
                  <TH className="w-28 text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((team) => (
                  <TR key={team._id}>
                    <TD className="font-semibold text-[var(--adm-muted)]">
                      {team.slot}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        {team.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="h-8 w-8 rounded-full border border-[var(--adm-border)] object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--adm-surface-2)] text-[10px] font-bold text-[var(--adm-muted)]">
                            {team.slot}
                          </span>
                        )}
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </TD>
                    <TD className="text-right font-bold tabular-nums">
                      {team.totalPoints}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {team.rounds.length}
                    </TD>
                    <TD>
                      {team.isEliminated ? (
                        <Badge variant="danger">Out</Badge>
                      ) : (
                        <Badge variant="success">Alive</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/teams/${team._id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          className="text-red-500 hover:text-red-600"
                          disabled={busyId === team._id}
                          onClick={() => handleDelete(team)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
