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
import OverlayLayoutEditor from "@/components/admin/OverlayLayoutEditor";
import { cloneLayout, DEFAULT_BROADCAST_LAYOUT } from "@/lib/broadcastLayout";
import type { BroadcastLayout, BroadcastLayoutKey } from "@/types/broadcast";
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
  const [lowerEventLogo, setLowerEventLogo] = useState("");
  const [lowerSponsorLogos, setLowerSponsorLogos] = useState<string[]>([
    "",
    "",
    "",
  ]);
  const [lowerMapName, setLowerMapName] = useState("");
  const [lowerMapImage, setLowerMapImage] = useState("");
  const [countdownTitle, setCountdownTitle] = useState("Starting in");
  const [countdownMinutes, setCountdownMinutes] = useState("5");
  const [winnerTeamId, setWinnerTeamId] = useState("");
  const [winnerTitle, setWinnerTitle] = useState("CHAMPIONS");
  const [winnerSubtitle, setWinnerSubtitle] = useState("");
  const [winnerBackground, setWinnerBackground] = useState("");
  const [winnerPlayerImage, setWinnerPlayerImage] = useState("");
  const [winnerPlayerName, setWinnerPlayerName] = useState("");
  const [winnerTeamLogo, setWinnerTeamLogo] = useState("");
  const [teams, setTeams] = useState<{ _id: string; name: string }[]>([]);
  const [layoutDraft, setLayoutDraft] = useState<BroadcastLayout>(() =>
    cloneLayout()
  );
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [selectedBlock, setSelectedBlock] =
    useState<BroadcastLayoutKey>("pointsTable");

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
    setLowerEventLogo(broadcast.lowerThird.eventLogoUrl || "");
    setLowerSponsorLogos([
      ...(broadcast.lowerThird.sponsorLogos || []).slice(0, 3),
      "",
      "",
      "",
    ].slice(0, 3));
    setLowerMapName(broadcast.lowerThird.mapName || "");
    setLowerMapImage(broadcast.lowerThird.mapImageUrl || "");
    setCountdownTitle(broadcast.countdown.title);
    setCountdownMinutes(
      String(Math.max(1, Math.round(broadcast.countdown.durationSeconds / 60)))
    );
    setWinnerTeamId(broadcast.winner.teamId ?? "");
    setWinnerTitle(broadcast.winner.title || "CHAMPIONS");
    setWinnerSubtitle(broadcast.winner.subtitle || "");
    setWinnerBackground(broadcast.winner.backgroundImageUrl || "");
    setWinnerPlayerImage(broadcast.winner.playerImageUrl || "");
    setWinnerPlayerName(broadcast.winner.playerName || "");
    setWinnerTeamLogo(broadcast.winner.teamLogoUrl || "");
    setLayoutDraft(cloneLayout(broadcast.layout));
    setLayoutDirty(false);
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

  const saveLayout = async () => {
    setLayoutSaving(true);
    try {
      await api.patch("/broadcast", { layout: layoutDraft });
      await refresh();
      setLayoutDirty(false);
      notifySuccess("Overlay layout saved");
    } catch (error) {
      notifyError(errorMessage(error, "Could not save the overlay layout"));
    } finally {
      setLayoutSaving(false);
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
          eventLogoUrl: lowerEventLogo.trim(),
          sponsorLogos: lowerSponsorLogos
            .map((logo) => logo.trim())
            .filter(Boolean),
          mapName: lowerMapName.trim(),
          mapImageUrl: lowerMapImage.trim(),
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
          backgroundImageUrl: winnerBackground.trim(),
          playerImageUrl: winnerPlayerImage.trim(),
          playerName: winnerPlayerName.trim(),
          teamLogoUrl: winnerTeamLogo.trim(),
        },
      },
      "Winner splash is live"
    );
  };

  if (!ready || !canScore) {
    return (
      <div className="py-20 text-center text-sm text-[var(--adm-muted)]">
        Checking permissions...
      </div>
    );
  }

  const overlayScenes = [
    {
      key: "pointsTable" as const,
      name: "Editorial OBS Overlay",
      description: "One editorial source for the table, feed, lower third, countdown and winner",
      path: "/pointstable",
      icon: ListOrdered,
      visible: overlays?.pointsTable !== false,
      toggle: true,
    },
    {
      key: "leaderboard" as const,
      name: "Leaderboard",
      description: "Optional full-screen standings with leader spotlight",
      path: "/leaderboard",
      icon: Trophy,
      visible: overlays?.leaderboard !== false,
      toggle: true,
    },
    {
      key: "killFeed" as const,
      name: "Kill Feed Layer",
      description: "Recent eliminations inside the unified overlay",
      path: "/pointstable",
      icon: Skull,
      visible: overlays?.killFeed !== false,
      toggle: true,
    },
    {
      key: "notification" as const,
      name: "Elimination Notification",
      description: "Drag-to-place team elimination card inside the overlay",
      path: "/pointstable",
      icon: Skull,
      visible: overlays?.notification !== false,
      toggle: true,
    },
    {
      key: "lowerThird" as const,
      name: "Lower Third",
      description: "Standalone event, sponsor and map branded lower third",
      path: "/overlay/lower-third",
      icon: Type,
      visible: Boolean(lowerThird?.visible),
      toggle: false,
    },
    {
      key: "countdown" as const,
      name: "Countdown",
      description: "Standalone match countdown scene",
      path: "/overlay/countdown",
      icon: Timer,
      visible: Boolean(countdown?.visible),
      toggle: false,
    },
    {
      key: "winner" as const,
      name: "Winner Splash",
      description: "Standalone editable champion takeover scene",
      path: "/overlay/winner",
      icon: Crown,
      visible: Boolean(winner?.visible),
      toggle: false,
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
                    {scene.toggle ? (
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
                    ) : null}
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

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[var(--adm-fg)]">
                  Overlay Layout Studio
                </p>
                <Badge variant={layoutDirty ? "warning" : "muted"}>
                  {layoutDirty ? "UNSAVED" : "SAVED"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--adm-muted)]">
                Every block lives on the same OBS overlay. Drag it where you
                want, then save - no fixed slots.
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLayoutDraft(cloneLayout(DEFAULT_BROADCAST_LAYOUT));
                setLayoutDirty(true);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Default everything
            </Button>
          </div>
          {broadcast ? (
            <OverlayLayoutEditor
              broadcast={broadcast}
              layout={layoutDraft}
              selectedKey={selectedBlock}
              dirty={layoutDirty}
              saving={layoutSaving}
              onSelect={setSelectedBlock}
              onChange={(next) => {
                setLayoutDraft(next);
                setLayoutDirty(true);
              }}
              onSave={saveLayout}
              onReset={() => {
                setLayoutDraft(cloneLayout(DEFAULT_BROADCAST_LAYOUT));
                setLayoutDirty(true);
              }}
            />
          ) : null}
        </CardContent>
      </Card>

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
                placeholder="e.g. Match 3 - Erangel"
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
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Event logo URL
              </label>
              <Input
                value={lowerEventLogo}
                maxLength={1000}
                onChange={(event) => setLowerEventLogo(event.target.value)}
                placeholder="https://.../event-logo.png"
              />
              <div className="grid gap-2 sm:grid-cols-3">
                {lowerSponsorLogos.map((logo, index) => (
                  <div key={index}>
                    <label className="block text-xs font-medium text-[var(--adm-muted)]">
                      Sponsor {index + 1}
                    </label>
                    <Input
                      value={logo}
                      maxLength={1000}
                      onChange={(event) =>
                        setLowerSponsorLogos((current) =>
                          current.map((value, slot) =>
                            slot === index ? event.target.value : value
                          )
                        )
                      }
                      placeholder="Logo URL"
                    />
                  </div>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--adm-muted)]">
                    Map name
                  </label>
                  <Input
                    value={lowerMapName}
                    maxLength={60}
                    onChange={(event) => setLowerMapName(event.target.value)}
                    placeholder="e.g. Erangel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--adm-muted)]">
                    Map image URL
                  </label>
                  <Input
                    value={lowerMapImage}
                    maxLength={1000}
                    onChange={(event) => setLowerMapImage(event.target.value)}
                    placeholder="https://.../map.png"
                  />
                </div>
              </div>
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
              <div className="flex items-center gap-2">
                {winner?.auto ? <Badge variant="warning">AUTO</Badge> : null}
                <Badge variant={winner?.visible ? "success" : "muted"}>
                  {winner?.visible ? "ON AIR" : "OFF"}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-[var(--adm-muted)]">
              The last surviving team shows automatically. Picking a team here
              takes manual control, so the auto splash stops changing it.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Winning team
              </label>
              <select
                value={winnerTeamId}
                onChange={(event) => setWinnerTeamId(event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface)] px-3 text-sm text-[var(--adm-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-ring)]"
              >
                <option value="">Select a team...</option>
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
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Background image URL
              </label>
              <Input
                value={winnerBackground}
                maxLength={1000}
                onChange={(event) => setWinnerBackground(event.target.value)}
                placeholder="https://.../winner-background.jpg"
              />
              <label className="block text-xs font-medium text-[var(--adm-muted)]">
                Team logo override URL
              </label>
              <Input
                value={winnerTeamLogo}
                maxLength={1000}
                onChange={(event) => setWinnerTeamLogo(event.target.value)}
                placeholder="Leave empty to use the team logo"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--adm-muted)]">
                    Player / MVP name
                  </label>
                  <Input
                    value={winnerPlayerName}
                    maxLength={60}
                    onChange={(event) => setWinnerPlayerName(event.target.value)}
                    placeholder="e.g. MVP player"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--adm-muted)]">
                    Player image URL
                  </label>
                  <Input
                    value={winnerPlayerImage}
                    maxLength={1000}
                    onChange={(event) => setWinnerPlayerImage(event.target.value)}
                    placeholder="https://.../player.png"
                  />
                </div>
              </div>
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
        Use one OBS Browser Source at 1920x1080 pointing at
        <span className="mx-1 font-semibold text-[var(--adm-fg)]">
          /pointstable
        </span>
        for the full package. The leaderboard remains an optional extra source.
      </p>
    </div>
  );
}
