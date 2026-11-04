"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLiveTeams } from "@/hooks/useLiveTeams";
import { useSettings } from "@/hooks/useSettings";
import { useRoundInfo } from "@/hooks/useRoundInfo";
import { useActiveRound } from "@/hooks/useActiveRound";
import SQUAD_CONFIG from "@/lib/squadConfig";
import {
  getTablePreset,
  mergePointsTable,
  type PointsTableSettings,
} from "@/lib/tableSettings";
import {
  themeCut,
  themePatternStyle,
  themeRowMotion,
} from "@/lib/themeVisuals";
import { displayName } from "@/lib/overlayTheme";
import {
  compareStandings,
  getStandingsTotals,
} from "@/lib/standings";
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

export default function EditorialPointsTable({
  fitToHeight = true,
  topPercent,
  scalePercent = 100,
  previewSettings,
  previewTeams,
}: {
  fitToHeight?: boolean;
  topPercent?: number;
  scalePercent?: number;
  previewSettings?: PointsTableSettings;
  previewTeams?: Team[];
}) {
  const { allTeams: liveTeams, isLoading: liveLoading } = useLiveTeams();
  const { settings, isLoading: settingsLoading } = useSettings();
  const { mapByRound, finalRound, isLoading: roundInfoLoading } =
    useRoundInfo();
  const { activeRound, isLoading: activeRoundLoading } = useActiveRound();
  const teams = previewTeams ?? liveTeams;
  const isLoading = previewTeams
    ? false
    : liveLoading ||
      settingsLoading ||
      roundInfoLoading ||
      activeRoundLoading;
  const rootRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!fitToHeight) return;
    const measure = () => {
      const element = rootRef.current;
      const top =
        typeof topPercent === "number"
          ? (window.innerHeight * topPercent) / 100
          : element?.getBoundingClientRect().top ?? 0;
      const scale = Math.max(0.4, scalePercent / 100);
      setAvailableHeight(
        Math.max(0, (window.innerHeight - top) / scale - 24)
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fitToHeight, topPercent, scalePercent]);

  const merged = mergePointsTable(previewSettings ?? settings?.pointsTable);
  const theme = getTablePreset(merged.preset);
  const columns = merged.columns;
  const header = merged.header;
  const typography = merged.typography;
  const surface = merged.surface;
  const palette = merged.colors;
  const template = merged.layout.template;
  const frameCut = Math.max(8, Math.min(26, 12 + surface.radius));
  const paper = palette.textPrimary;
  const muted = palette.placeColor;
  const accent = palette.accent;
  const typeScale = Math.min(
    1.2,
    Math.max(0.85, merged.layout.fontScale * typography.fontScale)
  );
  const fs = (base: number) => Math.round(base * typeScale * 10) / 10;

  const roundNumber =
    activeRound || (teams.length ? teams[0].currentRound : 0);
  const mapName = roundNumber ? mapByRound[roundNumber] : "";
  const sorted = [...teams].sort((a, b) =>
    compareStandings(a, b, roundNumber, finalRound)
  );
  const fittedRow =
    fitToHeight && availableHeight
      ? Math.max(
          24,
          Math.min(38, (availableHeight - 176) / Math.max(sorted.length, 1))
        )
      : 38;
  const rowHeight = Math.min(merged.layout.rowHeight, fittedRow);
  const panelWidth = Math.min(
    700,
    Math.max(580, merged.layout.width * 2)
  );
  const panelBackground =
    surface.style === "none"
      ? "linear-gradient(135deg, rgba(5,8,14,0.62), rgba(5,8,14,0.3))"
      : surface.style === "gradient"
        ? `linear-gradient(${surface.gradientAngle}deg, ${surface.gradientFrom || palette.panelFrom}, ${surface.gradientTo || palette.panelTo})`
        : surface.style === "solid"
          ? palette.panelFrom
          : toRgba(palette.panelFrom, surface.opacity);

  const nameStyle = {
    fontFamily: typography.fontFamily || undefined,
    letterSpacing: `${typography.letterSpacing || 0}px`,
    textTransform: typography.uppercase ? ("uppercase" as const) : undefined,
  };

  const backgroundLayer = surface.backgroundImage ? (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url("${surface.backgroundImage}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        filter: `blur(${surface.backgroundImageBlur}px)`,
        opacity: surface.backgroundImageOpacity,
        transform: "scale(1.04)",
      }}
    />
  ) : null;

  const teamRound = (team: Team) =>
    team.rounds.find((item) => item.roundNumber === roundNumber);
  const totalsFor = (team: Team) =>
    getStandingsTotals(team, roundNumber, finalRound);
  const teamOut = (team: Team) =>
    (teamRound(team)?.eliminationCount ?? 0) >=
    SQUAD_CONFIG.fullEliminationCount;

  const alivePips = (team: Team) => {
    const round = teamRound(team);
    const knocked = round?.eliminatedPlayers?.length ?? 0;
    return (
      <span className="flex items-center gap-[3px]">
        {round
          ? Array.from({ length: SQUAD_CONFIG.fullEliminationCount }).map(
              (_, player) => (
                <motion.span
                  key={player}
                  initial={{ scaleY: 0.2, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: player * 0.04, duration: 0.25 }}
                  style={{
                    width: 3,
                    height: 11,
                    backgroundColor:
                      player < knocked
                        ? toRgba(paper, 0.16)
                        : palette.aliveBar,
                    boxShadow:
                      player < knocked
                        ? undefined
                        : `0 0 8px ${toRgba(palette.aliveBar, 0.45)}`,
                  }}
                />
              )
            )
          : "-"}
      </span>
    );
  };

  const title = header.title || "Points Table";
  const wideWidth = Math.max(panelWidth, 660);
