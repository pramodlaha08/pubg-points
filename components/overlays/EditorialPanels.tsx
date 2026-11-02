"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type {
  CountdownState,
  LowerThirdState,
  WinnerState,
} from "@/types/broadcast";
import type { KillFeedEvent } from "@/hooks/useKillFeed";
import type { WinnerTeam } from "@/components/overlays/BroadcastPanels";
import { useSettings } from "@/hooks/useSettings";
import {
  getTablePreset,
  mergePointsTable,
  type OverlayCardStyle,
  type PointsTableSettings,
} from "@/lib/tableSettings";
import { themeCut, themePatternStyle } from "@/lib/themeVisuals";

const toRgba = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value)) return hex;
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const number = Number.parseInt(full, 16);
  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${
    number & 255
  }, ${alpha})`;
};

function useOverlayTheme(previewSettings?: PointsTableSettings) {
  const { settings } = useSettings();
  const merged = mergePointsTable(previewSettings ?? settings?.pointsTable);
  const theme = getTablePreset(merged.preset);
  return {
    merged,
    theme,
    palette: merged.colors,
    typography: merged.typography,
    surface: merged.surface,
  };
}

function themePanel(merged: PointsTableSettings) {
  const { surface, colors } = merged;
  return {
    backgroundColor:
      surface.style === "none" ? "rgba(4,7,12,0.58)" : toRgba(colors.panelFrom, 0.96),
    backgroundImage:
      surface.style === "gradient"
        ? `linear-gradient(${surface.gradientAngle}deg, ${surface.gradientFrom || colors.panelFrom}, ${surface.gradientTo || colors.panelTo})`
        : undefined,
    border: `${surface.borderWidth}px solid ${toRgba(colors.accent, 0.34)}`,
    boxShadow: surface.shadow
      ? `0 22px 64px rgba(0,0,0,0.52), inset 0 0 36px ${toRgba(colors.accent, 0.04)}`
      : undefined,
    clipPath: themeCut(Math.max(6, Math.min(24, 8 + surface.radius))),
  } satisfies CSSProperties;
}

function ThemeLabel({
  text,
  accent,
  muted,
}: {
  text: string;
  accent: string;
  muted: string;
}) {
  return (
    <span
      className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.34em]"
      style={{ color: accent }}
    >
      <motion.span
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="h-1.5 w-1.5"
        style={{
          backgroundColor: accent,
          boxShadow: `0 0 10px ${accent}`,
        }}
      />
      <span style={{ color: muted }}>{text}</span>
    </span>
  );
}

export function EditorialKillFeed({
  events,
  now,
  preview = false,
  previewSettings,
}: {
  events: KillFeedEvent[];
  now: number;
  preview?: boolean;
  previewSettings?: PointsTableSettings;
}) {
  const { merged, theme, palette, typography } = useOverlayTheme(previewSettings);
  const visible = events
    .filter((event) => now - Date.parse(event.at) < 45000)
    .slice(0, 6);
  const nameStyle = {
    fontFamily: typography.fontFamily || undefined,
    letterSpacing: `${typography.letterSpacing || 0}px`,
    textTransform: typography.uppercase ? ("uppercase" as const) : undefined,
  };

  if (!visible.length) {
    return preview ? (
      <div
        className="relative w-[330px] overflow-hidden px-4 py-3"
        style={themePanel(merged)}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={themePatternStyle(theme.pattern, palette.accent)}
        />
        <div className="relative flex items-center justify-between">
          <ThemeLabel
            text="Live eliminations"
            accent={palette.accent}
            muted={palette.placeColor}
          />
          <span
            className="text-[8px] font-black uppercase tracking-[0.26em]"
            style={{ color: palette.placeColor }}
          >
            Feed
          </span>
        </div>
        <p
          className="relative mt-2 text-[12px] font-bold uppercase tracking-[0.08em]"
          style={{ color: toRgba(palette.textPrimary, 0.55), ...nameStyle }}
        >
          Eliminations appear here
        </p>
      </div>
    ) : null;
  }

  return (
    <div className="flex w-[330px] flex-col items-end gap-1.5">
      <div className="mb-1 flex w-full items-center justify-between px-1">
        <ThemeLabel
          text="Live eliminations"
          accent={palette.accent}
          muted={palette.placeColor}
        />
        <span
          className="text-[8px] font-black uppercase tracking-[0.26em]"
          style={{ color: palette.placeColor }}
        >
          {visible.length} events
        </span>
      </div>
      <AnimatePresence initial={false}>
        {visible.map((event, index) => {
          const seconds = Math.max(
            0,
            Math.round((now - Date.parse(event.at)) / 1000)
          );
          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, x: 40, filter: "blur(2px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 30, scale: 0.98 }}
              transition={{
                duration: 0.34,
                delay: Math.min(index * 0.03, 0.15),
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative w-full overflow-hidden px-3.5 py-2.5"
              style={themePanel(merged)}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={themePatternStyle(theme.pattern, palette.accent)}
              />
              <span
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{
                  backgroundColor: palette.accent,
                  boxShadow: `0 0 14px ${toRgba(palette.accent, 0.6)}`,
                }}
              />
              <div className="relative flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13px] font-black leading-none tracking-[0.04em]"
                    style={{ color: palette.textPrimary, ...nameStyle }}
                  >
                    {event.teamName}
                  </p>
                  <p
                    className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: palette.placeColor }}
                  >
                    {event.roundNumber ? `Round ${event.roundNumber}` : "Live"}
                    {event.kills !== null ? ` / ${event.kills} elims` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className="text-[18px] font-black leading-none tabular-nums"
                    style={{
                      color:
                        event.delta > 0 ? palette.accent : palette.textPrimary,
                      textShadow:
                        event.delta > 0
                          ? `0 0 16px ${toRgba(palette.accent, 0.3)}`
                          : undefined,
                    }}
                  >
                    {event.delta > 0 ? `+${event.delta}` : event.delta || "0"}
                  </p>
                  <p
                    className="mt-1 text-[7px] font-bold uppercase tracking-[0.14em] tabular-nums"
                    style={{ color: palette.placeColor }}
                  >
                    {seconds}s
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function EditorialLowerThird({
  state,
  preview = false,
  previewSettings,
  variant,
}: {
  state?: LowerThirdState;
  preview?: boolean;
  previewSettings?: PointsTableSettings;
  variant?: OverlayCardStyle;
}) {
  const { merged, theme, palette, typography } = useOverlayTheme(previewSettings);
  const show = Boolean(state?.visible && state.title) || preview;
  const title = state?.title || (preview ? "Lower third title" : "");
  const activeVariant = variant ?? merged.cards.lowerThird;
  const minimal = activeVariant === "minimal";
  const spotlight = activeVariant === "spotlight";
  const nameStyle = {
    fontFamily: typography.fontFamily || undefined,
    letterSpacing: `${typography.letterSpacing || 0}px`,
    textTransform: typography.uppercase ? ("uppercase" as const) : undefined,
  };

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="arena-lower-third"
          initial={{ opacity: 0, x: -24, clipPath: themeCut(12) }}
          animate={{ opacity: 1, x: 0, clipPath: themeCut(12) }}
          exit={{ opacity: 0, x: -18, clipPath: themeCut(12) }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`relative overflow-hidden ${
            spotlight
              ? "min-w-[500px] max-w-[860px] px-8 py-6"
              : minimal
                ? "min-w-[440px] max-w-[780px] px-6 py-4"
                : "min-w-[440px] max-w-[780px] px-7 py-5"
          }`}
          style={themePanel(merged)}
        >
          {!minimal ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                ...themePatternStyle(theme.pattern, palette.accent),
                opacity: spotlight ? 0.22 : 0.45,
              }}
            />
          ) : null}
          {!minimal ? (
            <span
              className="absolute inset-y-0 left-0"
              style={{
                width: spotlight ? 6 : 4,
                backgroundColor: palette.accent,
                boxShadow: `0 0 18px ${toRgba(palette.accent, 0.65)}`,
              }}
            />
          ) : null}
          {!minimal ? (
            <motion.span
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
              initial={{ x: "110%" }}
              animate={{ x: "230%" }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 1.6 }}
              style={{
                background: `linear-gradient(90deg, transparent, ${toRgba(palette.accent, 0.16)}, transparent)`,
              }}
            />
          ) : null}
          <div className="relative">
            <div className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-3">
                {state?.eventLogoUrl ? (
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center px-1"
                    style={{
                      backgroundColor: toRgba(palette.textPrimary, 0.06),
                      border: `1px solid ${toRgba(palette.accent, 0.3)}`,
                      clipPath: themeCut(4),
                    }}
                  >
                    <Image
                      src={state.eventLogoUrl}
                      alt=""
                      width={30}
                      height={30}
                      className="h-7 w-7 object-contain"
                    />
                  </span>
                ) : null}
                <ThemeLabel
                  text="Tournament update"
                  accent={palette.accent}
                  muted={palette.placeColor}
                />
              </div>
              <div className="flex items-center gap-2">
                {state?.mapName || state?.mapImageUrl ? (
                  <span
                    className="flex items-center gap-2 px-2 py-1"
                    style={{
                      backgroundColor: toRgba(palette.textPrimary, 0.04),
                      border: `1px solid ${toRgba(palette.accent, 0.22)}`,
                      clipPath: themeCut(4),
                    }}
                  >
                    {state.mapImageUrl ? (
                      <Image
                        src={state.mapImageUrl}
                        alt=""
                        width={22}
                        height={22}
                        className="h-5 w-5 object-cover"
                      />
                    ) : null}
                    <span
                      className="max-w-[130px] truncate text-[8px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: palette.placeColor }}
                    >
                      {state.mapName || "Map"}
                    </span>
                  </span>
                ) : null}
                <span
                  className="flex items-center gap-1.5 px-2 py-1 text-[7px] font-black uppercase tracking-[0.22em]"
                  style={{
                    color: palette.accent,
                    backgroundColor: toRgba(palette.accent, 0.1),
                    border: `1px solid ${toRgba(palette.accent, 0.3)}`,
                    clipPath: themeCut(4),
                  }}
                >
                  <span
                    className="h-1 w-1"
                    style={{
                      backgroundColor: palette.accent,
                      boxShadow: `0 0 8px ${palette.accent}`,
                    }}
                  />
                  On air
                </span>
              </div>
            </div>
            <p
              className={`mt-2 max-w-[660px] truncate font-black uppercase leading-[0.95] tracking-[0.015em] ${
                spotlight
                  ? "text-[44px]"
                  : minimal
                    ? "text-[30px]"
                    : "text-[36px]"
              }`}
              style={{ color: palette.textPrimary, ...nameStyle }}
            >
              {title}
            </p>
            {state?.subtitle || preview ? (
              <p
                className="mt-2 max-w-[640px] truncate text-[12px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: palette.placeColor }}
              >
                {state?.subtitle || "Subtitle appears here"}
              </p>
            ) : null}
            {state?.sponsorLogos?.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="text-[7px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: toRgba(palette.textPrimary, 0.42) }}
                >
                  Partners
                </span>
                {state.sponsorLogos.map((logo, index) => (
                  <span
                    key={`${logo}-${index}`}
                    className="flex h-7 items-center justify-center px-2"
                    style={{
                      backgroundColor: toRgba(palette.textPrimary, 0.05),
                      border: `1px solid ${toRgba(palette.textPrimary, 0.12)}`,
                      clipPath: themeCut(3),
                    }}
                  >
                    <Image
                      src={logo}
                      alt={`Partner ${index + 1}`}
                      width={56}
                      height={20}
                      className="h-4 w-auto max-w-[64px] object-contain"
                    />
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-4">
              <span
                className="text-[8px] font-bold uppercase tracking-[0.24em]"
                style={{ color: toRgba(palette.textPrimary, 0.42) }}
              >
                {theme.label}
              </span>
              <span
                className="h-px flex-1"
                style={{
                  background: `linear-gradient(90deg, ${toRgba(palette.accent, 0.45)}, transparent)`,
                }}
              />
              <span
                className="text-[8px] font-bold uppercase tracking-[0.24em]"
                style={{ color: toRgba(palette.textPrimary, 0.42) }}
              >
                Live broadcast
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

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

export function EditorialCountdown({
  state,
  serverTime,
  preview = false,
  previewSettings,
  variant,
}: {
  state?: CountdownState;
  serverTime?: string;
  preview?: boolean;
  previewSettings?: PointsTableSettings;
  variant?: OverlayCardStyle;
}) {
  const { merged, theme, palette, typography } = useOverlayTheme(previewSettings);
  const [now, setNow] = useState(() => Date.now());
  const offsetRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!serverTime) return;
    offsetRef.current = new Date(serverTime).getTime() - Date.now();
  }, [serverTime]);

  if (!state?.visible && !preview) return null;

  const remaining =
    state?.running && state?.endsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(state.endsAt).getTime() - (now + offsetRef.current)) / 1000
          )
        )
      : (state?.remainingSeconds ?? 300);
  const urgent = Boolean(state?.running) && remaining <= 10;
  const total = Math.max(1, state?.durationSeconds ?? remaining);
  const progress = Math.max(0, Math.min(1, remaining / total));
  const danger = palette.danger;
  const tone = urgent ? danger : palette.accent;
  const activeVariant = variant ?? merged.cards.countdown;
  const minimal = activeVariant === "minimal";
  const spotlight = activeVariant === "spotlight";
  const nameStyle = {
    fontFamily: typography.fontFamily || undefined,
    letterSpacing: `${typography.letterSpacing || 0}px`,
    textTransform: typography.uppercase ? ("uppercase" as const) : undefined,
  };

  return (
    <AnimatePresence>
      <motion.div
        key="arena-countdown"
        initial={{ opacity: 0, y: -18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden text-center ${
          spotlight
            ? "min-w-[430px] px-9 py-7"
            : minimal
              ? "min-w-[320px] px-6 py-4"
              : "min-w-[350px] px-7 py-5"
        }`}
        style={themePanel(merged)}
      >
        {!minimal ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              ...themePatternStyle(theme.pattern, tone),
              opacity: spotlight ? 0.2 : 0.45,
            }}
          />
        ) : null}
        {!minimal ? (
          <span
            className="absolute inset-x-0 top-0"
            style={{
              height: spotlight ? 5 : 3,
              backgroundColor: tone,
              boxShadow: `0 0 20px ${toRgba(tone, 0.65)}`,
            }}
          />
        ) : null}
        <div className="relative">
          <div className="flex items-center justify-between gap-8">
            <ThemeLabel
              text={state?.title || "Starting in"}
              accent={tone}
              muted={palette.placeColor}
            />
            <span
              className="text-[7px] font-black uppercase tracking-[0.22em]"
              style={{ color: palette.placeColor }}
            >
              {theme.label}
            </span>
          </div>
          <p
            className={`mt-2 font-black leading-none tabular-nums ${
              spotlight ? "text-[84px]" : minimal ? "text-[54px]" : "text-[68px]"
            }`}
            style={{
              color: urgent ? danger : palette.textPrimary,
              textShadow: `0 0 34px ${toRgba(tone, 0.22)}`,
              ...nameStyle,
            }}
          >
            {formatClock(remaining)}
          </p>
          <div
            className="mt-4 h-[3px] w-full overflow-hidden"
            style={{ backgroundColor: toRgba(palette.textPrimary, 0.09) }}
          >
            <motion.div
              className="h-full"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                backgroundColor: tone,
                boxShadow: `0 0 12px ${toRgba(tone, 0.6)}`,
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.22em]">
            <span style={{ color: palette.placeColor }}>
              Match begins shortly
            </span>
            <span
              className="flex items-center gap-1.5"
              style={{ color: urgent ? danger : palette.accent }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: urgent ? 0.7 : 1.8, repeat: Infinity }}
                className="h-1 w-1"
                style={{
                  backgroundColor: tone,
                  boxShadow: `0 0 8px ${tone}`,
                }}
              />
              {state?.running ? "Counting down" : "Standby"}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function EditorialWinner({
  winner,
  team,
  preview = false,
  previewSettings,
  variant,
}: {
  winner?: WinnerState;
  team?: WinnerTeam | null;
  preview?: boolean;
  previewSettings?: PointsTableSettings;
  variant?: OverlayCardStyle;
}) {
  const { merged, theme, palette, typography } = useOverlayTheme(previewSettings);

  if (!winner?.visible && !preview) return null;

  const elims =
    team?.rounds?.reduce((sum, round) => sum + (round.kills ?? 0), 0) ?? 0;
  const activeVariant = variant ?? merged.cards.winner;
  const minimal = activeVariant === "minimal";
  const spotlight = activeVariant === "spotlight";
  const nameStyle = {
    fontFamily: typography.fontFamily || undefined,
    letterSpacing: `${typography.letterSpacing || 0}px`,
    textTransform: typography.uppercase ? ("uppercase" as const) : undefined,
  };
  const teamLogo = winner?.teamLogoUrl || team?.logo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full overflow-hidden ${
        spotlight ? "px-10 py-8" : minimal ? "px-7 py-6" : "px-8 py-7"
      }`}
      style={{
        ...themePanel(merged),
        ...(spotlight
          ? { boxShadow: `0 0 48px ${toRgba(palette.accent, 0.28)}` }
          : {}),
      }}
    >
      {winner?.backgroundImageUrl ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${winner.backgroundImageUrl}")` }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${toRgba(palette.panelFrom, 0.94)} 0%, ${toRgba(palette.panelFrom, 0.58)} 58%, ${toRgba(palette.panelFrom, 0.28)} 100%)`,
            }}
          />
        </>
      ) : null}
      {!minimal ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            ...themePatternStyle(theme.pattern, palette.accent),
            opacity: spotlight ? 0.24 : 0.45,
          }}
        />
      ) : null}
      {!minimal ? (
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-1/3"
          initial={{ x: "-130%", opacity: 0 }}
          animate={{ x: ["-130%", "300%"], opacity: [0, 0.5, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "linear", repeatDelay: 0.8 }}
          style={{
            background: `linear-gradient(90deg, transparent, ${toRgba(palette.accent, 0.2)}, transparent)`,
          }}
        />
      ) : null}
      {!minimal ? (
        <span
          className="absolute inset-y-0 left-0"
          style={{
            width: spotlight ? 7 : 4,
            backgroundColor: palette.accent,
            boxShadow: `0 0 20px ${toRgba(palette.accent, 0.7)}`,
          }}
        />
      ) : null}
      <span
        className="absolute right-6 top-4 text-[8px] font-black uppercase tracking-[0.34em]"
        style={{ color: toRgba(palette.accent, 0.55) }}
      >
        Victory
      </span>

      <div className="relative flex items-center gap-7">
        <div
          className="relative flex h-[112px] w-[112px] shrink-0 items-center justify-center"
          style={{
            backgroundColor: toRgba(palette.textPrimary, 0.04),
            border: `1px solid ${toRgba(palette.accent, 0.4)}`,
            clipPath: themeCut(12),
            boxShadow: `inset 0 0 30px ${toRgba(palette.accent, 0.08)}`,
          }}
        >
          <span
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ backgroundColor: palette.accent }}
          />
          {teamLogo ? (
            <Image
              src={teamLogo}
              alt={team?.name || "Winner"}
              width={88}
              height={88}
              className="h-[88px] w-[88px] object-contain"
            />
          ) : (
            <span
              className="text-3xl font-black"
              style={{ color: palette.accent }}
            >
              {team?.name?.slice(0, 2).toUpperCase() || "P1"}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <ThemeLabel
            text={winner?.title || "Champions"}
            accent={palette.accent}
            muted={palette.placeColor}
          />
          <h1
            className={`mt-2 max-w-[760px] truncate font-black uppercase leading-[0.9] tracking-[0.01em] ${
              spotlight
                ? "text-[78px]"
                : minimal
                  ? "text-[50px]"
                  : "text-[62px]"
            }`}
            style={{ color: palette.textPrimary, ...nameStyle }}
          >
            {team?.name || "Winner"}
          </h1>
          {winner?.subtitle ? (
            <p
              className="mt-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: palette.placeColor }}
            >
              {winner.subtitle}
            </p>
          ) : null}
          <div className="mt-4 flex items-center gap-4">
            <span
              className="h-px flex-1"
              style={{
                background: `linear-gradient(90deg, ${toRgba(palette.accent, 0.45)}, transparent)`,
              }}
            />
            <span
              className="text-[8px] font-bold uppercase tracking-[0.24em]"
              style={{ color: toRgba(palette.textPrimary, 0.42) }}
            >
              {theme.label}
            </span>
          </div>
        </div>

        {winner?.playerImageUrl || winner?.playerName ? (
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            {winner.playerImageUrl ? (
              <div
                className="relative h-[126px] w-[92px] overflow-hidden"
                style={{
                  backgroundColor: toRgba(palette.textPrimary, 0.05),
                  border: `1px solid ${toRgba(palette.accent, 0.35)}`,
                  clipPath: themeCut(8),
                }}
              >
                <Image
                  src={winner.playerImageUrl}
                  alt={winner.playerName || "MVP player"}
                  width={92}
                  height={126}
                  className="h-full w-full object-cover"
                />
                <span
                  className="absolute inset-x-0 bottom-0 h-[2px]"
                  style={{ backgroundColor: palette.accent }}
                />
              </div>
            ) : null}
            {winner.playerName ? (
              <p
                className="max-w-[100px] truncate text-[8px] font-black uppercase tracking-[0.18em]"
                style={{ color: palette.accent }}
              >
                {winner.playerName}
              </p>
            ) : null}
          </div>
        ) : null}

        <div
          className="flex shrink-0 items-stretch"
          style={{ borderLeft: `1px solid ${toRgba(palette.textPrimary, 0.12)}` }}
        >
          <div className="px-6 text-right">
            <p
              className="text-[8px] font-bold uppercase tracking-[0.22em]"
              style={{ color: palette.placeColor }}
            >
              Points
            </p>
            <p
              className="mt-1 text-[34px] font-black leading-none tabular-nums"
              style={{
                color: palette.accent,
                textShadow: `0 0 22px ${toRgba(palette.accent, 0.3)}`,
              }}
            >
              {team?.totalPoints ?? 0}
            </p>
          </div>
          <div className="px-6 text-right">
            <p
              className="text-[8px] font-bold uppercase tracking-[0.22em]"
              style={{ color: palette.placeColor }}
            >
              Elims
            </p>
            <p
              className="mt-1 text-[34px] font-black leading-none tabular-nums"
              style={{ color: palette.textPrimary }}
            >
              {elims}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
