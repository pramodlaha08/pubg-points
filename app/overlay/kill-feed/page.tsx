"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skull } from "lucide-react";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useKillFeed } from "@/hooks/useKillFeed";

const VISIBLE_MS = 45000;
const MAX_ENTRIES = 6;

export default function KillFeedOverlay() {
  const { broadcast } = useBroadcast();
  const { events } = useKillFeed();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (broadcast?.overlays.killFeed === false) return null;

  const visible = events
    .filter((event) => now - Date.parse(event.at) < VISIBLE_MS)
    .slice(0, MAX_ENTRIES);

  return (
    <div className="pointer-events-none fixed bottom-12 right-10 flex w-[460px] flex-col items-end gap-2">
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
                  {event.delta > 0
                    ? `+${event.delta}`
                    : event.delta < 0
                      ? event.delta
                      : "±0"}
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
