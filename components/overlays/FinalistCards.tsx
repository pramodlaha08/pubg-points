"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useRoundInfo } from "@/hooks/useRoundInfo";
import SQUAD_CONFIG from "@/lib/squadConfig";
import {
  getTablePreset,
  mergePointsTable,
  type PointsTableSettings,
} from "@/lib/tableSettings";
import { themeCut, themePatternStyle } from "@/lib/themeVisuals";
import { displayName } from "@/lib/overlayTheme";
import { getStandingsTotals } from "@/lib/standings";
import type { Team } from "@/types/team";

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

const panelStyle = (merged: PointsTableSettings) => {
  const { surface, colors } = merged;
  return {
    backgroundColor:
      surface.style === "none"
        ? "rgba(4,7,12,0.58)"
        : toRgba(colors.panelFrom, 0.96),
    backgroundImage:
      surface.style === "gradient"
        ? `linear-gradient(${surface.gradientAngle}deg, ${
            surface.gradientFrom || colors.panelFrom
          }, ${surface.gradientTo || colors.panelTo})`
        : undefined,
    border: `${surface.borderWidth}px solid ${toRgba(colors.accent, 0.34)}`,
    boxShadow: surface.shadow
      ? `0 22px 64px rgba(0,0,0,0.52), inset 0 0 36px ${toRgba(
          colors.accent,
          0.04
        )}`
      : undefined,
    clipPath: themeCut(Math.max(6, Math.min(24, 8 + surface.radius))),
  } satisfies CSSProperties;
};

const totalKills = (team: Team) =>
  team.rounds.reduce((sum, round) => sum + (round.kills ?? 0), 0);

export default function FinalistCards({
  teams,
  roundNumber,
  previewSettings,
}: {
  teams: Team[];
  roundNumber: number;
  previewSettings?: PointsTableSettings;
}) {
  const { settings } = useSettings();
  const { finalRound } = useRoundInfo();
  const merged = mergePointsTable(previewSettings ?? settings?.pointsTable);
  const theme = getTablePreset(merged.preset);
  const palette = merged.colors;
  const typography = merged.typography;
  const surface = merged.surface;

  if (!teams.length) return null;

  const nameStyle = {
    fontFamily: typography.fontFamily || undefined,
    letterSpacing: `${typography.letterSpacing || 0}px`,
    textTransform: typography.uppercase ? ("uppercase" as const) : undefined,
  };

  return (
    <div className="pointer-events-none absolute left-1/2 top-[3.5%] z-20 w-[min(1180px,92vw)] -translate-x-1/2">
      <div className="mb-3 flex items-center justify-center gap-3">
        <span className="h-px w-16" style={{ backgroundColor: palette.accent }} />
        <p
          className="text-[10px] font-black uppercase tracking-[0.4em]"
          style={{ color: palette.accent }}
        >
          {teams.length} teams left
        </p>
        <span className="h-px w-16" style={{ backgroundColor: palette.accent }} />
      </div>
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        {teams.map((team, index) => {
          const round = team.rounds.find(
            (item) => item.roundNumber === roundNumber
          );
          const knocked = round?.eliminatedPlayers?.length ?? 0;
          return (
            <motion.div
              key={team._id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.07,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative w-[210px] overflow-hidden px-4 py-3.5"
              style={panelStyle(merged)}
            >
              {surface.backgroundImage ? (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: `url("${surface.backgroundImage}")`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    filter: `blur(${surface.backgroundImageBlur}px)`,
                    opacity: surface.backgroundImageOpacity,
                  }}
                />
              ) : null}
              {surface.style !== "none" ? (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    ...themePatternStyle(theme.pattern, palette.accent),
                    opacity: 0.3,
                  }}
                />
              ) : null}
              <span
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{
                  backgroundColor: palette.accent,
                  boxShadow: `0 0 18px ${toRgba(palette.accent, 0.6)}`,
                }}
              />
              <div className="relative flex items-center gap-3">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center"
                  style={{
                    backgroundColor: toRgba(palette.textPrimary, 0.06),
                    border: `1px solid ${toRgba(palette.accent, 0.32)}`,
                    clipPath: themeCut(6),
                  }}
                >
                  {team.logo ? (
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={46}
                      height={46}
                      className="h-[46px] w-[46px] object-contain"
                    />
                  ) : (
                    <span
                      className="text-lg font-black"
                      style={{ color: palette.accent }}
                    >
                      {team.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className="truncate text-[17px] font-black uppercase leading-tight"
                    style={{ color: palette.textPrimary, ...nameStyle }}
                  >
                    {displayName(team.name, typography)}
                  </p>
                  <div className="mt-1 flex items-center gap-[3px]">
                    {Array.from({
                      length: SQUAD_CONFIG.fullEliminationCount,
                    }).map((_, player) => (
                      <span
                        key={player}
                        style={{
                          width: 5,
                          height: 10,
                          backgroundColor:
                            player < knocked
                              ? toRgba(palette.textPrimary, 0.16)
                              : palette.aliveBar,
                          boxShadow:
                            player < knocked
                              ? undefined
                              : `0 0 8px ${toRgba(palette.aliveBar, 0.45)}`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative mt-3 grid grid-cols-2 gap-2">
                <div
                  className="px-2 py-1.5"
                  style={{
                    backgroundColor: toRgba(palette.textPrimary, 0.05),
                    border: `1px solid ${toRgba(palette.accent, 0.14)}`,
                  }}
                >
                  <p
                    className="text-[7px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: palette.placeColor }}
                  >
                    Points
                  </p>
                  <p
                    className="text-[20px] font-black leading-none tabular-nums"
                    style={{ color: palette.accent }}
                  >
                    {getStandingsTotals(team, roundNumber, finalRound).totalPoints}
                  </p>
                </div>
                <div
                  className="px-2 py-1.5"
                  style={{
                    backgroundColor: toRgba(palette.textPrimary, 0.05),
                    border: `1px solid ${toRgba(palette.accent, 0.14)}`,
                  }}
                >
                  <p
                    className="text-[7px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: palette.placeColor }}
                  >
                    Elims
                  </p>
                  <p
                    className="text-[20px] font-black leading-none tabular-nums"
                    style={{ color: palette.textPrimary }}
                  >
                    {totalKills(team)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
