"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  Copy,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  ListOrdered,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Skull,
  Timer,
  Trophy,
  Type,
} from "lucide-react";
import { api, getApiTournamentId } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useBroadcast } from "@/hooks/useBroadcast";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";

const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error)
    ? (error.response?.data?.message as string | undefined)
    : undefined) || fallback;

const formatClock = (totalSeconds: number) => {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

export default function ControlRoomPage() {
  const router = useRouter();
  const { ready, canScore } = useAuth();
  const { broadcast, refresh } = useBroadcast();

  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState("");

  const [lowerTitle, setLowerTitle] = useState("");
  const [lowerSubtitle, setLowerSubtitle] = useState("");
  const [countdownTitle, setCountdownTitle] = useState("Starting in");
  const [countdownMinutes, setCountdownMinutes] = useState("5");
  const [winnerTeamId, setWinnerTeamId] = useState("");
  const [winnerTitle, setWinnerTitle] = useState("CHAMPIONS");
  const [winnerSubtitle, setWinnerSubtitle] = useState("");
  const [teams, setTeams] = useState<{ _id: string; name: string }[]>([]);

  const [now, setNow] = useState(() => Date.now());
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (ready && !canScore) {
      router.replace("/admin/overview");
    }
  }, [ready, canScore, router]);

  useEffect(() => {
    setOrigin(window.location.origin);
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!broadcast) return;
    if (hydratedFor.current === broadcast.tournamentId) return;
    hydratedFor.current = broadcast.tournamentId;
    setLowerTitle(broadcast.lowerThird.title);
    setLowerSubtitle(broadcast.lowerThird.subtitle);
    setCountdownTitle(broadcast.countdown.title);
    setCountdownMinutes(
      String(Math.max(1, Math.round(broadcast.countdown.durationSeconds / 60)))
    );
    setWinnerTeamId(broadcast.winner.teamId ?? "");
    setWinnerTitle(broadcast.winner.title || "CHAMPIONS");
    setWinnerSubtitle(broadcast.winner.subtitle || "");
  }, [broadcast]);

  useEffect(() => {
    if (!ready || !canScore) return;
    let active = true;
    api
      .get("/team")
      .then((response) => {
        if (!active || !response.data?.success) return;
        setTeams(
          (response.data.data as { _id: string; name: string }[]).map((team) => ({
            _id: team._id,
            name: team.name,
          }))
        );
      })
      .catch(() => {
        if (active) notifyError("Could not load the team list");
      });
    return () => {
      active = false;
    };
  }, [ready, canScore]);

  const patch = useCallback(
    async (body: Record<string, unknown>, message?: string) => {
      setSaving(true);
      try {
        await api.patch("/broadcast", body);
        await refresh();
        if (message) notifySuccess(message);
      } catch (error) {
        notifyError(errorMessage(error, "Could not update the broadcast"));
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const sceneUrl = useCallback(
    (path: string) => {
      const scope = getApiTournamentId();
      return `${origin}${path}${scope ? `?tournamentId=${scope}` : ""}`;
    },
    [origin]
  );

  const copyUrl = async (path: string) => {
    try {
      await navigator.clipboard.writeText(sceneUrl(path));
      notifySuccess("OBS browser source URL copied");
    } catch {
      notifyError("Could not copy the URL");
    }
  };

  const overlays = broadcast?.overlays;
  const lowerThird = broadcast?.lowerThird;
  const countdown = broadcast?.countdown;
  const winner = broadcast?.winner;

  const remaining =
    countdown?.running && countdown.endsAt
      ? Math.max(
          0,
          Math.ceil((new Date(countdown.endsAt).getTime() - now) / 1000)
        )
      : (countdown?.remainingSeconds ?? 0);

  const applyLowerThird = () => {
    if (!lowerTitle.trim()) {
      notifyError("Add a title before showing the lower third");
      return;
    }
    void patch(
      {
        lowerThird: {
          title: lowerTitle.trim(),
          subtitle: lowerSubtitle.trim(),
          visible: true,
        },
      },
      "Lower third is live"
    );
  };

  const applyCountdown = () => {
    const minutes = Number(countdownMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      notifyError("Enter a countdown length in minutes");
      return;
    }
    void patch(
      { countdown: { title: countdownTitle.trim(), durationSeconds: Math.round(minutes * 60) } },
      "Countdown updated"
    );
  };

  const applyWinner = () => {
    if (!winnerTeamId) {
      notifyError("Pick the winning team first");
      return;
    }
    void patch(
      {
        winner: {
          visible: true,
          teamId: winnerTeamId,
          title: winnerTitle.trim() || "CHAMPIONS",
          subtitle: winnerSubtitle.trim(),
        },
      },
      "Winner splash is live"
    );
  };

  if (!ready || !canScore) {
    return (
      <div className="py-20 text-center text-sm text-[var(--adm-muted)]">
        Checking permissions…
      </div>
    );
  }

  const overlayScenes = [
    {
      key: "pointsTable" as const,
      name: "Points Table",
      description: "Live standings panel for the OBS overlay",
      path: "/pointstable",
      icon: ListOrdered,
      visible: overlays?.pointsTable !== false,
    },
    {
      key: "leaderboard" as const,
      name: "Leaderboard",
      description: "Full-screen standings with leader spotlight",
      path: "/leaderboard",
      icon: Trophy,
      visible: overlays?.leaderboard !== false,
    },
    {
      key: "killFeed" as const,
      name: "Kill Feed",
      description: "Recent eliminations sliding in from the right",
      path: "/overlay/kill-feed",
      icon: Skull,
      visible: overlays?.killFeed !== false,
    },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Control Room"
        description="Toggle overlays and drive lower thirds and the match countdown"
        actions={
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--adm-muted)]">
          Overlay scenes
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {overlayScenes.map((scene) => {
            const Icon = scene.icon;
            return (
              <Card key={scene.key}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface-2)] p-2">
                        <Icon className="h-5 w-5 text-[var(--adm-fg)]" />
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--adm-fg)]">
                          {scene.name}
                        </p>
                        <p className="text-xs text-[var(--adm-muted)]">
                          {scene.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant={scene.visible ? "success" : "muted"}>
                      {scene.visible ? "LIVE" : "HIDDEN"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={scene.visible ? "outline" : "default"}
                      disabled={saving}
                      onClick={() =>
                        patch({
                          overlays: { [scene.key]: !scene.visible },
                        })
                      }
                    >
                      {scene.visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {scene.visible ? "Hide" : "Show"}
                    </Button>
                    <a href={sceneUrl(scene.path)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyUrl(scene.path)}
                    >
                      <Copy className="h-4 w-4" />
                      Copy OBS URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-[var(--adm-muted)]" />
                <p className="font-semibold text-[var(--adm-fg)]">Lower Third</p>
              </div>
              <Badge variant={lowerThird?.visible ? "success" : "muted"}>
                {lowerThird?.visible ? "ON AIR" : "OFF"}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Title
              </label>
              <Input
                value={lowerTitle}
                maxLength={80}
                onChange={(event) => setLowerTitle(event.target.value)}
                placeholder="e.g. Match 3 — Erangel"
              />
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Subtitle
              </label>
              <Input
                value={lowerSubtitle}
                maxLength={120}
                onChange={(event) => setLowerSubtitle(event.target.value)}
                placeholder="e.g. Presented by PMWC"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={saving} onClick={applyLowerThird}>
                <Play className="h-4 w-4" />
                {lowerThird?.visible ? "Update & keep live" : "Apply & show"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving || !lowerThird?.visible}
                onClick={() =>
                  patch({ lowerThird: { visible: false } }, "Lower third hidden")
                }
              >
                <EyeOff className="h-4 w-4" />
                Hide
              </Button>
              <a
                href={sceneUrl("/overlay/lower-third")}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="ghost">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              </a>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyUrl("/overlay/lower-third")}
              >
                <Copy className="h-4 w-4" />
                Copy OBS URL
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-[var(--adm-muted)]" />
                <p className="font-semibold text-[var(--adm-fg)]">Countdown</p>
              </div>
              <Badge
                variant={
                  countdown?.visible
                    ? countdown.running
                      ? "success"
                      : "warning"
                    : "muted"
                }
              >
                {countdown?.visible
                  ? countdown.running
                    ? "RUNNING"
                    : "PAUSED"
                  : "OFF"}
              </Badge>
            </div>

            <div className="rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface-2)] py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--adm-muted)]">
                {countdown?.title || "Starting in"}
              </p>
              <p className="font-mono text-4xl font-black tabular-nums text-[var(--adm-fg)]">
                {formatClock(remaining)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Label
              </label>
              <Input
                value={countdownTitle}
                maxLength={60}
                onChange={(event) => setCountdownTitle(event.target.value)}
                placeholder="Starting in"
              />
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Length (minutes)
              </label>
              <Input
                type="number"
                min={1}
                value={countdownMinutes}
                onChange={(event) => setCountdownMinutes(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={saving} onClick={applyCountdown}>
                Save
              </Button>
              <Button
                size="sm"
                disabled={saving}
                onClick={() => patch({ countdown: { action: "start" } }, "Countdown started")}
              >
                <Play className="h-4 w-4" />
                Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving || !countdown?.running}
                onClick={() => patch({ countdown: { action: "pause" } })}
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => patch({ countdown: { action: "reset" } })}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() =>
                  patch(
                    {
                      countdown: {
                        action: countdown?.visible ? "hide" : "show",
                      },
                    },
                    countdown?.visible ? "Countdown hidden" : "Countdown shown"
                  )
                }
              >
                {countdown?.visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {countdown?.visible ? "Hide" : "Show"}
              </Button>
              <a
                href={sceneUrl("/overlay/countdown")}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="ghost">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              </a>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyUrl("/overlay/countdown")}
              >
                <Copy className="h-4 w-4" />
                Copy OBS URL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[var(--adm-muted)]" />
                <p className="font-semibold text-[var(--adm-fg)]">
                  Winner Splash
                </p>
              </div>
              <Badge variant={winner?.visible ? "success" : "muted"}>
                {winner?.visible ? "ON AIR" : "OFF"}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Winning team
              </label>
              <select
                value={winnerTeamId}
                onChange={(event) => setWinnerTeamId(event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface)] px-3 text-sm text-[var(--adm-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-ring)]"
              >
                <option value="">Select a team…</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Headline
              </label>
              <Input
                value={winnerTitle}
                maxLength={60}
                onChange={(event) => setWinnerTitle(event.target.value)}
                placeholder="CHAMPIONS"
              />
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Subtitle
              </label>
              <Input
                value={winnerSubtitle}
                maxLength={100}
                onChange={(event) => setWinnerSubtitle(event.target.value)}
                placeholder="e.g. PMWC 2026 Grand Final"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={saving} onClick={applyWinner}>
                <Play className="h-4 w-4" />
                {winner?.visible ? "Update & keep live" : "Apply & show"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving || !winner?.visible}
                onClick={() =>
                  patch({ winner: { visible: false } }, "Winner splash hidden")
                }
              >
                <EyeOff className="h-4 w-4" />
                Hide
              </Button>
              <a
                href={sceneUrl("/overlay/winner")}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="ghost">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
              </a>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyUrl("/overlay/winner")}
              >
                <Copy className="h-4 w-4" />
                Copy OBS URL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-[var(--adm-muted)]">
        Add each URL as an OBS Browser Source at 1920×1080. Keep the source loaded
        and use the toggles here to show or hide it instantly.
      </p>
    </div>
  );
}
