"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

interface EliminationNotification {
  id: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  roundNumber: number;
  status: "alive" | "eliminated";
  position: number;
  killCount: number;
  eliminationOrder: number;
}

interface EliminationStateChangedPayload {
  eventId: string;
  action: "eliminated" | "alive" | "updated";
  notification: EliminationNotification;
}

interface EliminationSnapshotPayload {
  roundNumber: number | null;
  items: EliminationNotification[];
}

const DISPLAY_MS = 5000;

const getNotificationKey = (item: Pick<EliminationNotification, "teamId" | "roundNumber">) =>
  `${item.teamId}-${item.roundNumber}`;

export default function GamingEliminationNotification() {
  const [currentNotification, setCurrentNotification] =
    useState<EliminationNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<
    EliminationNotification[]
  >([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const latestByKeyRef = useRef<Map<string, EliminationNotification>>(new Map());

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  const socketBase = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      return process.env.NEXT_PUBLIC_SOCKET_URL;
    }
    return apiBase.replace(/\/api\/v1\/?$/, "");
  }, [apiBase]);

  useEffect(() => {
    if (!apiBase) return;

    const socket = io(socketBase, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe_elimination_feed", {});
    });

    socket.on("elimination_order_snapshot", (payload: EliminationSnapshotPayload) => {
      const map = new Map<string, EliminationNotification>();
      for (const item of payload.items || []) {
        map.set(getNotificationKey(item), item);
      }
      latestByKeyRef.current = map;

      setNotificationQueue((prev) =>
        prev.map((item) => map.get(getNotificationKey(item)) || item)
      );
      setCurrentNotification((prev) => {
        if (!prev) return prev;
        return map.get(getNotificationKey(prev)) || prev;
      });
    });

    socket.on("elimination_state_changed", (payload: EliminationStateChangedPayload) => {
      if (!payload?.eventId || seenEventIdsRef.current.has(payload.eventId)) {
        return;
      }
      seenEventIdsRef.current.add(payload.eventId);

      const incoming = payload.notification;
      const key = getNotificationKey(incoming);
      const latest = latestByKeyRef.current.get(key) || incoming;

      if (payload.action === "eliminated") {
        setNotificationQueue((prev) => {
          const exists = prev.some((item) => getNotificationKey(item) === key);
          if (exists) {
            return prev.map((item) => (getNotificationKey(item) === key ? latest : item));
          }
          return [...prev, latest];
        });
      }

      if (payload.action === "alive") {
        setNotificationQueue((prev) =>
          prev.filter((item) => getNotificationKey(item) !== key)
        );
        setCurrentNotification((prev) =>
          prev && getNotificationKey(prev) === key ? null : prev
        );
      }

      if (payload.action === "updated") {
        setNotificationQueue((prev) =>
          prev.map((item) => (getNotificationKey(item) === key ? latest : item))
        );
        setCurrentNotification((prev) => {
          if (!prev || getNotificationKey(prev) !== key) return prev;
          return latest;
        });
      }
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiBase, socketBase]);

  useEffect(() => {
    if (currentNotification || notificationQueue.length === 0) {
      return;
    }

    const [next, ...rest] = notificationQueue;
    setCurrentNotification(next);
    setNotificationQueue(rest);

    timerRef.current = setTimeout(() => {
      setCurrentNotification(null);
      timerRef.current = null;
    }, DISPLAY_MS);
  }, [notificationQueue, currentNotification]);

  if (!currentNotification) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-red-600"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle, transparent 30%, rgba(139, 0, 0, 0.4) 100%)",
          }}
        />

        <motion.div
          key={`${currentNotification.teamId}-${currentNotification.roundNumber}-${currentNotification.id}`}
          initial={{ scale: 0.3, opacity: 0, rotateX: -90, y: -200 }}
          animate={{
            scale: 1,
            opacity: 1,
            rotateX: 0,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 25 },
          }}
          exit={{
            scale: 0.3,
            opacity: 0,
            rotateY: 90,
            x: 800,
            transition: { duration: 0.6 },
          }}
          className="relative w-[600px] pointer-events-auto"
          style={{ perspective: "1500px" }}
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 40px rgba(220, 38, 38, 0.8), 0 0 80px rgba(220, 38, 38, 0.4)",
                "0 0 60px rgba(220, 38, 38, 1), 0 0 120px rgba(220, 38, 38, 0.6)",
                "0 0 40px rgba(220, 38, 38, 0.8), 0 0 80px rgba(220, 38, 38, 0.4)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)",
                padding: "4px",
              }}
            >
              <div className="w-full h-full bg-gray-900/80 rounded-2xl" />
            </div>

            <div className="relative bg-gradient-to-br from-gray-900/85 via-red-950/85 to-gray-900/85 rounded-2xl overflow-hidden border-2 border-red-500">
              <div className="relative bg-gradient-to-r from-transparent via-red-600 to-transparent py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-yellow-400 text-2xl">⚠</span>
                    <h3 className="text-white font-black text-xl tracking-[0.4em] uppercase">
                      TEAM ELIMINATED
                    </h3>
                    <span className="text-yellow-400 text-2xl">⚠</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 flex items-center gap-5">
                <div className="text-7xl">💀</div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <Image
                        src={currentNotification.teamLogo || "/placeholder.svg"}
                        alt={currentNotification.teamName}
                        width={70}
                        height={70}
                        className="object-contain rounded-xl border-2 border-yellow-500 shadow-2xl"
                      />
                    </div>

                    <div className="flex-1">
                      <h1
                        className="text-4xl font-black text-white uppercase tracking-tight mb-3"
                        style={{ WebkitTextStroke: "2px rgba(0,0,0,0.5)" }}
                      >
                        {currentNotification.teamName}
                      </h1>

                      <div className="flex items-center gap-3">
                        <div className="bg-red-500/30 border-2 border-red-500 px-3 py-1.5 rounded-lg">
                          <span className="text-red-200 font-bold uppercase text-sm">
                            Eliminated
                          </span>
                        </div>

                        {currentNotification.killCount > 0 && (
                          <div className="bg-orange-500/30 border-2 border-orange-500 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <span className="text-orange-100 font-bold text-sm">
                              {currentNotification.killCount} 🎯
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span
                    className="text-yellow-400 font-black text-7xl leading-none"
                    style={{ WebkitTextStroke: "2px rgba(0,0,0,0.4)" }}
                  >
                    #
                  </span>
                  <span
                    className="text-white font-black text-6xl leading-none"
                    style={{ WebkitTextStroke: "1.5px rgba(0,0,0,0.3)" }}
                  >
                    {currentNotification.eliminationOrder}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-900 via-red-700 to-red-900 py-3 px-8">
                <div className="flex items-center justify-center text-lg">
                  <span className="text-yellow-300 font-bold uppercase tracking-wide">
                    Round {currentNotification.roundNumber}
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: DISPLAY_MS / 1000, ease: "linear" }}
                className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 origin-left"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
