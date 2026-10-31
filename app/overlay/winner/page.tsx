"use client";

import Image from "next/image";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { fetcher } from "@/lib/swr";
import { useBroadcast } from "@/hooks/useBroadcast";

interface WinnerTeam {
  _id: string;
  name: string;
  logo?: string;
  slot?: number;
  totalPoints?: number;
  rounds?: { kills?: number }[];
}

export default function WinnerOverlay() {
  const { broadcast } = useBroadcast();
  const winner = broadcast?.winner;
  const { data: teams } = useSWR<WinnerTeam[]>(
    winner?.visible ? "/team" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const team = teams?.find((item) => item._id === winner?.teamId);
  const elims =
    team?.rounds?.reduce((sum, round) => sum + (round.kills ?? 0), 0) ?? 0;

  return (
    <AnimatePresence>
      {winner?.visible ? (
        <motion.div
          key="winner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0) 75%)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -20 }}
            transition={{ type: "spring", stiffness: 130, damping: 16 }}
            className="relative flex w-[760px] max-w-[90vw] flex-col items-center rounded-2xl border border-amber-300/40 bg-gradient-to-b from-black/90 via-slate-950/90 to-black/90 px-12 py-10 text-center shadow-[0_0_80px_rgba(251,191,36,0.25)] backdrop-blur-md"
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
              {winner.title || "CHAMPIONS"}
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
              <h1 className="text-5xl font-black uppercase tracking-[0.04em] text-white">
                {team?.name || "Winner"}
              </h1>
            </motion.div>

            {winner.subtitle ? (
              <p className="mt-3 text-lg font-semibold text-white/70">
                {winner.subtitle}
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
                <span className="text-2xl font-black text-amber-300">
                  {elims}
                </span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
