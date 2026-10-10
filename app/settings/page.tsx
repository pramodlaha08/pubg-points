"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { GiGears, GiDeathSkull } from "react-icons/gi";
import { api } from "@/lib/api";
import {
  COLOR_FIELDS,
  DEFAULT_POINTS_TABLE,
  TABLE_PRESETS,
  mergePointsTable,
  type PointsTableColors,
  type PointsTableSettings,
} from "@/lib/tableSettings";
import AnimatedTeamTable from "@/components/TeamTable2";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";

export default function SettingsPage() {
  const [draft, setDraft] = useState<PointsTableSettings>(DEFAULT_POINTS_TABLE);
  const [original, setOriginal] = useState<PointsTableSettings>(
    DEFAULT_POINTS_TABLE
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
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
  }, []);

  const updateColors = (key: keyof PointsTableColors, value: string) => {
    setDraft((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateColumn = (key: "alive" | "pts" | "elims", value: boolean) => {
    setDraft((prev) => ({
      ...prev,
      columns: { ...prev.columns, [key]: value },
    }));
  };

  const applyPreset = (presetSettings: PointsTableSettings) => {
    setDraft((prev) => ({
      ...presetSettings,
      header: prev.header,
      layout: prev.layout,
      columns: prev.columns,
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

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <GiGears className="text-4xl text-red-500 animate-spin" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
              Points Table Designer
            </h1>
          </div>
          <Link
            href="/"
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
                      className="px-4 py-2 rounded-lg border-2 border-red-500/30 text-gray-200 hover:bg-red-600/30 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Colors */}
              <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20">
                <h2 className="text-lg font-semibold text-red-400 mb-3">
                  Colors
                </h2>
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
                        onChange={(e) =>
                          updateColors(field.key, e.target.value)
                        }
                        className="h-8 w-12 cursor-pointer rounded border border-red-500/30 bg-transparent"
                      />
                    </label>
                  ))}
                </div>
              </section>

              {/* Columns */}
              <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20">
                <h2 className="text-lg font-semibold text-red-400 mb-3">
                  Columns & Elements
                </h2>
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      ["alive", "ALIVE column"],
                      ["pts", "PTS column"],
                      ["elims", "ELIMS column"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={draft.columns[key]}
                        onChange={(e) => updateColumn(key, e.target.checked)}
                        className="h-4 w-4 accent-red-500"
                      />
                      {label}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={draft.layout.showTrophy}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          layout: {
                            ...prev.layout,
                            showTrophy: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 accent-red-500"
                    />
                    Trophy for #1
                  </label>
                </div>
              </section>

              {/* Header */}
              <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-3">
                <h2 className="text-lg font-semibold text-red-400">
                  Table Header
                </h2>
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

              {/* Layout */}
              <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
                <h2 className="text-lg font-semibold text-red-400">Layout</h2>
                <div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Width</span>
                    <span>{draft.layout.width}px</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={640}
                    value={draft.layout.width}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        layout: {
                          ...prev.layout,
                          width: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full accent-red-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Row height</span>
                    <span>{draft.layout.rowHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min={26}
                    max={60}
                    value={draft.layout.rowHeight}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        layout: {
                          ...prev.layout,
                          rowHeight: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full accent-red-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Font scale</span>
                    <span>{draft.layout.fontScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.7}
                    max={1.6}
                    step={0.05}
                    value={draft.layout.fontScale}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        layout: {
                          ...prev.layout,
                          fontScale: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full accent-red-500"
                  />
                </div>
              </section>

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
              <div className="sticky top-8 bg-green-500 rounded-xl p-6 border-2 border-red-500/30 overflow-auto">
                <AnimatedTeamTable previewSettings={draft} />
              </div>
              <p className="text-xs text-gray-400">
                Green background simulates the OBS chroma-key. Save to push this
                design to every viewer instantly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
