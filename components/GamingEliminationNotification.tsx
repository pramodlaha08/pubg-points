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
          initial={{ opacity: 0, x: "-100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "-100%", transition: { duration: 0.3 } }}
          /*
           * To change the position of the notification, update the classes below.
           * For top-left, use: "top-4 left-4"
           * For top-right, use: "top-4 right-4"
           * For bottom-left, use: "bottom-4 left-4"
           * For bottom-right, use: "bottom-4 right-4"
           * You can also use other values like "top-8", "left-8", etc. to adjust the spacing.
           */
          className="fixed top-4 left-4 w-full max-w-md z-50"
        >
          <div className="relative bg-black bg-opacity-80 border-2 border-yellow-400 p-3 rounded-lg shadow-lg overflow-hidden">
            <div
              className="absolute top-0 left-0 w-full h-full bg-yellow-400 opacity-10"
              style={{
                clipPath: "polygon(0 0, 100% 0, 80% 100%, 0% 100%)",
              }}
            ></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16">
                  <Image
                    src={
                      currentNotification.teamLogo ||
                      "/path/to/default/logo.png"
                    }
                    alt={`${currentNotification.teamName} logo`}
                    layout="fill"
                    objectFit="contain"
                    className="rounded-full border-2 border-yellow-400"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-wider">
                    {currentNotification.teamName}
                  </h3>
                  <p className="text-yellow-400 text-sm">
                    Finished #{currentNotification.position} with{" "}
                    {currentNotification.killCount} Kills
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-white">
                  #{currentNotification.position}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
