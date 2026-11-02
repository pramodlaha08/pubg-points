"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBroadcast } from "@/hooks/useBroadcast";

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

export default function CountdownOverlay() {
  const { broadcast } = useBroadcast();
  const countdown = broadcast?.countdown;
  const [now, setNow] = useState(() => Date.now());
  const offsetRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!broadcast?.serverTime) return;
    offsetRef.current = new Date(broadcast.serverTime).getTime() - Date.now();
  }, [broadcast?.serverTime]);

  const remaining =
    countdown?.running && countdown.endsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(countdown.endsAt).getTime() - (now + offsetRef.current)) /
              1000
          )
        )
      : (countdown?.remainingSeconds ?? 0);

  const urgent = Boolean(countdown?.running) && remaining <= 10;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <AnimatePresence>
        {countdown?.visible ? (
          <motion.div
            key="countdown"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            className="absolute left-1/2 top-10 -translate-x-1/2 text-center"
          >
            <div className="rounded-2xl border border-white/15 bg-black/75 px-10 py-4 shadow-2xl backdrop-blur-md">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-300">
                {countdown.title || "Starting in"}
              </p>
              <p
                className={`mt-1 font-mono text-6xl font-black tabular-nums ${
                  urgent ? "animate-pulse text-red-400" : "text-white"
                }`}
              >
                {formatClock(remaining)}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
