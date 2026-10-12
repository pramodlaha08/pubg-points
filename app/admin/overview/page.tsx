"use client";

import Link from "next/link";
import {
  Activity,
  Crosshair,
  ListOrdered,
  Palette,
  Radio,
  RefreshCw,
  Skull,
  Swords,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  { name: "Live Control", path: "/admin/live", icon: Radio },
  { name: "Positions", path: "/admin/positions", icon: Crosshair },
  { name: "Round Manager", path: "/admin/rounds", icon: ListOrdered },
  { name: "Manage Teams", path: "/admin/teams", icon: Users },
  { name: "Create Team", path: "/admin/teams/new", icon: UserPlus },
  { name: "Table Design", path: "/admin/design", icon: Palette },
];

const SEVERITY_VARIANT: Record<string, "info" | "warning" | "danger" | "muted"> =
  {
    info: "info",
    highlight: "warning",
    critical: "danger",
  };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function OverviewPage() {
  const { stats, isLoading, error, refresh } = useDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Tournament control overview"
        actions={
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card>
          <CardContent className="text-sm text-red-500">
            Failed to load dashboard stats. Is the backend running?
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Teams"
          value={stats?.teams ?? 0}
          icon={Users}
          loading={isLoading}
          hint={
            stats ? `${stats.aliveTeams} alive · ${stats.eliminatedTeams} out` : undefined
          }
        />
        <StatCard
          title="Alive"
          value={stats?.aliveTeams ?? 0}
          icon={Activity}
          loading={isLoading}
        />
        <StatCard
          title="Current Round"
          value={stats?.currentRound ?? 0}
          icon={ListOrdered}
          loading={isLoading}
        />
        <StatCard
          title="Total Kills"
          value={stats?.totalKills ?? 0}
          icon={Swords}
          loading={isLoading}
        />
        <StatCard
          title="Eliminations"
          value={stats?.totalEliminations ?? 0}
          icon={Skull}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[var(--adm-primary)]" />
              Leaderboard
            </CardTitle>
            <Link
              href="/pointstable"
              className="text-xs font-medium text-[var(--adm-muted)] hover:text-[var(--adm-fg)]"
            >
              View table
            </Link>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : stats && stats.leaderboard.length > 0 ? (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH className="w-12">#</TH>
                    <TH>Team</TH>
                    <TH className="text-right">Pts</TH>
                  </TR>
                </THead>
                <TBody>
                  {stats.leaderboard.map((team, index) => (
                    <TR key={team.id}>
                      <TD className="font-semibold text-[var(--adm-muted)]">
                        {index + 1}
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--adm-surface-2)] text-[10px] font-bold text-[var(--adm-muted)]">
                            {team.slot}
                          </span>
                          <span className="truncate font-medium">
                            {team.name}
                          </span>
                          {team.isEliminated && (
                            <Badge variant="danger" className="ml-1">
                              out
                            </Badge>
                          )}
                        </div>
                      </TD>
                      <TD className="text-right font-bold tabular-nums">
                        {team.totalPoints}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No teams yet"
                description="Create teams to start tracking standings."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--adm-primary)]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats && stats.recentActivity.length > 0 ? (
              <ul className="divide-y divide-[var(--adm-border)]">
                {stats.recentActivity.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 px-2 py-3"
                  >
                    <Badge
                      variant={SEVERITY_VARIANT[entry.severity] ?? "muted"}
                      className="mt-0.5 shrink-0"
                    >
                      R{entry.roundNumber ?? "-"}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {entry.teamName}
                      </p>
                      <p className="truncate text-xs text-[var(--adm-muted)]">
                        {entry.message}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--adm-muted)]">
                      {timeAgo(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Match events will show up here as they happen."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--adm-muted)]">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border border-[var(--adm-border)] bg-[var(--adm-surface)] px-4 py-5 text-center text-sm font-medium transition-colors hover:border-[var(--adm-primary)] hover:text-[var(--adm-primary)]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
