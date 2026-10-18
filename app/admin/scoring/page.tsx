"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { RotateCcw, Save, Target } from "lucide-react";
import { api } from "@/lib/api";
import { useTournament } from "@/components/providers/TournamentProvider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";

const POSITION_COUNT = 16;

const DEFAULT_POSITION_POINTS: Record<string, number> = {
  "1": 10,
  "2": 6,
  "3": 5,
  "4": 4,
  "5": 3,
  "6": 2,
  "7": 1,
  "8": 1,
};

const buildPositionPoints = (raw?: Record<string, number>) => {
  const out: Record<string, number> = {};
  for (let i = 1; i <= POSITION_COUNT; i += 1) {
    const value = raw?.[String(i)];
    out[String(i)] =
      value === undefined ? DEFAULT_POSITION_POINTS[String(i)] ?? 0 : value;
  }
  return out;
};

const errorMessage = (error: unknown, fallback: string) =>
  isAxiosError(error)
    ? ((error.response?.data?.message as string | undefined) ?? fallback)
    : fallback;

export default function ScoringPage() {
  const { activeTournament, tournamentId, isLoading, refresh } =
    useTournament();

  const [squadSize, setSquadSize] = useState(4);
  const [killMultiplier, setKillMultiplier] = useState(1);
  const [trackKills, setTrackKills] = useState(false);
  const [positionPoints, setPositionPoints] = useState<Record<string, number>>(
    buildPositionPoints()
  );
  const [saving, setSaving] = useState(false);

  const serverScoring = activeTournament?.scoring;

  useEffect(() => {
    if (!serverScoring) {
      setSquadSize(4);
      setKillMultiplier(1);
      setTrackKills(false);
      setPositionPoints(buildPositionPoints());
      return;
    }
    setSquadSize(serverScoring.fullEliminationCount ?? 4);
    setKillMultiplier(serverScoring.killPointMultiplier ?? 1);
    setTrackKills(serverScoring.trackKills ?? false);
    setPositionPoints(buildPositionPoints(serverScoring.positionPoints));
  }, [serverScoring, tournamentId]);

  const previewTotals = useMemo(() => {
    const top = ["1", "2", "3"].map(
      (p) => `${positionPoints[p] ?? 0} (P${p})`
    );
    const killLabel = trackKills ? `+${killMultiplier}/kill` : "kills not scored";
    return `Win ${top[0]} · 2nd ${top[1]} · 3rd ${top[2]} · ${killLabel} · ${squadSize} players`;
  }, [positionPoints, killMultiplier, trackKills, squadSize]);

  const setPosition = (key: string, value: string) => {
    const number = value === "" ? 0 : Number(value);
    setPositionPoints((prev) => ({
      ...prev,
      [key]: Number.isFinite(number) ? Math.max(0, number) : 0,
    }));
  };

  const resetToDefaults = () => {
    setSquadSize(4);
    setKillMultiplier(1);
    setTrackKills(false);
    setPositionPoints(buildPositionPoints());
  };

  const save = async () => {
    if (!tournamentId) return;
    setSaving(true);
    try {
      await api.put(`/tournaments/${tournamentId}`, {
        scoring: {
          positionPoints,
          killPointMultiplier: killMultiplier,
          fullEliminationCount: squadSize,
          trackKills,
        },
      });
      notifySuccess("Scoring rules saved");
      await refresh();
    } catch (error) {
      notifyError(errorMessage(error, "Failed to save scoring rules"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !activeTournament) {
    return (
      <div className="space-y-6">
        <PageHeader title="Scoring" description="Loading..." />
      </div>
    );
  }

  if (!activeTournament) {
    return (
      <div className="space-y-6">
        <ToastContainer />
        <PageHeader
          title="Scoring"
          description="Configure points per position, kill value and squad size for the working tournament."
        />
        <Card>
          <CardContent>
            <EmptyState
              icon={Target}
              title="No tournament selected"
              description="Create or select a tournament first."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Scoring"
        description={`Points rules for ${activeTournament.name}${
          activeTournament.season ? ` · ${activeTournament.season}` : ""
        }.`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4" />
              Defaults
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      <p className="rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface-2)] px-3 py-2 text-xs text-[var(--adm-muted)]">
        {previewTotals}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Scoring mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={trackKills}
              onChange={(e) => setTrackKills(e.target.checked)}
              className="mt-1 h-4 w-4 accent-blue-600"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">Track kills</span>
              <span className="block text-xs text-[var(--adm-muted)]">
                {trackKills
                  ? "Eliminations are read from screenshots and award points."
                  : "Position-only: teams score from placement alone. Kills are not read, entered or scored."}
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--adm-muted)]">
              Squad size (players per team)
            </label>
            <Select
              value={String(squadSize)}
              onChange={(e) => setSquadSize(Number(e.target.value))}
            >
              <option value="1">1 — Solo</option>
              <option value="2">2 — Duo</option>
              <option value="3">3 — Trio</option>
              <option value="4">4 — Squad</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--adm-muted)]">
              Points per kill
            </label>
            <Input
              type="number"
              min={0}
              step={1}
              value={killMultiplier}
              disabled={!trackKills}
              className={trackKills ? undefined : "opacity-50"}
              onChange={(e) =>
                setKillMultiplier(Math.max(0, Number(e.target.value) || 0))
              }
            />
            {!trackKills ? (
              <p className="text-[11px] text-[var(--adm-muted)]">
                Kills are not scored in position-first mode.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position points</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: POSITION_COUNT }, (_, i) => String(i + 1)).map(
            (position) => (
              <div key={position} className="space-y-1">
                <label className="text-xs font-medium text-[var(--adm-muted)]">
                  P{position}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={positionPoints[position] ?? 0}
                  onChange={(e) => setPosition(position, e.target.value)}
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-[var(--adm-muted)]">
        Saving recalculates all team totals in this tournament using the new
        rules.
      </p>
    </div>
  );
}
