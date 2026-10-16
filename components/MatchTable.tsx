"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Camera } from "lucide-react";
import html2canvas from "html2canvas";
import { api } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { useRoundInfo } from "@/hooks/useRoundInfo";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  DEFAULT_POINTS_TABLE,
  hexToRgba,
  mergePointsTable,
  type PointsTableSettings,
} from "@/lib/tableSettings";
import {
  displayName,
  panelSurfaceStyle,
  typographyStyle,
} from "@/lib/overlayTheme";
import { GAMING_FX_CSS, Shine, fxPan } from "@/components/GamingFx";
import { SurfaceBackground, Watermark } from "@/components/OverlayChrome";

const styles = {
  screenshot: `
    .screenshot-ready {
      padding: 20px !important;
      width: 500px !important;
    }
  `,
};

interface Team {
  _id: string;
  name: string;
  logo: string;
  slot: number;
  currentRound: number;
  totalPoints: number;
  rounds: {
    roundNumber: number;
    kills: number;
    killPoints: number;
    position: number;
    positionPoints: number;
    eliminationCount: number;
    eliminatedPlayers: number[];
    status: string;
  }[];
}

const trophyVariants = {
  initial: { rotate: 0, scale: 1, textShadow: "0 0 0px rgba(255, 165, 0, 0)" },
  animate: {
    rotate: [-5, 5, -5],
    scale: [1, 1.2, 1],
    textShadow: [
      "0 0 0px rgba(255, 165, 0, 0)",
      "0 0 10px rgba(255, 165, 0, 0.8)",
      "0 0 20px rgba(255, 230, 0, 0.9)",
      "0 0 10px rgba(255, 165, 0, 0.8)",
      "0 0 0px rgba(255, 165, 0, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    },
  },
};

const PREVIEW_TEAMS: Team[] = [
  { _id: "p1", name: "TEAM ALPHA", logo: "/placeholder.svg", slot: 1, currentRound: 1, totalPoints: 16, rounds: [{ roundNumber: 1, kills: 6, killPoints: 6, position: 1, positionPoints: 10, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p2", name: "TEAM BRAVO", logo: "/placeholder.svg", slot: 2, currentRound: 1, totalPoints: 12, rounds: [{ roundNumber: 1, kills: 4, killPoints: 4, position: 2, positionPoints: 8, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p3", name: "TEAM CHARLIE", logo: "/placeholder.svg", slot: 3, currentRound: 1, totalPoints: 9, rounds: [{ roundNumber: 1, kills: 6, killPoints: 6, position: 5, positionPoints: 3, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p4", name: "TEAM DELTA", logo: "/placeholder.svg", slot: 4, currentRound: 1, totalPoints: 7, rounds: [{ roundNumber: 1, kills: 5, killPoints: 5, position: 8, positionPoints: 2, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
  { _id: "p5", name: "TEAM ECHO", logo: "/placeholder.svg", slot: 5, currentRound: 1, totalPoints: 4, rounds: [{ roundNumber: 1, kills: 4, killPoints: 4, position: 12, positionPoints: 0, eliminationCount: 0, eliminatedPlayers: [], status: "alive" }] },
];

interface MatchTableProps {
  readonly matchId?: number;
  readonly previewSettings?: PointsTableSettings;
  readonly preview?: boolean;
  readonly inline?: boolean;
}

export default function MatchTable({
  matchId,
  previewSettings,
  preview = false,
  inline = false,
}: MatchTableProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const { settings: remoteSettings } = useSettings();
  const { mapByRound } = useRoundInfo();
  const { branding } = useBranding();

  const settings = useMemo<PointsTableSettings>(
    () =>
      mergePointsTable(
        previewSettings ?? remoteSettings?.pointsTable ?? DEFAULT_POINTS_TABLE
      ),
    [previewSettings, remoteSettings]
  );

  const { colors, match, layout, typography, surface, watermark } = settings;
  const template = match.template;
  const isCard = template === "card-stack";
  const isHairline = template === "hairline";
  const isLower = template === "lower-third";
  const isBig = template === "big-board";
  const animate = surface.animate;
  const fs = (base: number) => base * layout.fontScale * typography.fontScale;
  const typeStyle = typographyStyle(typography);
  const rowH = isBig ? 72 : isCard ? 64 : isHairline ? 44 : 48;
  const columnWidth = isBig ? 96 : 80;

  const displayTeams = preview ? PREVIEW_TEAMS : teams;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await api.get(matchId ? `/team/match/${matchId}` : "/team");
        const data = response.data;
        if (data.success) {
          setTeams(
            data.data.sort((a: Team, b: Team) => {
              const aRound = a.rounds.find(
                (r) => r.roundNumber === (matchId || a.currentRound)
              );
              const bRound = b.rounds.find(
                (r) => r.roundNumber === (matchId || b.currentRound)
              );
              const aPositionPoints = aRound?.positionPoints || 0;
              const bPositionPoints = bRound?.positionPoints || 0;
              const aTotal = (aRound?.kills || 0) + aPositionPoints;
              const bTotal = (bRound?.kills || 0) + bPositionPoints;
              if (bPositionPoints !== aPositionPoints) {
                return bPositionPoints - aPositionPoints;
              }
              return bTotal - aTotal;
            })
          );
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, [matchId]);

  const captureScreenshot = async () => {
    if (!contentRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const element = contentRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: colors.panelTo,
        logging: false,
        allowTaint: true,
        useCORS: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector("[data-screenshot]");
          if (clonedElement) {
            clonedElement.classList.add("screenshot-ready");
          }
        },
        x: 0,
        y: 0,
        width: element.offsetWidth,
        height: element.offsetHeight + 40,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1.0);
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const brandSlug =
        (branding.systemName || "Tournament")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "") || "Tournament";
      link.download = `${brandSlug}-Match-${matchId || "standings"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Screenshot failed:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const renderRow = (team: Team, index: number) => {
    const round = team.rounds.find(
      (r) => r.roundNumber === (matchId || team.currentRound)
    );
    const nameText = displayName(team.name, typography);

    if (isCard) {
      return (
        <motion.div
          key={team._id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 105, damping: 15, delay: Math.min(index * 0.015, 0.12) }}
          className="relative mb-2 flex items-center gap-2 overflow-hidden px-3"
          style={{
            height: rowH,
            borderRadius: surface.radius,
            backgroundImage: `linear-gradient(90deg, ${colors.teamFrom} 0%, ${colors.teamTo} 100%)`,
            border: `1px solid ${colors.borderSoft}`,
            ...typeStyle,
          }}
        >
          <span className="w-7 text-lg font-black text-white">{index + 1}</span>
          {match.showLogo ? (
            <Image src={team.logo || "/placeholder.svg"} alt={team.name} width={32} height={32} className="rounded object-contain" />
          ) : null}
          <span className="min-w-0 flex-1 truncate font-extrabold text-white" style={{ fontSize: fs(16) }}>
            {nameText}
          </span>
          {match.showElims ? (
            <span className="font-bold" style={{ color: colors.elimColor, fontSize: fs(14) }}>
              {round?.kills || 0}
            </span>
          ) : null}
          {match.showPlace ? (
            <span className="font-bold" style={{ color: colors.placeColor, fontSize: fs(14) }}>
              {round?.positionPoints || 0}
            </span>
          ) : null}
          {match.showTotal ? (
            <span className="font-black text-white" style={{ fontSize: fs(17) }}>
              {(round?.kills || 0) + (round?.positionPoints || 0)}
            </span>
          ) : null}
        </motion.div>
      );
    }

    return (
      <motion.div
        key={team._id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative flex"
        style={{
          height: rowH,
          fontSize: fs(isBig ? 15 : 12),
          color: isHairline ? colors.textPrimary : "#FFFFFF",
          backgroundImage: isHairline
            ? undefined
            : `linear-gradient(90deg, ${colors.teamFrom} 0%, ${colors.teamTo} 100%)`,
          borderBottom: `1px solid ${hexToRgba(colors.border, 0.3)}`,
          ...typeStyle,
        }}
      >
        {isLower ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              transform: "skewX(-14deg)",
              backgroundImage: `linear-gradient(90deg, ${colors.teamFrom} 0%, ${colors.teamTo} 100%)`,
            }}
          />
        ) : null}

        {match.showRank ? (
          <div
            className="relative z-10 flex items-center justify-center"
            style={{ width: isBig ? 64 : 50, color: isHairline ? colors.textPrimary : "#FFFFFF" }}
          >
            {index === 0 ? (
              <motion.span variants={trophyVariants} initial="initial" animate="animate">
                🏆
              </motion.span>
            ) : (
              index + 1
            )}
          </div>
        ) : null}

        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-2 pl-2">
          {match.showLogo ? (
            <Image
              src={team.logo || "/placeholder.svg"}
              alt={team.name}
              width={isBig ? 36 : 28}
              height={isBig ? 36 : 28}
              className="rounded-full object-contain"
              style={{ background: isHairline ? "transparent" : colors.rankFrom }}
            />
          ) : null}
          <span className="truncate font-bold tracking-wider" style={{ color: isHairline ? colors.textPrimary : "#FFFFFF", ...typeStyle }}>
            {nameText}
          </span>
        </div>

        {match.showElims ? (
          <div
            className="relative z-10 flex items-center justify-center font-bold"
            style={{ width: columnWidth, color: colors.elimColor, backgroundColor: isHairline ? "transparent" : colors.cellBg, borderLeft: `1px solid ${colors.borderSoft}` }}
          >
            {round?.kills || 0}
          </div>
        ) : null}
        {match.showPlace ? (
          <div
            className="relative z-10 flex items-center justify-center font-bold"
            style={{ width: columnWidth, color: colors.placeColor, backgroundColor: isHairline ? "transparent" : colors.cellBg, borderLeft: `1px solid ${colors.borderSoft}` }}
          >
            {round?.positionPoints || 0}
          </div>
        ) : null}
        {match.showTotal ? (
          <div
            className="relative z-10 flex items-center justify-center font-bold"
            style={{ width: columnWidth, color: colors.totalColor, backgroundColor: isHairline ? "transparent" : colors.cellBg, borderLeft: `1px solid ${colors.borderSoft}` }}
          >
            {(round?.kills || 0) + (round?.positionPoints || 0)}
          </div>
        ) : null}
      </motion.div>
    );
  };

  return (
    <div
      className={inline ? "relative" : "relative min-h-screen bg-fixed bg-center"}
      style={{
        background: `linear-gradient(135deg, ${colors.panelFrom} 0%, ${colors.panelTo} 100%)`,
      }}
    >
      <style>{styles.screenshot}</style>
      <style>{GAMING_FX_CSS}</style>

      {!preview ? (
        <motion.button
          onClick={captureScreenshot}
          disabled={isCapturing}
          className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: `linear-gradient(90deg, ${colors.headerFrom} 0%, ${colors.headerTo} 100%)`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Camera className="h-5 w-5" />
          {isCapturing ? "Capturing..." : "Screenshot"}
        </motion.button>
      ) : null}

      <div
        ref={contentRef}
        data-screenshot
        className="relative mx-auto w-[500px] px-4 py-8"
      >
        <SurfaceBackground surface={surface} />
        <div className="relative mb-12 text-center">
          {match.showTitle ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative inline-flex items-center gap-3"
            >
              {match.bannerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.bannerImage}
                  alt=""
                  className="h-14 w-auto object-contain"
                />
              ) : null}
              <h1
                className="text-4xl font-bold tracking-tight md:text-6xl"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${colors.accent} 0%, ${colors.warning} 50%, ${colors.accent} 100%)`,
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  ...(animate ? fxPan(5) : {}),
                  ...typeStyle,
                }}
              >
                {match.title || branding.systemName || "Tournament Standings"}
              </h1>
            </motion.div>
          ) : null}

          {match.subtitle ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-lg font-semibold uppercase tracking-widest"
              style={{ color: colors.textPrimary, opacity: 0.7 }}
            >
              {match.subtitle}
            </motion.p>
          ) : null}

          <div className="mt-8 flex justify-center">
            <div
              className="h-1 w-40 rounded-full"
              style={{
                backgroundImage: `linear-gradient(90deg, ${colors.headerFrom} 0%, ${colors.warning} 50%, ${colors.headerTo} 100%)`,
                backgroundSize: "200% 100%",
                ...(animate ? fxPan(4) : {}),
                boxShadow: `0 0 14px ${hexToRgba(colors.warning, 0.6)}`,
              }}
            />
          </div>

          {matchId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex items-center justify-center gap-2"
            >
              <Flame className="h-5 w-5" style={{ color: colors.warning }} />
              <h2
                className="-mt-5 text-2xl font-semibold"
                style={{ color: colors.textPrimary, opacity: 0.75 }}
              >
                Match {matchId}
              </h2>
              <Flame className="h-5 w-5" style={{ color: colors.warning }} />
            </motion.div>
          ) : null}

          {mapByRound[matchId || 0] ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-lg font-bold uppercase tracking-widest"
              style={{ color: colors.accent }}
            >
              Map: {mapByRound[matchId || 0]}
            </motion.p>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto w-[450px]"
        >
          {!isHairline ? (
            <div
              className="absolute inset-0 blur-xl"
              style={{
                backgroundImage: `linear-gradient(90deg, ${hexToRgba(colors.headerFrom, 0.25)} 0%, ${hexToRgba(colors.accent, 0.25)} 50%, ${hexToRgba(colors.headerTo, 0.25)} 100%)`,
                backgroundSize: "200% 200%",
                ...(animate ? fxPan(8) : {}),
              }}
            />
          ) : null}

          <div className="relative">
            <div className="flex flex-col overflow-hidden" style={panelSurfaceStyle(surface, colors)}>
              {!isCard && !isHairline ? (
                <div
                  className="relative flex overflow-hidden border-b-2 font-sans text-sm font-bold"
                  style={{
                    height: "3.5rem",
                    color: "#FFFFFF",
                    borderColor: colors.border,
                    backgroundImage: `linear-gradient(90deg, ${colors.headerFrom} 0%, ${colors.headerTo} 100%)`,
                    ...(animate ? fxPan(9) : {}),
                    ...typeStyle,
                  }}
                >
                  {animate ? <Shine duration={4.6} /> : null}
                  {match.showRank ? (
                    <div className="relative flex w-[50px] items-center justify-center">#</div>
                  ) : null}
                  <div className="relative flex flex-1 items-center justify-start pl-2">TEAM</div>
                  {match.showElims ? (
                    <div className="relative flex items-center justify-center" style={{ width: columnWidth }}>ELIMS</div>
                  ) : null}
                  {match.showPlace ? (
                    <div className="relative flex items-center justify-center" style={{ width: columnWidth }}>PLACE PTS</div>
                  ) : null}
                  {match.showTotal ? (
                    <div className="relative flex items-center justify-center" style={{ width: columnWidth, color: colors.warning }}>TOTAL</div>
                  ) : null}
                </div>
              ) : null}

              <div>
                <AnimatePresence>
                  {displayTeams.map((team, index) => renderRow(team, index))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
        {match.footerNote ? (
          <p
            className="relative z-10 mt-6 text-center text-sm font-semibold uppercase tracking-wide"
            style={{ color: colors.textPrimary, opacity: 0.7 }}
          >
            {match.footerNote}
          </p>
        ) : null}
        <Watermark watermark={watermark} />
      </div>
    </div>
  );
}
