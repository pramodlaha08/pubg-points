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

const getNotificationKey = (
  item: Pick<EliminationNotification, "teamId" | "roundNumber">,
) => `${item.teamId}-${item.roundNumber}`;

export default function GamingEliminationNotification() {
  const [currentNotification, setCurrentNotification] =
    useState<EliminationNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<
    EliminationNotification[]
  >([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const latestByKeyRef = useRef<Map<string, EliminationNotification>>(
    new Map(),
  );

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

    socket.on(
      "elimination_order_snapshot",
      (payload: EliminationSnapshotPayload) => {
        const map = new Map<string, EliminationNotification>();
        for (const item of payload.items || []) {
          map.set(getNotificationKey(item), item);
        }
        latestByKeyRef.current = map;

        setNotificationQueue((prev) =>
          prev.map((item) => map.get(getNotificationKey(item)) || item),
        );
        setCurrentNotification((prev) => {
          if (!prev) return prev;
          return map.get(getNotificationKey(prev)) || prev;
        });
      },
    );

    socket.on(
      "elimination_state_changed",
      (payload: EliminationStateChangedPayload) => {
        if (!payload?.eventId || seenEventIdsRef.current.has(payload.eventId)) {
          return;
        }
        seenEventIdsRef.current.add(payload.eventId);

        const incoming = payload.notification;
        const key = getNotificationKey(incoming);
        const latest = latestByKeyRef.current.get(key) || incoming;

        if (payload.action === "eliminated") {
          setNotificationQueue((prev) => {
            const exists = prev.some(
              (item) => getNotificationKey(item) === key,
            );
            if (exists) {
              return prev.map((item) =>
                getNotificationKey(item) === key ? latest : item,
              );
            }
            return [...prev, latest];
          });
        }

        if (payload.action === "alive") {
          setNotificationQueue((prev) =>
            prev.filter((item) => getNotificationKey(item) !== key),
          );
          setCurrentNotification((prev) =>
            prev && getNotificationKey(prev) === key ? null : prev,
          );
        }

        if (payload.action === "updated") {
          setNotificationQueue((prev) =>
            prev.map((item) =>
              getNotificationKey(item) === key ? latest : item,
            ),
          );
          setCurrentNotification((prev) => {
            if (!prev || getNotificationKey(prev) !== key) return prev;
            return latest;
          });
        }
      },
    );

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
    <AnimatePresence>
      {currentNotification && (
        <motion.div
          key={currentNotification.id}
          initial={{ opacity: 0, x: "-100%", scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{
            opacity: 0,
            x: "-100%",
            transition: { duration: 0.4, ease: "easeIn" },
          }}
          transition={{ type: "spring", stiffness: 110, damping: 15 }}
          /*
           * To change the position of the notification, update the classes below.
           * For top-left, use: "top-4 left-4"
           * For top-right, use: "top-4 right-4"
           * For bottom-left, use: "bottom-4 left-4"
           * For bottom-right, use: "bottom-4 right-4"
           * You can also use other values like "top-8", "left-8", etc. to adjust the spacing.
           */
          className="fixed bottom-72 left-12 w-full max-w-sm z-[100]"
        >
          <div className="relative bg-white border border-blue-200 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
            {/* Decorative background gradients */}
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between z-10">
              <div className="flex items-center space-x-4">
                {/* Logo wrapper */}
                <div className="relative w-16 h-16 bg-slate-50 rounded-xl border border-blue-100 shadow-sm flex items-center justify-center p-1">
                  <Image
                    src={currentNotification.teamLogo || "/placeholder.svg"}
                    alt={`${currentNotification.teamName} logo`}
                    layout="fill"
                    objectFit="contain"
                    className="p-1 rounded-xl drop-shadow-sm grayscale-[15%]"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-0.5">
                    Team Eliminated
                  </p>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide leading-none truncate max-w-[150px]">
                    {currentNotification.teamName}
                  </h3>

                  <div className="flex items-center mt-2.5">
                    <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600 border border-amber-200">
                      Elims: {currentNotification.killCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rank Block */}
              <div className="flex flex-col items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-[#001FFF] to-[#5A96E6] shadow-md border border-blue-400 flex-shrink-0">
                <span className="text-[9px] font-bold text-blue-100 uppercase tracking-widest mb-[-2px]">
                  Rank
                </span>
                <p className="text-3xl font-black text-white leading-none">
                  #{currentNotification.eliminationOrder}
                </p>
              </div>
            </div>

            {/* Auto-dismiss progress bar line */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#001FFF] to-[#5A96E6]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
