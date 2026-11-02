"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useBroadcast } from "@/hooks/useBroadcast";

export default function LowerThirdOverlay() {
  const { broadcast } = useBroadcast();
  const lowerThird = broadcast?.lowerThird;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <AnimatePresence>
        {lowerThird?.visible && lowerThird.title ? (
          <motion.div
            key="lower-third"
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 130, damping: 18 }}
            className="absolute bottom-16 left-12 flex items-stretch overflow-hidden rounded-lg shadow-2xl"
          >
            <div className="w-2 bg-amber-400" />
            <div className="bg-black/80 px-7 py-4 backdrop-blur-md">
              <p className="text-3xl font-black uppercase tracking-wide text-white">
                {lowerThird.title}
              </p>
              {lowerThird.subtitle ? (
                <p className="mt-1 text-lg font-semibold text-amber-300">
                  {lowerThird.subtitle}
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
