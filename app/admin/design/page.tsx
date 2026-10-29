"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { GiGears, GiDeathSkull } from "react-icons/gi";
import { api } from "@/lib/api";
import { useTournament } from "@/components/providers/TournamentProvider";
import {
  AMBIENT_LABELS,
  COLOR_FIELDS,
  DEFAULT_POINTS_TABLE,
  ENTRANCE_LABELS,
  FONT_FAMILIES,
  GAME_LABELS,
  SURFACE_STYLE_LABELS,
  TABLE_PRESETS,
  TEMPLATE_LABELS,
  WATERMARK_CORNER_LABELS,
  mergePointsTable,
  type AmbientEffect,
  type EntranceAnimation,
  type LeaderboardHeaderLabels,
  type LeaderboardSettings,
  type MatchSettings,
  type NotificationSettings,
  type OverlaySurface,
  type OverlayTemplate,
  type OverlayTypography,
  type OverlayWatermark,
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
  const [previewNonce, setPreviewNonce] = useState(0);
  const [tab, setTab] = useState<TabKey>("table");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

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
    key: "logo" | "alive" | "place" | "pts" | "elims",
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
    value: boolean | string | number
  ) => {
    setDraft((prev) => ({
      ...prev,
      leaderboard: { ...prev.leaderboard, [key]: value } as LeaderboardSettings,
    }));
  };

  const updateMatch = (key: keyof MatchSettings, value: boolean | string) => {
    setDraft((prev) => ({
      ...prev,
      match: { ...prev.match, [key]: value } as MatchSettings,
    }));
  };

  const updateTypography = (
    key: keyof OverlayTypography,
    value: string | number | boolean
  ) => {
    setDraft((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value } as OverlayTypography,
    }));
  };

  const updateSurface = (
    key: keyof OverlaySurface,
    value: string | number | boolean
  ) => {
    setDraft((prev) => ({
      ...prev,
      surface: { ...prev.surface, [key]: value } as OverlaySurface,
    }));
  };

  const updateLayoutNumber = (key: "gap", value: number) => {
    setDraft((prev) => ({ ...prev, layout: { ...prev.layout, [key]: value } }));
  };

  const setTemplate = (
    section: "table" | "notification" | "leaderboard" | "match",
    value: OverlayTemplate
  ) => {
    setDraft((prev) => {
      if (section === "table") {
        return { ...prev, layout: { ...prev.layout, template: value } };
      }
      if (section === "notification") {
        return {
          ...prev,
          notifications: { ...prev.notifications, template: value },
        };
      }
      if (section === "leaderboard") {
        return {
          ...prev,
          leaderboard: { ...prev.leaderboard, template: value },
        };
      }
      return { ...prev, match: { ...prev.match, template: value } };
    });
  };

  const updatePosition = (
    key: "vertical" | "horizontal" | "offsetX" | "offsetY",
    value: string | number
  ) => {
    setDraft((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        position: { ...prev.notifications.position, [key]: value },
      } as NotificationSettings,
    }));
  };

  const updateWatermark = (
    key: keyof OverlayWatermark,
    value: boolean | number | string
  ) => {
    setDraft((prev) => ({
      ...prev,
      watermark: { ...prev.watermark, [key]: value } as OverlayWatermark,
    }));
  };

  const updateHeaderLabel = (
    key: keyof LeaderboardHeaderLabels,
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      leaderboard: {
        ...prev.leaderboard,
        headerLabels: { ...prev.leaderboard.headerLabels, [key]: value },
      },
    }));
  };

  const uploadImage = async (file: File, key: string): Promise<string | null> => {
    setUploading(key);
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await api.post("/system/upload-image", form);
      const url = response.data?.data?.url as string | undefined;
      if (!url) {
        notifyError("Upload did not return an image URL.");
        return null;
      }
      return url;
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : undefined;
      notifyError(message || "Image upload failed.");
      return null;
    } finally {
      setUploading(null);
    }
  };

  const imageField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    key: string
  ) => (
    <div className="space-y-2">
      <div className="text-sm text-gray-300">{label}</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or upload"
          className="flex-1 min-w-0 bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
        />
        <label className="cursor-pointer rounded-lg border-2 border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-600/20">
          {uploading === key ? "Uploading..." : "Upload"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = await uploadImage(file, key);
                if (url) onChange(url);
              }
              e.target.value = "";
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg border-2 border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-600/20"
          >
            Clear
          </button>
        ) : null}
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="h-16 w-auto rounded border border-red-500/20 object-contain"
        />
      ) : null}
    </div>
  );

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

  const rangeRow = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    format?: (v: number) => string
  ) => (
    <div key={label}>
      <div className="flex justify-between text-sm text-gray-300">
        <span>{label}</span>
        <span>{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-red-500"
      />
    </div>
  );

  const selectRow = (
    label: string,
    value: string,
    options: { key: string; label: string }[],
    onChange: (v: string) => void
  ) => (
    <label
      key={label}
      className="flex items-center justify-between gap-3 text-sm text-gray-300 bg-gray-900/60 rounded-lg px-3 py-2"
    >
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-800 border border-red-500/30 rounded px-2 py-1 text-white text-sm"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  const templatePicker = (
    current: OverlayTemplate,
    onPick: (v: OverlayTemplate) => void
  ) => (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {TEMPLATE_LABELS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onPick(t.key)}
          className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
            current === t.key
              ? "border-red-500 bg-red-600/20"
              : "border-red-500/20 hover:bg-red-600/10"
          }`}
        >
          <div className="text-sm font-semibold text-white">{t.label}</div>
          <div className="text-[11px] text-gray-400">{t.blurb}</div>
        </button>
      ))}
    </div>
  );

  const renderAppearanceSections = () => (
    <>
      <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Typography</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-between gap-3 text-sm text-gray-300 bg-gray-900/60 rounded-lg px-3 py-2">
            <span>Font family</span>
            <select
              value={draft.typography.fontFamily}
              onChange={(e) => updateTypography("fontFamily", e.target.value)}
              className="bg-gray-800 border border-red-500/30 rounded px-2 py-1 text-white text-sm"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          {checkboxRow("Uppercase names", draft.typography.uppercase, (v) =>
            updateTypography("uppercase", v)
          )}
        </div>
        {rangeRow(
          "Font scale",
          draft.typography.fontScale,
          0.7,
          1.8,
          0.05,
          (v) => updateTypography("fontScale", v),
          (v) => `${v.toFixed(2)}x`
        )}
        {rangeRow(
          "Letter spacing",
          draft.typography.letterSpacing,
          0,
          0.2,
          0.01,
          (v) => updateTypography("letterSpacing", v),
          (v) => `${v.toFixed(2)}em`
        )}
        <p className="text-xs text-gray-400">
          Shared by every overlay. Per-overlay font scale in the Layout section
          multiplies on top of this.
        </p>
      </section>

      <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Panel Surface</h2>
        <div className="flex flex-wrap gap-2">
          {SURFACE_STYLE_LABELS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => updateSurface("style", s.key)}
              className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all ${
                draft.surface.style === s.key
                  ? "border-red-500 bg-red-600/20 text-white"
                  : "border-red-500/20 text-gray-300 hover:bg-red-600/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {checkboxRow("Drop shadow", draft.surface.shadow, (v) =>
            updateSurface("shadow", v)
          )}
          {checkboxRow("Scanlines", draft.surface.scanline, (v) =>
            updateSurface("scanline", v)
          )}
          {checkboxRow("Ambient effects", draft.surface.animate, (v) =>
            updateSurface("animate", v)
          )}
        </div>
        {rangeRow(
          "Corner radius",
          draft.surface.radius,
          0,
          32,
          1,
          (v) => updateSurface("radius", v),
          (v) => `${v}px`
        )}
        {rangeRow(
          "Border width",
          draft.surface.borderWidth,
          0,
          4,
          1,
          (v) => updateSurface("borderWidth", v),
          (v) => `${v}px`
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rangeRow(
            "Opacity (glass/solid)",
            draft.surface.opacity,
            0.2,
          1,
            0.02,
            (v) => updateSurface("opacity", v),
            (v) => `${Math.round(v * 100)}%`
          )}
          {rangeRow(
            "Blur (glass)",
            draft.surface.blur,
            0,
            24,
            1,
            (v) => updateSurface("blur", v),
            (v) => `${v}px`
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-between gap-3 text-sm text-gray-300 bg-gray-900/60 rounded-lg px-3 py-2">
            <span>Gradient start</span>
            <input
              type="color"
              value={draft.surface.gradientFrom || draft.colors.panelFrom}
              onChange={(e) => updateSurface("gradientFrom", e.target.value)}
              className="h-7 w-10 rounded bg-transparent"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm text-gray-300 bg-gray-900/60 rounded-lg px-3 py-2">
            <span>Gradient end</span>
            <input
              type="color"
              value={draft.surface.gradientTo || draft.colors.panelTo}
              onChange={(e) => updateSurface("gradientTo", e.target.value)}
              className="bg-transparent"
            />
          </label>
        </div>
        {rangeRow(
          "Gradient angle",
          draft.surface.gradientAngle,
          0,
          360,
          5,
          (v) => updateSurface("gradientAngle", v),
          (v) => `${v}deg`
        )}
        {imageField(
          "Panel background image",
          draft.surface.backgroundImage,
          (v) => updateSurface("backgroundImage", v),
          "bg"
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rangeRow(
            "Background image opacity",
            draft.surface.backgroundImageOpacity,
            0,
            1,
            0.05,
            (v) => updateSurface("backgroundImageOpacity", v),
            (v) => `${Math.round(v * 100)}%`
          )}
          {rangeRow(
            "Background image blur",
            draft.surface.backgroundImageBlur,
            0,
            24,
            1,
            (v) => updateSurface("backgroundImageBlur", v),
            (v) => `${v}px`
          )}
        </div>
      </section>

      <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Animation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectRow(
            "Row entrance",
            draft.surface.entrance,
            ENTRANCE_LABELS,
            (v) => updateSurface("entrance", v as EntranceAnimation)
          )}
          {selectRow(
            "Ambient effect",
            draft.surface.ambient,
            AMBIENT_LABELS,
            (v) => updateSurface("ambient", v as AmbientEffect)
          )}
        </div>
        {rangeRow(
          "Entrance duration",
          draft.surface.entranceDuration,
          150,
          1200,
          10,
          (v) => updateSurface("entranceDuration", v),
          (v) => `${v}ms`
        )}
        {rangeRow(
          "Stagger between rows",
          draft.surface.stagger,
          0,
          150,
          5,
          (v) => updateSurface("stagger", v),
          (v) => `${v}ms`
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            Rows animate in while the table loads, then glide into their new
            order when scores change. Ambient effects need the toggle in Panel
            Surface.
          </p>
          <button
            type="button"
            onClick={() => setPreviewNonce((n) => n + 1)}
            className="rounded-lg border-2 border-red-500/40 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600/20"
          >
            Replay entrance
          </button>
        </div>
      </section>

      <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Watermark</h2>
        <div className="flex flex-wrap gap-4">
          {checkboxRow("Show watermark", draft.watermark.enabled, (v) =>
            updateWatermark("enabled", v)
          )}
        </div>
        {imageField(
          "Watermark image",
          draft.watermark.image,
          (v) => updateWatermark("image", v),
          "wm"
        )}
        <div className="flex flex-wrap gap-2">
          {WATERMARK_CORNER_LABELS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => updateWatermark("corner", c.key)}
              className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all ${
                draft.watermark.corner === c.key
                  ? "border-red-500 bg-red-600/20 text-white"
                  : "border-red-500/20 text-gray-300 hover:bg-red-600/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rangeRow(
            "Size",
            draft.watermark.size,
            16,
            320,
            2,
            (v) => updateWatermark("size", v),
            (v) => `${v}px`
          )}
          {rangeRow(
            "Opacity",
            draft.watermark.opacity,
            0,
            1,
            0.05,
            (v) => updateWatermark("opacity", v),
            (v) => `${Math.round(v * 100)}%`
          )}
        </div>
        {rangeRow(
          "Corner offset",
          draft.watermark.offset,
          0,
          200,
          2,
          (v) => updateWatermark("offset", v),
          (v) => `${v}px`
        )}
      </section>
    </>
  );

  const renderControls = () => {
    if (tab === "table") {
      return (
        <>
          <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-3">
            <h2 className="text-lg font-semibold text-red-400">
              Design Template
            </h2>
            {templatePicker(draft.layout.template, (v) =>
              setTemplate("table", v)
            )}
            {rangeRow(
              "Row gap",
              draft.layout.gap,
              0,
              16,
              1,
              (v) => updateLayoutNumber("gap", v),
              (v) => `${v}px`
            )}
          </section>

          <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20">
            <h2 className="text-lg font-semibold text-red-400 mb-3">
              Columns & Elements
            </h2>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["logo", "Team logo"],
                  ["alive", "ALIVE column"],
                  ["place", "PLACE column"],
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
              value={draft.header.subtitle}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  header: { ...prev.header, subtitle: e.target.value },
                }))
              }
              placeholder="Subtitle / stage label (optional)"
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
        <>
        <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-3">
          <h2 className="text-lg font-semibold text-red-400">Design Template</h2>
          {templatePicker(draft.notifications.template, (v) =>
            setTemplate("notification", v)
          )}
        </section>
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
        <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
          <h2 className="text-lg font-semibold text-red-400">
            Position (OBS overlay)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 text-sm text-gray-300 bg-gray-900/60 rounded-lg px-3 py-2">
              <span>Vertical</span>
              <select
                value={draft.notifications.position.vertical}
                onChange={(e) => updatePosition("vertical", e.target.value)}
                className="bg-gray-800 border border-red-500/30 rounded px-2 py-1 text-white text-sm"
              >
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-3 text-sm text-gray-300 bg-gray-900/60 rounded-lg px-3 py-2">
              <span>Horizontal</span>
              <select
                value={draft.notifications.position.horizontal}
                onChange={(e) => updatePosition("horizontal", e.target.value)}
                className="bg-gray-800 border border-red-500/30 rounded px-2 py-1 text-white text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
          {rangeRow(
            "Offset X",
            draft.notifications.position.offsetX,
            0,
            600,
            4,
            (v) => updatePosition("offsetX", v),
            (v) => `${v}px`
          )}
          {rangeRow(
            "Offset Y",
            draft.notifications.position.offsetY,
            0,
            600,
            4,
            (v) => updatePosition("offsetY", v),
            (v) => `${v}px`
          )}
        </section>
        </>
      );
    }

    if (tab === "leaderboard") {
      return (
        <>
        <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-3">
          <h2 className="text-lg font-semibold text-red-400">Design Template</h2>
          {templatePicker(draft.leaderboard.template, (v) =>
            setTemplate("leaderboard", v)
          )}
        </section>
        <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
          <h2 className="text-lg font-semibold text-red-400 mb-1">
            Leaderboard
          </h2>
          <div className="flex flex-wrap gap-4">
            {(
              [
                ["showTitle", "Show title / heading"],
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
          <div className="space-y-3">
            <input
              type="text"
              value={draft.leaderboard.title}
              onChange={(e) => updateLeaderboard("title", e.target.value)}
              placeholder="Heading (default: Overall Rankings)"
              className="w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
            <input
              type="text"
              value={draft.leaderboard.subtitle}
              onChange={(e) => updateLeaderboard("subtitle", e.target.value)}
              placeholder="Subtitle (optional)"
              className="w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>
          {imageField(
            "Banner image (shown next to the title)",
            draft.leaderboard.bannerImage,
            (v) => updateLeaderboard("bannerImage", v),
            "lb-banner"
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rangeRow(
              "Logo size",
              draft.leaderboard.logoSize,
              16,
              96,
              1,
              (v) => updateLeaderboard("logoSize", v),
              (v) => `${v}px`
            )}
            {rangeRow(
              "Logo corner radius",
              draft.leaderboard.logoRounding,
              0,
              48,
              1,
              (v) => updateLeaderboard("logoRounding", v),
              (v) => `${v}px`
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-300">Column labels</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  ["rank", "Rank"],
                  ["team", "Team"],
                  ["place", "Place"],
                  ["elims", "Elims"],
                  ["total", "Total"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-xs text-gray-400">
                  {label}
                  <input
                    type="text"
                    value={draft.leaderboard.headerLabels[key]}
                    onChange={(e) => updateHeaderLabel(key, e.target.value)}
                    className="mt-1 w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </label>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={draft.leaderboard.footerNote}
            onChange={(e) => updateLeaderboard("footerNote", e.target.value)}
            placeholder="Footer note (optional, e.g. Round 4 - Erangel)"
            className="w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
          />
          <p className="text-xs text-gray-400">
            Colors come from the shared theme. Adjust them in the Points Table
            tab.
          </p>
        </section>
        </>
      );
    }

    return (
      <>
      <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-3">
        <h2 className="text-lg font-semibold text-red-400">Design Template</h2>
        {templatePicker(draft.match.template, (v) => setTemplate("match", v))}
      </section>
      <section className="bg-gray-800/60 rounded-xl p-5 border-2 border-red-500/20 space-y-4">
        <h2 className="text-lg font-semibold text-red-400 mb-1">
          Match Table
        </h2>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["showTitle", "Show title / heading"],
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
        <div className="space-y-3">
          <input
            type="text"
            value={draft.match.title}
            onChange={(e) => updateMatch("title", e.target.value)}
            placeholder="Title (default: brand name)"
            className="w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
          />
          <input
            type="text"
            value={draft.match.subtitle}
            onChange={(e) => updateMatch("subtitle", e.target.value)}
            placeholder="Subtitle (optional)"
            className="w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
          />
        </div>
        {imageField(
          "Banner image (shown next to the title)",
          draft.match.bannerImage,
          (v) => updateMatch("bannerImage", v),
          "match-banner"
        )}
        <input
          type="text"
          value={draft.match.footerNote}
          onChange={(e) => updateMatch("footerNote", e.target.value)}
          placeholder="Footer note (optional)"
          className="w-full bg-gray-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
        />
        <p className="text-xs text-gray-400">
          Colors come from the shared theme. Adjust them in the Points Table
          tab.
        </p>
      </section>
      </>
    );
  };

  const renderPreview = () => {
    if (tab === "table") {
      return (
        <div
          className="rounded-xl p-6 border-2 border-red-500/30 overflow-auto"
          style={{
            backgroundColor: "#111827",
            backgroundImage:
              "linear-gradient(45deg, #1f2937 25%, transparent 25%), linear-gradient(-45deg, #1f2937 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f2937 75%), linear-gradient(-45deg, transparent 75%, #1f2937 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        >
          <AnimatedTeamTable
            key={`table-preview-${previewNonce}`}
            previewSettings={draft}
          />
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
                  <h2 className="text-lg font-semibold text-red-400 mb-1">
                    Preset Themes
                  </h2>
                  <p className="mb-3 text-xs text-gray-400">
                    Pick a game to filter matching table designs, then fine-tune
                    the colors below.
                  </p>
                  {GAME_LABELS.map((group) => {
                    const presets = TABLE_PRESETS.filter(
                      (p) => p.game === group.key
                    );
                    if (presets.length === 0) return null;
                    return (
                      <div key={group.key} className="mb-4 last:mb-0">
                        <div className="mb-2 flex items-baseline gap-2">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-red-300">
                            {group.label}
                          </h3>
                          <span className="text-[11px] text-gray-500">
                            {group.blurb}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {presets.map((preset) => (
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
                      </div>
                    );
                  })}
                </section>

                {renderControls()}

                {renderAppearanceSections()}

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
