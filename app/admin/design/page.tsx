"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { GiGears, GiDeathSkull } from "react-icons/gi";
import { api } from "@/lib/api";
import { useTournament } from "@/components/providers/TournamentProvider";
import {
  COLOR_FIELDS,
  DEFAULT_POINTS_TABLE,
  TABLE_PRESETS,
  mergePointsTable,
  type LeaderboardSettings,
  type MatchSettings,
  type NotificationSettings,
  type PointsTableColors,
  type PointsTableSettings,
} from "@/lib/tableSettings";
import AnimatedTeamTable from "@/components/TeamTable2";
import GamingEliminationNotification from "@/components/GamingEliminationNotification";
import SplitLeaderboard from "@/components/Leaderboard";
import MatchTable from "@/components/MatchTable";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";

type TabKey = "table" | "notification" | "leaderboard" | "match";

const TABS: { key: TabKey; label: string }[] = [
  { key: "table", label: "Points Table" },
  { key: "notification", label: "Notification" },
  { key: "leaderboard", label: "Leaderboard" },
  { key: "match", label: "Match Table" },
];

const PREVIEW_TEAMS = [
  { _id: "p1", name: "TEAM ALPHA", logo: "/placeholder.svg", slot: 1, currentRound: 1, totalPoints: 16, rounds: [{ roundNumber: 1, kills: 6, killPoints: 6, position: 1, positionPoints: 10, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p2", name: "TEAM BRAVO", logo: "/placeholder.svg", slot: 2, currentRound: 1, totalPoints: 12, rounds: [{ roundNumber: 1, kills: 4, killPoints: 4, position: 2, positionPoints: 8, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p3", name: "TEAM CHARLIE", logo: "/placeholder.svg", slot: 3, currentRound: 1, totalPoints: 9, rounds: [{ roundNumber: 1, kills: 6, killPoints: 6, position: 5, positionPoints: 3, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p4", name: "TEAM DELTA", logo: "/placeholder.svg", slot: 4, currentRound: 1, totalPoints: 7, rounds: [{ roundNumber: 1, kills: 5, killPoints: 5, position: 8, positionPoints: 2, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
];

export default function SettingsPage() {
  const [draft, setDraft] = useState<PointsTableSettings>(DEFAULT_POINTS_TABLE);
  const [original, setOriginal] = useState<PointsTableSettings>(
    DEFAULT_POINTS_TABLE
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabKey>("table");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const { tournamentId, activeTournament } = useTournament();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get("/settings");
        const merged = mergePointsTable(response.data?.data?.pointsTable);
        setDraft(merged);
        setOriginal(merged);
      } catch {
        notifyError("Failed to load settings. Showing defaults.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId]);

  const updateColors = (key: keyof PointsTableColors, value: string) => {
    setDraft((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateColumn = (
    key: "logo" | "alive" | "pts" | "elims",
    value: boolean
  ) => {
    setDraft((prev) => ({
      ...prev,
      columns: { ...prev.columns, [key]: value },
    }));
  };

  const updateNotification = (
    key: keyof NotificationSettings,
    value: boolean | number
  ) => {
    setDraft((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateLeaderboard = (
    key: keyof LeaderboardSettings,
    value: boolean
  ) => {
    setDraft((prev) => ({
      ...prev,
      leaderboard: { ...prev.leaderboard, [key]: value },
    }));
  };

  const updateMatch = (key: keyof MatchSettings, value: boolean) => {
    setDraft((prev) => ({
      ...prev,
      match: { ...prev.match, [key]: value },
    }));
  };

  const applyPreset = (presetSettings: PointsTableSettings) => {
    setDraft((prev) => ({
      ...prev,
      preset: presetSettings.preset,
      colors: presetSettings.colors,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put("/settings", { pointsTable: draft });
      const merged = mergePointsTable(response.data?.data?.pointsTable);
      setDraft(merged);
      setOriginal(merged);
      notifySuccess("Design settings saved - viewers update live.");
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : undefined;
      notifyError(message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      notifySuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : undefined;
      notifyError(message || "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleClass = "h-4 w-4 accent-red-500";

  const checkboxRow = (
    label: string,
    checked: boolean,
    onChange: (v: boolean) => void
  ) => (
    <label
      key={label}
      className="flex items-center gap-2 text-sm text-gray-300"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={toggleClass}
      />
      {label}
    </label>
  );

  const renderControls = () => {
    if (tab === "table") {
      return (
        <>
          <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20">
            <h2 className="text-lg font-semibold text-red-400 mb-3">
              Columns & Elements
            </h2>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["logo", "Team logo"],
                  ["alive", "ALIVE column"],
                  ["pts", "PTS column"],
                  ["elims", "ELIMS column"],
                ] as const
              ).map(([key, label]) =>
                checkboxRow(label, draft.columns[key], (v) =>
                  updateColumn(key, v)
                )
              )}
              {checkboxRow("Trophy for #1", draft.layout.showTrophy, (v) =>
                setDraft((prev) => ({
                  ...prev,
                  layout: { ...prev.layout, showTrophy: v },
                }))
              )}
            </div>
          </section>

          <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20">
            <h2 className="text-lg font-semibold text-red-400 mb-3">Colors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COLOR_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center justify-between gap-3 text-sm text-gray-300 bg-gray-900/60 rounded-lg px-3 py-2"
                >
                  <span>{field.label}</span>
                  <input
                    type="color"
                    value={draft.colors[field.key]}
                    onChange={(e) => updateColors(field.key, e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-red-500/30 bg-transparent"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-3">
            <h2 className="text-lg font-semibold text-red-400">Table Header</h2>
            <input
              type="text"
              value={draft.header.title}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  header: { ...prev.header, title: e.target.value },
                }))
              }
              placeholder="Tournament title (optional)"
              className="w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
            <input
              type="text"
              value={draft.header.logoUrl}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  header: { ...prev.header, logoUrl: e.target.value },
                }))
              }
              placeholder="Header logo URL (optional)"
              className="w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </section>

          <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
            <h2 className="text-lg font-semibold text-red-400">Layout</h2>
            {(
              [
                ["Width", "width", 200, 640, 1],
                ["Row height", "rowHeight", 26, 60, 1],
                ["Font scale", "fontScale", 0.7, 1.6, 0.05],
              ] as const
            ).map(([label, key, min, max, step]) => (
              <div key={key}>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{label}</span>
                  <span>
                    {key === "fontScale"
                      ? `${draft.layout.fontScale.toFixed(2)}x`
                      : `${draft.layout[key]}px`}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={draft.layout[key]}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        [key]: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-red-500"
                />
              </div>
            ))}
          </section>
        </>
      );
    }

    if (tab === "notification") {
      return (
        <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
          <h2 className="text-lg font-semibold text-red-400 mb-1">
            Elimination Notification
          </h2>
          <div className="flex flex-wrap gap-4">
            {(
              [
                ["showLogo", "Show team logo"],
                ["showKills", "Show elims badge"],
                ["showRank", "Show rank block"],
                ["showRound", "Show round label"],
              ] as const
            ).map(([key, label]) =>
              checkboxRow(label, draft.notifications[key], (v) =>
                updateNotification(key, v)
              )
            )}
          </div>
          <div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Display duration</span>
              <span>{(draft.notifications.durationMs / 1000).toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={1000}
              max={15000}
              step={500}
              value={draft.notifications.durationMs}
              onChange={(e) =>
                updateNotification("durationMs", Number(e.target.value))
              }
              className="w-full accent-red-500"
            />
          </div>
          <p className="text-xs text-gray-400">
            Colors come from the shared theme. Adjust them in the Points Table
            tab.
          </p>
        </section>
      );
    }

    if (tab === "leaderboard") {
      return (
        <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
          <h2 className="text-lg font-semibold text-red-400 mb-1">
            Leaderboard
          </h2>
          <div className="flex flex-wrap gap-4">
            {(
              [
                ["showLogo", "Show team logo"],
                ["showPlace", "Show place points"],
                ["showElims", "Show elims"],
                ["showTotal", "Show total"],
                ["showChickens", "Show chicken badges"],
              ] as const
            ).map(([key, label]) =>
              checkboxRow(label, draft.leaderboard[key], (v) =>
                updateLeaderboard(key, v)
              )
            )}
          </div>
          <p className="text-xs text-gray-400">
            Colors come from the shared theme. Adjust them in the Points Table
            tab.
          </p>
        </section>
      );
    }

    return (
      <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
        <h2 className="text-lg font-semibold text-red-400 mb-1">
          Match Table
        </h2>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["showLogo", "Show team logo"],
              ["showRank", "Show rank column"],
              ["showElims", "Show elims"],
              ["showPlace", "Show place points"],
              ["showTotal", "Show total"],
            ] as const
          ).map(([key, label]) =>
            checkboxRow(label, draft.match[key], (v) => updateMatch(key, v))
          )}
        </div>
        <p className="text-xs text-gray-400">
          Colors come from the shared theme. Adjust them in the Points Table
          tab.
        </p>
      </section>
    );
  };

  const renderPreview = () => {
    if (tab === "table") {
      return (
        <div className="bg-green-500 rounded-xl p-6 border-2 border-red-500/30 overflow-auto">
          <AnimatedTeamTable previewSettings={draft} />
        </div>
      );
    }
    if (tab === "notification") {
      return (
        <div className="rounded-xl p-6 border-2 border-red-500/30 overflow-auto flex justify-center"
          style={{
            background: `linear-gradient(135deg, ${draft.colors.notificationFrom} 0%, ${draft.colors.notificationTo} 100%)`,
          }}
        >
          <GamingEliminationNotification
            previewSettings={draft}
            preview
            inline
          />
        </div>
      );
    }
    if (tab === "leaderboard") {
      return (
        <div className="bg-slate-100 rounded-xl p-4 border-2 border-red-500/30 overflow-auto">
          <SplitLeaderboard teams={PREVIEW_TEAMS} settings={draft} />
        </div>
      );
    }
    return (
      <div className="rounded-xl border-2 border-red-500/30 overflow-hidden">
        <MatchTable previewSettings={draft} preview inline />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <GiGears className="text-4xl text-red-500 animate-spin" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
              Broadcast Designer
            </h1>
            {activeTournament ? (
              <span className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-medium text-red-200">
                {activeTournament.name}
                {activeTournament.season ? ` · ${activeTournament.season}` : ""}
              </span>
            ) : null}
          </div>
          <Link
            href="/admin/overview"
            className="px-4 py-2 rounded-lg border-2 border-red-500/40 text-red-300 hover:text-white hover:bg-red-600/30 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">
            Loading settings...
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-5 py-2 rounded-lg font-semibold border-2 transition-all ${
                    tab === t.key
                      ? "bg-red-600 border-red-500 text-white"
                      : "border-red-500/30 text-red-200 hover:bg-red-600/20"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="space-y-6">
                {/* Presets */}
                <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20">
                  <h2 className="text-lg font-semibold text-red-400 mb-3">
                    Preset Themes
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {TABLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.pointsTable)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          draft.preset === preset.id
                            ? "border-red-500 bg-red-600/40 text-white"
                            : "border-red-500/30 text-gray-200 hover:bg-red-600/30"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </section>

                {renderControls()}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Design"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(original)}
                    className="px-6 py-3 rounded-lg font-bold border-2 border-red-500/40 text-red-300 hover:text-white hover:bg-red-600/20 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft(structuredClone(DEFAULT_POINTS_TABLE))
                    }
                    className="px-6 py-3 rounded-lg font-bold border-2 border-gray-500/40 text-gray-300 hover:text-white hover:bg-gray-600/20 transition-all"
                  >
                    Reset to Default
                  </button>
                </div>

                {/* Change password */}
                <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20">
                  <h2 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <GiDeathSkull /> Change Admin Password
                  </h2>
                  <form
                    onSubmit={handleChangePassword}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      required
                      className="bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      required
                      className="bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="sm:col-span-2 px-4 py-2 rounded-lg font-semibold bg-red-600/80 hover:bg-red-700 text-white transition-all disabled:opacity-50"
                    >
                      {changingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </section>
              </div>

              {/* Live preview */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-red-400">
                  Live Preview
                </h2>
                <div className="sticky top-8 overflow-auto">{renderPreview()}</div>
                <p className="text-xs text-gray-400">
                  One shared theme drives every overlay. Save to push it to all
                  viewers instantly.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
