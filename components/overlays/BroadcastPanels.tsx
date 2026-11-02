"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Skull, Trophy } from "lucide-react";
import type { CountdownState, LowerThirdState, WinnerState } from "@/types/broadcast";
import type { KillFeedEvent } from "@/hooks/useKillFeed";

export interface WinnerTeam {
  _id: string;
  name: string;
  logo?: string;
  slot?: number;
  totalPoints?: number;
  rounds?: { kills?: number }[];
}

export function KillFeedList({
  events,
  now,
  preview = false,
}: {
  events: KillFeedEvent[];
  now: number;
  preview?: boolean;
}) {
  const visible = events
    .filter((event) => now - Date.parse(event.at) < 45000)
    .slice(0, 6);

  if (!visible.length) {
    return preview ? (
      <div className="rounded-lg border border-dashed border-white/20 bg-black/50 px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white/40">
        Kill feed
      </div>
    ) : null;
  }

  return (
    <div className="flex w-full flex-col items-end gap-2">
      <AnimatePresence initial={false}>
        {visible.map((event) => {
          const seconds = Math.max(
            0,
            Math.round((now - Date.parse(event.at)) / 1000)
          );
          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              className="relative flex w-full items-center gap-3 overflow-hidden rounded-lg border border-white/10 bg-black/80 px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
            >
              <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-red-500 to-amber-400" />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500/15 text-red-400">
                <Skull className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-black uppercase tracking-wide text-white">
                  {event.teamName}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  {event.roundNumber ? `Round ${event.roundNumber}` : "Live"}
                  {event.kills !== null ? ` · ${event.kills} elims` : ""}
                </p>
              </div>
              <span className="text-right">
                <span className="block text-2xl font-black leading-none text-amber-300">
                  {event.delta > 0 ? `+${event.delta}` : event.delta || "0"}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  {seconds}s
                </span>
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function LowerThirdCard({
  state,
  preview = false,
}: {
  state?: LowerThirdState;
  preview?: boolean;
}) {
  const show = Boolean(state?.visible && state.title) || preview;
  const title = state?.title || (preview ? "Lower third title" : "");

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="lower-third"
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 130, damping: 18 }}
          className="flex items-stretch overflow-hidden rounded-lg shadow-2xl"
        >
          <div className="w-2 bg-amber-400" />
          <div className="bg-black/80 px-7 py-4 backdrop-blur-md">
            <p className="text-3xl font-black uppercase tracking-wide text-white">
              {title}
            </p>
            {state?.subtitle || preview ? (
              <p className="mt-1 text-lg font-semibold text-amber-300">
                {state?.subtitle || "Subtitle appears here"}
              </p>
            ) : null}
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

export function CountdownCard({
  state,
  serverTime,
  preview = false,
}: {
  state?: CountdownState;
  serverTime?: string;
  preview?: boolean;
}) {
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
    state?.running && state.endsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(state.endsAt).getTime() - (now + offsetRef.current)) / 1000
          )
        )
      : (state?.remainingSeconds ?? 300);

  const urgent = Boolean(state?.running) && remaining <= 10;

  return (
    <div className="text-center">
      <div className="inline-block rounded-2xl border border-white/15 bg-black/75 px-10 py-4 shadow-2xl backdrop-blur-md">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-300">
          {state?.title || "Starting in"}
        </p>
        <p
          className={`mt-1 font-mono text-6xl font-black tabular-nums ${
            urgent ? "animate-pulse text-red-400" : "text-white"
          }`}
        >
          {formatClock(remaining)}
        </p>
      </div>
    </div>
  );
}

export function WinnerCard({
  winner,
  team,
  preview = false,
}: {
  winner?: WinnerState;
  team?: WinnerTeam | null;
  preview?: boolean;
}) {
  if (!winner?.visible && !preview) return null;

  const elims =
    team?.rounds?.reduce((sum, round) => sum + (round.kills ?? 0), 0) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.86, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 130, damping: 16 }}
      className="relative flex w-full flex-col items-center rounded-2xl border border-amber-300/40 bg-gradient-to-b from-black/90 via-slate-950/90 to-black/90 px-12 py-10 text-center shadow-[0_0_80px_rgba(251,191,36,0.25)] backdrop-blur-md"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      <motion.span
        initial={{ rotate: -12, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ delay: 0.12, type: "spring", stiffness: 180 }}
        className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/50 bg-amber-400/15 text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.35)]"
      >
        <Trophy className="h-8 w-8" />
      </motion.span>

      <p className="text-sm font-black uppercase tracking-[0.55em] text-amber-300">
        {winner?.title || "CHAMPIONS"}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="mt-5 flex items-center gap-5"
      >
        {team?.logo ? (
          <Image
            src={team.logo}
            alt={team.name}
            width={86}
            height={86}
            className="h-[86px] w-[86px] rounded-xl bg-white/5 object-contain p-2"
          />
        ) : (
          <span className="flex h-[86px] w-[86px] items-center justify-center rounded-xl border border-white/15 bg-white/5 text-amber-300">
            <Crown className="h-10 w-10" />
          </span>
        )}
        <h1 className="max-w-[520px] text-5xl font-black uppercase tracking-[0.04em] text-white">
          {team?.name || "Winner"}
        </h1>
      </motion.div>

      {winner?.subtitle || preview ? (
        <p className="mt-3 text-lg font-semibold text-white/70">
          {winner?.subtitle || "Winner subtitle"}
        </p>
      ) : null}

      <div className="mt-7 flex items-center gap-3">
        <span className="rounded-lg border border-white/10 bg-white/5 px-5 py-2">
          <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
            Points
          </span>
          <span className="text-2xl font-black text-white">
            {team?.totalPoints ?? 0}
          </span>
        </span>
        <span className="rounded-lg border border-white/10 bg-white/5 px-5 py-2">
          <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
            Elims
          </span>
          <span className="text-2xl font-black text-amber-300">{elims}</span>
        </span>
      </div>
    </motion.div>
  );
}