const statItems = (team: Team) => {
      const items: { label: string; value: ReactNode }[] = [];
      if (columns.alive) items.push({ label: "Alive", value: alivePips(team) });
      if (columns.place) {
        items.push({
          label: "Place",
          value: totalsFor(team).placementPoints,
        });
      }
      if (columns.elims) {
        items.push({ label: "Elims", value: totalsFor(team).eliminationPoints });
      }
      if (columns.pts) {
        items.push({ label: "Pts", value: totalsFor(team).totalPoints });
      }
      return items;
    };

  const statLabels = [
    columns.alive ? "Alive" : null,
    columns.place ? "Place" : null,
    columns.elims ? "Elims" : null,
    columns.pts ? "Pts" : null,
  ].filter((label): label is string => Boolean(label));

  const rankBadge = (index: number, size = "md") => {
    const isTop = index < 3;
    const isLeader = index === 0;
    return (
      <span
        className={`flex shrink-0 items-center justify-center font-black tabular-nums ${
          size === "lg" ? "h-10 w-11 text-[16px]" : "h-8 w-9 text-[11px]"
        }`}
        style={{
          color: isTop ? palette.panelFrom : muted,
          backgroundColor: isTop ? accent : toRgba(paper, 0.055),
          clipPath: themeCut(size === "lg" ? 6 : 4),
          boxShadow: isLeader
            ? `0 0 20px ${toRgba(accent, 0.35)}`
            : undefined,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    );
  };

  const teamLogo = (team: Team, size = 28) =>
    columns.logo ? (
      <span
        className="flex shrink-0 items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: toRgba(paper, 0.045),
          border: `1px solid ${toRgba(accent, 0.28)}`,
          clipPath: themeCut(4),
        }}
      >
        <Image
          src={team.logo || "/placeholder.svg"}
          alt={team.name}
          width={size - 4}
          height={size - 4}
          className="object-contain"
          style={{ width: size - 4, height: size - 4 }}
        />
      </span>
    ) : null;

  const teamName = (team: Team, eliminated: boolean, size = 13) => (
    <span
      className="flex min-w-0 items-center gap-2 truncate font-bold"
      style={{
        color: eliminated ? muted : paper,
        fontSize: fs(size),
        ...nameStyle,
      }}
    >
      <span className="truncate">{displayName(team.name, typography)}</span>
      {teamOut(team) ? (
        <span
          className="shrink-0 px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.18em]"
          style={{ color: muted, border: `1px solid ${toRgba(paper, 0.16)}` }}
        >
          Out
        </span>
      ) : null}
    </span>
  );

  const customFooter = (label = theme.label) => (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
      className="mt-2 flex items-center justify-between px-1 text-[8px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: muted }}
    >
      <span className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5"
          style={{
            backgroundColor: accent,
            boxShadow: `0 0 10px ${toRgba(accent, 0.65)}`,
          }}
        />
        Live feed
      </span>
      <span style={{ color: toRgba(paper, 0.52) }}>
        {label} / Official standings
      </span>
    </motion.footer>
  );

  const compactHeader = (kicker = "Live standings") => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-end justify-between gap-4 px-1 pb-3"
    >
      <div className="min-w-0">
        <p
          className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.34em]"
          style={{ color: accent }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.7, repeat: Infinity }}
            className="h-1.5 w-1.5"
            style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
          />
          {kicker}
        </p>
        <h1
          className="mt-1 truncate text-[30px] font-black leading-none"
          style={{ color: paper, ...nameStyle }}
        >
          {title}
        </h1>
        {header.subtitle ? (
          <p
            className="mt-1 truncate text-[10px] uppercase tracking-[0.22em]"
            style={{ color: muted }}
          >
            {header.subtitle}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-right">
        <div>
          <p
            className="text-[8px] font-bold uppercase tracking-[0.28em]"
            style={{ color: muted }}
          >
            Round
          </p>
          <p
            className="text-[24px] font-black leading-none tabular-nums"
            style={{ color: accent }}
          >
            {roundNumber ? String(roundNumber).padStart(2, "0") : "--"}
          </p>
        </div>
        <div
          className="min-w-[92px] px-3 py-1.5"
          style={{
            backgroundColor: toRgba(accent, 0.1),
            border: `1px solid ${toRgba(accent, 0.35)}`,
            clipPath: themeCut(6),
          }}
        >
          <p
            className="text-[7px] font-bold uppercase tracking-[0.26em]"
            style={{ color: muted }}
          >
            Map
          </p>
          <p
            className="truncate text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{ color: paper }}
          >
            {mapName || "All maps"}
          </p>
        </div>
      </div>
    </motion.div>
  );

  const renderEditorialBoard = () => (
    <div
      ref={rootRef}
      data-editorial-table="true"
      style={{
        width: panelWidth,
        fontFamily: typography.fontFamily || undefined,
      }}
      className="select-none"
    >
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="flex items-end justify-between gap-5 border-b pb-3"
          style={{ borderColor: toRgba(accent, 0.42) }}
        >
          <div className="min-w-0">
            <p
              className="text-[9px] font-bold uppercase tracking-[0.38em]"
              style={{ color: accent }}
            >
              {roundNumber ? `Round ${String(roundNumber).padStart(2, "0")}` : "Live table"}
              {mapName ? ` / ${mapName}` : ""}
            </p>
            <h1
              className="mt-2 max-w-[560px] truncate text-[44px] font-black leading-[0.92] tracking-[-0.03em]"
              style={{ color: paper, ...nameStyle }}
            >
              {title}
            </h1>
            {header.subtitle ? (
              <p
                className="mt-2 text-[11px] uppercase tracking-[0.24em]"
                style={{ color: muted }}
              >
                {header.subtitle}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p
              className="text-[8px] font-bold uppercase tracking-[0.3em]"
              style={{ color: muted }}
            >
              Teams
            </p>
            <p
              className="text-[40px] font-black leading-none tabular-nums"
              style={{ color: accent }}
            >
              {String(sorted.length).padStart(2, "0")}
            </p>
          </div>
        </div>
        <div
          className="mt-3 flex items-center px-1 pb-1 text-[8px] font-bold uppercase"
          style={{ color: muted, letterSpacing: "0.24em" }}
        >
          <span className="w-11">Rank</span>
          <span className="flex-1 pl-2">Team</span>
          {statLabels.map((label) => (
            <span key={label} className="w-12 text-center">
              {label}
            </span>
          ))}
        </div>
        <div>
          {sorted.map((team, index) => {
            const eliminated = teamOut(team);
            return (
              <motion.div
                key={team._id}
                initial={themeRowMotion(theme.motion)}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(index * 0.035, 0.5),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center gap-2 border-b px-1 py-2"
                style={{
                  borderColor: toRgba(paper, index === sorted.length - 1 ? 0 : 0.11),
                  background:
                    index === 0
                      ? `linear-gradient(90deg, ${toRgba(accent, 0.14)}, transparent 70%)`
                      : index < 3
                        ? toRgba(accent, 0.045)
                        : "transparent",
                  opacity: eliminated ? 0.45 : 1,
                }}
              >
                <span className="w-11">
                  <span
                    className="text-[22px] font-black leading-none tabular-nums"
                    style={{ color: index < 3 ? accent : muted }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2 pl-2">
                  {teamLogo(team, 30)}
                  {teamName(team, eliminated, 15)}
                </span>
                {statItems(team).map((item) => (
                  <span
                    key={item.label}
                    className="w-12 text-center text-[13px] font-bold tabular-nums"
                    style={{
                      color:
                        item.label === "Pts"
                          ? index < 3
                            ? palette.totalColor
                            : paper
                          : item.label === "Elims"
                            ? palette.elimColor
                            : muted,
                    }}
                  >
                    {item.value}
                  </span>
                ))}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      {customFooter()}
    </div>
  );

  const renderEditorialMinimal = () => (
    <div
      ref={rootRef}
      data-editorial-table="true"
      style={{
        width: panelWidth,
        fontFamily: typography.fontFamily || undefined,
      }}
      className="select-none"
    >
      <div className="flex items-end justify-between gap-4 px-1 pb-2">
        <div className="min-w-0">
          <h1
            className="truncate text-[32px] font-light leading-none tracking-[0.02em]"
            style={{ color: paper, ...nameStyle }}
          >
            {title}
          </h1>
          <p
            className="mt-1 text-[9px] font-bold uppercase tracking-[0.34em]"
            style={{ color: accent }}
          >
            {header.subtitle || "Official standings"}
          </p>
        </div>
        <p
          className="shrink-0 text-[10px] font-bold uppercase tracking-[0.24em]"
          style={{ color: muted }}
        >
          {roundNumber ? `R${String(roundNumber).padStart(2, "0")}` : "LIVE"}
          {mapName ? ` / ${mapName}` : ""}
        </p>
      </div>
      <div
        className="flex items-center border-y px-1 py-1.5 text-[7px] font-bold uppercase tracking-[0.28em]"
        style={{
          borderColor: toRgba(paper, 0.14),
          color: muted,
        }}
      >
        <span className="w-8">#</span>
        <span className="flex-1">Team</span>
        {statLabels.map((label) => (
          <span key={label} className="w-12 text-center">
            {label}
          </span>
        ))}
      </div>
      <div>
        {sorted.map((team, index) => {
          const eliminated = teamOut(team);
          return (
            <motion.div
              key={team._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.45) }}
              className="flex items-center border-b px-1 py-2"
              style={{
                borderColor: toRgba(paper, 0.09),
                opacity: eliminated ? 0.42 : 1,
              }}
            >
              <span
                className="w-8 text-[12px] font-black tabular-nums"
                style={{ color: index < 3 ? accent : muted }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {teamLogo(team, 22)}
                {teamName(team, eliminated, 14)}
              </span>
              {statItems(team).map((item) => (
                <span
                  key={item.label}
                  className="w-12 text-center text-[12px] font-semibold tabular-nums"
                  style={{
                    color:
                      item.label === "Pts"
                        ? index < 3
                          ? accent
                          : paper
                        : muted,
                  }}
                >
                  {item.value}
                </span>
              ))}
            </motion.div>
          );
        })}
      </div>
      {customFooter("Minimal")}
    </div>
  );

  const renderLedger = () => (
    <div
      ref={rootRef}
      data-editorial-table="true"
      style={{
        width: wideWidth,
        maxWidth: "100%",
        fontFamily: typography.fontFamily || undefined,
      }}
      className="select-none"
    >
      {compactHeader("Standings ledger")}
      <div
        className="overflow-hidden border-y"
        style={{
          borderColor: toRgba(accent, 0.36),
          backgroundColor: toRgba(palette.panelFrom, 0.82),
        }}
      >
        <div
          className="flex items-center px-4 py-2 text-[8px] font-bold uppercase tracking-[0.28em]"
          style={{
            color: muted,
            background: `linear-gradient(90deg, ${toRgba(accent, 0.22)}, transparent)`,
          }}
        >
          <span className="w-12">Pos</span>
          <span className="flex-1">Team</span>
          {statLabels.map((label) => (
            <span key={label} className="w-14 text-center">
              {label}
            </span>
          ))}
        </div>
        {sorted.map((team, index) => {
          const eliminated = teamOut(team);
          return (
            <motion.div
              key={team._id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.4) }}
              className="flex items-center px-4"
              style={{
                height: Math.max(34, rowHeight + 2),
                backgroundColor:
                  index === 0
                    ? toRgba(accent, 0.2)
                    : index % 2 === 0
                      ? toRgba(paper, 0.025)
                      : "transparent",
                borderTop: `1px solid ${toRgba(paper, 0.055)}`,
                opacity: eliminated ? 0.45 : 1,
              }}
            >
              <span
                className="w-12 text-[18px] font-black tabular-nums"
                style={{ color: index < 3 ? accent : muted }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {teamLogo(team, 26)}
                {teamName(team, eliminated, 14)}
              </span>
              {statItems(team).map((item) => (
                <span
                  key={item.label}
                  className="w-14 text-center text-[13px] font-bold tabular-nums"
                  style={{
                    color:
                      item.label === "Pts"
                        ? index < 3
                          ? accent
                          : paper
                        : muted,
                  }}
                >
                  {item.value}
                </span>
              ))}
            </motion.div>
          );
        })}
      </div>
      {customFooter("Ledger")}
    </div>
  );

  const renderStrip = () => (
    <div
      ref={rootRef}
      data-editorial-table="true"
      style={{
        width: Math.min(panelWidth, 620),
        fontFamily: typography.fontFamily || undefined,
      }}
      className="select-none"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p
          className="text-[11px] font-black uppercase tracking-[0.28em]"
          style={{ color: paper, ...nameStyle }}
        >
          {title}
        </p>
        <p
          className="text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: accent }}
        >
          {roundNumber ? `Round ${String(roundNumber).padStart(2, "0")}` : "Live"}
          {mapName ? ` / ${mapName}` : ""}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {sorted.map((team, index) => {
          const eliminated = teamOut(team);
          const isTop = index < 3;
          return (
            <motion.div
              key={team._id}
              initial={themeRowMotion(theme.motion)}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.025, 0.35) }}
              className="relative flex items-center gap-3 overflow-hidden px-3"
              style={{
                height: Math.max(30, rowHeight - 4),
                background: isTop
                  ? `linear-gradient(90deg, ${toRgba(accent, 0.2)}, ${toRgba(palette.panelFrom, 0.92)})`
                  : toRgba(palette.panelFrom, 0.72),
                border: `1px solid ${toRgba(accent, isTop ? 0.34 : 0.14)}`,
                clipPath: themeCut(6),
                opacity: eliminated ? 0.45 : 1,
              }}
            >
              <span
                className="text-[13px] font-black tabular-nums"
                style={{ color: isTop ? accent : muted }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {teamLogo(team, 22)}
                {teamName(team, eliminated, 12)}
              </span>
              {columns.alive ? <span>{alivePips(team)}</span> : null}
              {columns.place ? (
                <span
                  className="min-w-8 text-center text-[11px] font-semibold tabular-nums"
                  style={{ color: muted }}
                >
                  {totalsFor(team).placementPoints}
                </span>
              ) : null}
              {columns.elims ? (
                <span
                  className="min-w-8 text-center text-[11px] font-bold tabular-nums"
                  style={{ color: palette.elimColor }}
                >
                  {totalsFor(team).eliminationPoints}
                </span>
              ) : null}
              {columns.pts ? (
                <span
                  className="min-w-12 text-right text-[18px] font-black tabular-nums"
                  style={{
                    color: isTop ? accent : paper,
                    textShadow: isTop
                      ? `0 0 16px ${toRgba(accent, 0.4)}`
                      : undefined,
                  }}
                >
                  {totalsFor(team).totalPoints}
                </span>
              ) : null}
            </motion.div>
          );
        })}
      </div>
      {customFooter("Strip")}
    </div>
  );

  const renderCardGrid = (columnsCount: 2 | 3, scoreboard = false) => {
    const width =
      columnsCount === 3 ? Math.max(wideWidth, 760) : Math.max(wideWidth, 680);
    return (
      <div
        ref={rootRef}
        data-editorial-table="true"
        style={{
          width,
          maxWidth: "100%",
          fontFamily: typography.fontFamily || undefined,
        }}
        className="select-none"
      >
        {compactHeader(scoreboard ? "Scoreboard" : "Team cards")}
        <div
          className={`grid gap-2 ${
            columnsCount === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          {sorted.map((team, index) => {
            const eliminated = teamOut(team);
            const isTop = index < 3;
            return (
              <motion.div
                key={team._id}
                initial={themeRowMotion(theme.motion)}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 0.42,
                  delay: Math.min(index * 0.03, 0.4),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative overflow-hidden p-3"
                style={{
                  minHeight: scoreboard ? 112 : 98,
                  background: `linear-gradient(145deg, ${toRgba(palette.panelFrom, 0.96)}, ${toRgba(palette.panelTo, 0.72)})`,
                  border: `1px solid ${toRgba(accent, isTop ? 0.48 : 0.2)}`,
                  clipPath: themeCut(frameCut),
                  boxShadow: isTop
                    ? `inset 0 0 30px ${toRgba(accent, 0.1)}, 0 10px 30px rgba(0,0,0,0.3)`
                    : undefined,
                  opacity: eliminated ? 0.45 : 1,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={themePatternStyle(theme.pattern, accent)}
                />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {rankBadge(index, columnsCount === 3 ? "md" : "lg")}
                    {teamLogo(team, columnsCount === 3 ? 24 : 30)}
                    <div className="min-w-0">{teamName(team, eliminated, columnsCount === 3 ? 11 : 14)}</div>
                  </div>
                  {columns.pts ? (
                    <div className="shrink-0 text-right">
                      <p
                        className={`font-black leading-none tabular-nums ${
                          scoreboard ? "text-[30px]" : "text-[24px]"
                        }`}
                        style={{
                          color: isTop ? accent : paper,
                          textShadow: isTop
                            ? `0 0 18px ${toRgba(accent, 0.38)}`
                            : undefined,
                        }}
                      >
                        {totalsFor(team).totalPoints}
                      </p>
                      <p
                        className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: muted }}
                      >
                        Points
                      </p>
                    </div>
                  ) : null}
                </div>
                <div
                  className="relative mt-3 grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(
                      statItems(team).length,
                      1
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {statItems(team).map((item) => (
                    <div
                      key={item.label}
                      className="border-t pt-1 text-center"
                      style={{ borderColor: toRgba(accent, 0.18) }}
                    >
                      <p
                        className="text-[7px] font-bold uppercase tracking-[0.16em]"
                        style={{ color: muted }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="mt-0.5 text-[12px] font-bold tabular-nums"
                        style={{ color: paper }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
        {customFooter(scoreboard ? "Scoreboard" : "Cards")}
      </div>
    );
  };

  const renderPodium = (spotlight = false) => {
    const hero = spotlight ? sorted.slice(0, 1) : sorted.slice(0, 3);
    const cards = spotlight ? sorted.slice(1, 3) : hero;
    const rest = sorted.slice(3);
    const podiumCard = (team: Team, index: number, featured = false) => {
      const eliminated = teamOut(team);
      return (
        <motion.div
          key={team._id}
          initial={themeRowMotion(theme.motion)}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.45, delay: index * 0.06 }}
          className="relative overflow-hidden p-4"
          style={{
            minHeight: featured ? 164 : 126,
            background: `linear-gradient(150deg, ${toRgba(accent, featured ? 0.24 : 0.16)}, ${toRgba(palette.panelFrom, 0.96)} 62%)`,
            border: `1px solid ${toRgba(accent, featured ? 0.58 : 0.3)}`,
            clipPath: themeCut(frameCut),
            opacity: eliminated ? 0.5 : 1,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={themePatternStyle(theme.pattern, accent)}
          />
          <div className="relative flex items-start justify-between">
            {rankBadge(index, "lg")}
            {teamLogo(team, featured ? 42 : 32)}
          </div>
          <div className="relative mt-3 min-w-0">
            <p
              className={`truncate font-black leading-none ${
                featured ? "text-[26px]" : "text-[18px]"
              }`}
              style={{ color: paper, ...nameStyle }}
            >
              {displayName(team.name, typography)}
            </p>
            <p
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.22em]"
              style={{ color: eliminated ? muted : accent }}
            >
              {eliminated ? "Eliminated" : index === 0 ? "Leader" : "Top three"}
            </p>
          </div>
          <div className="relative mt-3 flex items-end justify-between">
            <div className="flex gap-3">
              {statItems(team)
                .filter((item) => item.label !== "Pts")
                .map((item) => (
                  <div key={item.label}>
                    <p
                      className="text-[7px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: muted }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-[12px] font-bold tabular-nums"
                      style={{ color: paper }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
            </div>
            {columns.pts ? (
              <p
                className={`font-black leading-none tabular-nums ${
                  featured ? "text-[38px]" : "text-[28px]"
                }`}
                style={{ color: accent }}
              >
                {totalsFor(team).totalPoints}
              </p>
            ) : null}
          </div>
        </motion.div>
      );
    };
    return (
      <div
        ref={rootRef}
        data-editorial-table="true"
        style={{
          width: wideWidth,
          maxWidth: "100%",
          fontFamily: typography.fontFamily || undefined,
        }}
        className="select-none"
      >
        {compactHeader(spotlight ? "Leader spotlight" : "Top three")}
        <div className={spotlight ? "" : "grid grid-cols-3 gap-2"}>
          {spotlight
            ? hero.map((team, index) => podiumCard(team, index, true))
            : cards.map((team, index) => podiumCard(team, index, false))}
        </div>
        {spotlight && cards.length ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {cards.map((team, index) => podiumCard(team, index + 1, false))}
          </div>
        ) : null}
        {rest.length ? (
          <div className="mt-3 flex flex-col gap-1">
            {rest.map((team, index) => {
              const rank = (spotlight ? 1 : 3) + index;
              const eliminated = teamOut(team);
              return (
                <motion.div
                  key={team._id}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.35) }}
                  className="flex items-center gap-2 px-2 py-1.5"
                  style={{
                    backgroundColor: toRgba(paper, 0.025),
                    borderLeft: `2px solid ${toRgba(accent, 0.34)}`,
                    opacity: eliminated ? 0.45 : 1,
                  }}
                >
                  <span
                    className="w-8 text-[11px] font-black tabular-nums"
                    style={{ color: muted }}
                  >
                    {String(rank + 1).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {teamLogo(team, 20)}
                    {teamName(team, eliminated, 11)}
                  </span>
                  {statItems(team).map((item) => (
                    <span
                      key={item.label}
                      className="w-10 text-center text-[10px] font-bold tabular-nums"
                      style={{ color: item.label === "Pts" ? accent : muted }}
                    >
                      {item.value}
                    </span>
                  ))}
                </motion.div>
              );
            })}
          </div>
        ) : null}
        {customFooter(spotlight ? "Spotlight" : "Podium")}
      </div>
    );
  };

  const renderSplit = () => {
    const half = Math.ceil(sorted.length / 2);
    const lanes = [sorted.slice(0, half), sorted.slice(half)];
    return (
      <div
        ref={rootRef}
        data-editorial-table="true"
        style={{
          width: wideWidth,
          maxWidth: "100%",
          fontFamily: typography.fontFamily || undefined,
        }}
        className="select-none"
      >
        {compactHeader("Split standings")}
        <div className="grid grid-cols-2 gap-3">
          {lanes.map((lane, laneIndex) => (
            <div
              key={laneIndex}
              className="overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${toRgba(palette.panelFrom, 0.94)}, ${toRgba(palette.panelTo, 0.6)})`,
                border: `1px solid ${toRgba(accent, 0.24)}`,
                clipPath: themeCut(frameCut),
              }}
            >
              {lane.map((team, index) => {
                const rank = (laneIndex === 0 ? 0 : half) + index;
                const eliminated = teamOut(team);
                const isTop = rank < 3;
                return (
                  <motion.div
                    key={team._id}
                    initial={themeRowMotion(theme.motion)}
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.35) }}
                    className="flex items-center gap-2 border-b px-2 py-2 last:border-b-0"
                    style={{
                      borderColor: toRgba(accent, 0.13),
                      backgroundColor: isTop ? toRgba(accent, 0.08) : "transparent",
                      opacity: eliminated ? 0.45 : 1,
                    }}
                  >
                    <span
                      className="w-7 text-[11px] font-black tabular-nums"
                      style={{ color: isTop ? accent : muted }}
                    >
                      {String(rank + 1).padStart(2, "0")}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      {teamLogo(team, 22)}
                      {teamName(team, eliminated, 11)}
                    </span>
                    {columns.pts ? (
                      <span
                        className="text-[15px] font-black tabular-nums"
                        style={{ color: isTop ? accent : paper }}
                      >
                        {totalsFor(team).totalPoints}
                      </span>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
        {customFooter("Split")}
      </div>
    );
  };

  const renderTicker = () => (
    <div
      ref={rootRef}
      data-editorial-table="true"
      style={{
        width: wideWidth,
        maxWidth: "100%",
        fontFamily: typography.fontFamily || undefined,
      }}
      className="select-none"
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          background: `linear-gradient(90deg, ${toRgba(accent, 0.3)}, ${toRgba(palette.panelFrom, 0.9)})`,
          borderLeft: `4px solid ${accent}`,
          clipPath: themeCut(8),
        }}
      >
        <p
          className="text-[12px] font-black uppercase tracking-[0.26em]"
          style={{ color: paper, ...nameStyle }}
        >
          {title}
        </p>
        <p
          className="text-[9px] font-bold uppercase tracking-[0.24em]"
          style={{ color: accent }}
        >
          {roundNumber ? `Round ${String(roundNumber).padStart(2, "0")}` : "Live"}
          {mapName ? ` / ${mapName}` : ""}
        </p>
      </div>
      <div
        className="mt-2 overflow-hidden"
        style={{ borderTop: `1px solid ${toRgba(accent, 0.24)}` }}
      >
        {sorted.map((team, index) => {
          const eliminated = teamOut(team);
          const isTop = index < 3;
          return (
            <motion.div
              key={team._id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.36, delay: Math.min(index * 0.025, 0.3) }}
              className="flex items-center gap-3 border-b px-3 py-1.5"
              style={{
                borderColor: toRgba(paper, 0.075),
                background: isTop
                  ? `linear-gradient(90deg, ${toRgba(accent, 0.14)}, transparent 60%)`
                  : "transparent",
                opacity: eliminated ? 0.42 : 1,
              }}
            >
              <span
                className="w-8 text-[12px] font-black tabular-nums"
                style={{ color: isTop ? accent : muted }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {teamLogo(team, 20)}
                {teamName(team, eliminated, 11)}
              </span>
              {columns.alive ? <span>{alivePips(team)}</span> : null}
              {columns.place ? (
                <span
                  className="w-10 text-center text-[10px] font-semibold tabular-nums"
                  style={{ color: muted }}
                >
                  {totalsFor(team).placementPoints}
                </span>
              ) : null}
              {columns.elims ? (
                <span
                  className="w-10 text-center text-[10px] font-bold tabular-nums"
                  style={{ color: palette.elimColor }}
                >
                  {totalsFor(team).eliminationPoints}
                </span>
              ) : null}
              {columns.pts ? (
                <span
                  className="min-w-12 text-right text-[19px] font-black tabular-nums"
                  style={{ color: isTop ? accent : paper }}
                >
                  {totalsFor(team).totalPoints}
                </span>
              ) : null}
            </motion.div>
          );
        })}
      </div>
      {customFooter("Ticker")}
    </div>
  );

  if (isLoading) return null;

  if (template === "editorial") return renderEditorialBoard();
  if (template === "editorial-minimal") return renderEditorialMinimal();
  if (template === "ledger") return renderLedger();
  if (template === "strip") return renderStrip();
  if (template === "editorial-cards") return renderCardGrid(2);
  if (template === "matrix") return renderCardGrid(3);
  if (template === "scoreboard") return renderCardGrid(2, true);
  if (template === "editorial-podium") return renderPodium(false);
  if (template === "spotlight") return renderPodium(true);
  if (template === "split") return renderSplit();
  if (template === "ticker") return renderTicker();

  return (
    <div
      ref={rootRef}
      data-editorial-table="true"
      style={{ width: panelWidth, fontFamily: typography.fontFamily || undefined }}
      className="select-none"
    >
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-end justify-between gap-5 overflow-hidden px-4 pb-3 pt-2"
        style={{
          background: `linear-gradient(100deg, ${toRgba(palette.headerFrom, 0.96)}, ${toRgba(palette.headerTo, 0.72)} 72%, transparent)`,
          borderLeft: `3px solid ${accent}`,
          clipPath: themeCut(frameCut),
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={themePatternStyle(theme.pattern, accent)}
        />
        <div className="relative flex min-w-0 items-center gap-3">
          {header.logoUrl ? (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center"
              style={{
                backgroundColor: toRgba(paper, 0.05),
                border: `1px solid ${toRgba(accent, 0.35)}`,
                clipPath: themeCut(6),
              }}
            >
              <Image
                src={header.logoUrl}
                alt=""
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
              />
            </span>
          ) : (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center text-[11px] font-black"
              style={{
                color: accent,
                backgroundColor: toRgba(accent, 0.1),
                border: `1px solid ${toRgba(accent, 0.35)}`,
                clipPath: themeCut(6),
              }}
            >
              LIVE
            </span>
          )}
          <div className="min-w-0">
            <p
              className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.34em]"
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
              Live standings
            </p>
            <h1
              className="mt-1 max-w-[460px] truncate text-[28px] font-black leading-none tracking-[0.04em]"
              style={{ color: paper, ...nameStyle }}
            >
              {header.title || "Points Table"}
            </h1>
            {header.subtitle ? (
              <p
                className="mt-1 text-[10px] uppercase tracking-[0.22em]"
                style={{ color: muted }}
              >
                {header.subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative flex shrink-0 items-stretch gap-3">
          <div className="text-right">
            <p
              className="text-[8px] font-bold uppercase tracking-[0.28em]"
              style={{ color: muted }}
            >
              {roundNumber ? "Round" : "Stage"}
            </p>
            <p
              className="mt-0.5 text-[24px] font-black leading-none tabular-nums"
              style={{ color: paper }}
            >
              {roundNumber ? String(roundNumber).padStart(2, "0") : "--"}
            </p>
          </div>
          <div
            className="flex min-w-[92px] flex-col justify-center px-3 py-1.5"
            style={{
              backgroundColor: toRgba(accent, 0.1),
              border: `1px solid ${toRgba(accent, 0.35)}`,
              clipPath: themeCut(7),
            }}
          >
            <p
              className="text-[7px] font-bold uppercase tracking-[0.26em]"
              style={{ color: muted }}
            >
              Map
            </p>
            <p
              className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: accent }}
            >
              {mapName || "All maps"}
            </p>
          </div>
        </div>
      </motion.header>

      <div
        className="relative mt-3 overflow-hidden"
        style={{
          background: panelBackground,
          border: `${surface.borderWidth}px solid ${toRgba(accent, 0.3)}`,
          boxShadow: surface.shadow
            ? `0 28px 80px rgba(0,0,0,0.55), inset 0 0 40px ${toRgba(accent, 0.035)}`
            : undefined,
          clipPath: themeCut(frameCut),
        }}
      >
        {backgroundLayer}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={themePatternStyle(theme.pattern, accent)}
        />
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-1/3"
          initial={{ x: "-120%", opacity: 0 }}
          animate={{ x: ["-120%", "260%"], opacity: [0, 0.45, 0] }}
          transition={{
            duration: theme.motion === "pulse" ? 2.8 : 4.2,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 1.2,
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${toRgba(accent, 0.14)}, transparent)`,
          }}
        />

        <div
          className="relative flex items-center border-b px-3 text-[8px] font-bold uppercase"
          style={{
            height: 30,
            color: muted,
            letterSpacing: "0.22em",
            borderColor: toRgba(accent, 0.22),
            backgroundColor: toRgba(paper, 0.035),
          }}
        >
          <span className="w-10 text-center">#</span>
          <span className="flex-1 pl-2">Team</span>
          {columns.alive ? <span className="w-14 text-center">Alive</span> : null}
          {columns.place ? (
            <span className="w-12 text-center">Place</span>
          ) : null}
          {columns.elims ? (
            <span className="w-12 text-center">Elims</span>
          ) : null}
          {columns.pts ? <span className="w-12 text-right">Pts</span> : null}
        </div>

        {!sorted.length ? (
          <div
            className="flex h-28 items-center justify-center text-[10px] uppercase tracking-[0.28em]"
            style={{ color: muted }}
          >
            No teams registered
          </div>
        ) : null}

        {sorted.map((team, index) => {
          const eliminated = teamOut(team);
          const isTop = index < 3;
          const isLeader = index === 0;
          return (
            <motion.div
              key={team._id}
              initial={themeRowMotion(theme.motion)}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{
                duration: 0.46,
                delay: Math.min(index * 0.035, 0.52),
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex items-center px-3"
              style={{
                height: rowHeight,
                borderBottom:
                  index === sorted.length - 1
                    ? "none"
                    : `1px solid ${toRgba(accent, 0.13)}`,
                background: isLeader
                  ? `linear-gradient(90deg, ${toRgba(accent, 0.17)}, ${toRgba(accent, 0.035)} 45%, transparent)`
                  : isTop
                    ? `linear-gradient(90deg, ${toRgba(accent, 0.075)}, transparent 55%)`
                    : index % 2 === 0
                      ? "transparent"
                      : toRgba(paper, 0.018),
                opacity: eliminated ? 0.44 : 1,
              }}
            >
              <span
                className="absolute inset-y-0 left-0"
                style={{
                  width: isLeader ? 4 : isTop ? 2 : 1,
                  backgroundColor:
                    isTop && !eliminated ? accent : toRgba(accent, 0.18),
                  boxShadow:
                    isLeader && !eliminated
                      ? `0 0 16px ${toRgba(accent, 0.6)}`
                      : undefined,
                }}
              />
              <span
                className="flex h-7 w-8 shrink-0 items-center justify-center text-[11px] font-black tabular-nums"
                style={{
                  color: isTop ? palette.panelFrom : muted,
                  backgroundColor: isTop
                    ? accent
                    : toRgba(paper, 0.055),
                  clipPath: themeCut(4),
                  boxShadow: isTop
                    ? `0 0 16px ${toRgba(accent, 0.28)}`
                    : undefined,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="flex min-w-0 flex-1 items-center gap-2 pl-2">
                {columns.logo ? (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center"
                    style={{
                      backgroundColor: toRgba(paper, 0.045),
                      border: `1px solid ${isTop ? toRgba(accent, 0.45) : toRgba(paper, 0.08)}`,
                      clipPath: themeCut(4),
                    }}
                  >
                    <Image
                      src={team.logo || "/placeholder.svg"}
                      alt={team.name}
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain"
                    />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <span
                    className="flex items-center gap-2 truncate font-bold"
                    style={{
                      color: eliminated ? muted : paper,
                      fontSize: fs(13),
                      ...nameStyle,
                    }}
                  >
                    {displayName(team.name, typography)}
                    {isLeader && !eliminated ? (
                      <span
                        className="px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.18em]"
                        style={{
                          color: palette.panelFrom,
                          backgroundColor: accent,
                          clipPath: themeCut(3),
                        }}
                      >
                        Lead
                      </span>
                    ) : null}
                    {eliminated ? (
                      <span
                        className="px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.18em]"
                        style={{
                          color: muted,
                          border: `1px solid ${toRgba(paper, 0.16)}`,
                        }}
                      >
                        Out
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>

              {columns.alive ? (
                <span className="flex w-14 items-center justify-center">
                  {alivePips(team)}
                </span>
              ) : null}

              {columns.place ? (
                <span
                  className="w-12 text-center text-[12px] font-semibold tabular-nums"
                  style={{
                    color: totalsFor(team).placementPoints
                      ? palette.placeColor
                      : muted,
                  }}
                >
                  {totalsFor(team).placementPoints}
                </span>
              ) : null}

              {columns.elims ? (
                <span
                  className="w-12 text-center text-[12px] font-bold tabular-nums"
                  style={{ color: eliminated ? muted : palette.elimColor }}
                >
                  {totalsFor(team).eliminationPoints}
                </span>
              ) : null}

              {columns.pts ? (
                <span
                  className="w-12 text-right text-[17px] font-black tabular-nums"
                  style={{
                    color: isTop ? palette.totalColor : paper,
                    textShadow: isTop ? `0 0 18px ${toRgba(accent, 0.3)}` : undefined,
                  }}
                >
                  {totalsFor(team).totalPoints}
                </span>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-2 flex items-center justify-between px-1 text-[8px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: muted }}
      >
        <span className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5"
            style={{
              backgroundColor: accent,
              boxShadow: `0 0 10px ${toRgba(accent, 0.65)}`,
            }}
          />
          Live feed
        </span>
        <span style={{ color: toRgba(paper, 0.52) }}>
          {theme.label} / Official standings
        </span>
      </motion.footer>
    </div>
  );
}

