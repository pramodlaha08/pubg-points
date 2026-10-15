"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { getApiTournamentId } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { useRoundInfo } from "@/hooks/useRoundInfo";
import {
  DEFAULT_POINTS_TABLE,
  hexToRgba,
  mergePointsTable,
  type PointsTableSettings,
} from "@/lib/tableSettings";

interface EliminationNotification {
  id: string;
  tournamentId?: string;
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
  tournamentId?: string;
  roundNumber: number | null;
  items: EliminationNotification[];
}

interface GamingEliminationNotificationProps {
  readonly previewSettings?: PointsTableSettings;
  readonly preview?: boolean;
  readonly inline?: boolean;
}

const PREVIEW_NOTIFICATION: EliminationNotification = {
  id: "preview",
  teamId: "preview",
  teamName: "TEAM ALPHA",
  teamLogo: "/placeholder.svg",
  roundNumber: 3,
  status: "eliminated",
  position: 5,
  killCount: 6,
  eliminationOrder: 4,
};

const getNotificationKey = (
  item: Pick<EliminationNotification, "teamId" | "roundNumber">
) => `${item.teamId}-${item.roundNumber}`;

export default function GamingEliminationNotification({
  previewSettings,
  preview = false,
  inline = false,
}: GamingEliminationNotificationProps) {
  const [currentNotification, setCurrentNotification] =
    useState<EliminationNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<
    EliminationNotification[]
  >([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const latestByKeyRef = useRef<Map<string, EliminationNotification>>(
    new Map()
  );

  const { settings: remoteSettings, refresh } = useSettings();
  const { mapByRound, refresh: refreshRoundInfo } = useRoundInfo();

  const settings = useMemo<PointsTableSettings>(
    () =>
      mergePointsTable(
        previewSettings ??
          remoteSettings?.pointsTable ??
          DEFAULT_POINTS_TABLE
      ),
    [previewSettings, remoteSettings]
  );

  const { colors, notifications } = settings;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  const socketBase = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      return process.env.NEXT_PUBLIC_SOCKET_URL;
    }
    return apiBase.replace(/\/api\/v1\/?$/, "");
  }, [apiBase]);

  useEffect(() => {
    if (preview || !apiBase) return;

    const socket = io(socketBase, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      const scope = getApiTournamentId();
      if (scope) socket.emit("join_tournament", scope);
      socket.emit("subscribe_elimination_feed", { tournamentId: scope });
    });

    socket.on(
      "elimination_order_snapshot",
      (payload: EliminationSnapshotPayload) => {
        const scope = getApiTournamentId();
        if (scope && payload.tournamentId && payload.tournamentId !== scope) {
          return;
        }
        const map = new Map<string, EliminationNotification>();
        for (const item of payload.items || []) {
          if (scope && item.tournamentId && item.tournamentId !== scope) continue;
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
      }
    );

    socket.on(
      "elimination_state_changed",
      (payload: EliminationStateChangedPayload) => {
        if (!payload?.eventId || seenEventIdsRef.current.has(payload.eventId)) {
          return;
        }
        seenEventIdsRef.current.add(payload.eventId);

        const scope = getApiTournamentId();
        if (
          scope &&
          payload.notification?.tournamentId &&
          payload.notification.tournamentId !== scope
        ) {
          return;
        }

        const incoming = payload.notification;
        const key = getNotificationKey(incoming);
        const latest = latestByKeyRef.current.get(key) || incoming;

        if (payload.action === "eliminated") {
          setNotificationQueue((prev) => {
            const exists = prev.some(
              (item) => getNotificationKey(item) === key
            );
            if (exists) {
              return prev.map((item) =>
                getNotificationKey(item) === key ? latest : item
              );
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
            prev.map((item) =>
              getNotificationKey(item) === key ? latest : item
            )
          );
          setCurrentNotification((prev) => {
            if (!prev || getNotificationKey(prev) !== key) return prev;
            return latest;
          });
        }
      }
    );

    socket.on("settings_updated", () => refresh());
    socket.on("round_info_updated", () => refreshRoundInfo());

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiBase, socketBase, preview, refresh, refreshRoundInfo]);

  useEffect(() => {
    if (preview) return;
    if (currentNotification || notificationQueue.length === 0) {
      return;
    }

    const [next, ...rest] = notificationQueue;
    setCurrentNotification(next);
    setNotificationQueue(rest);

    timerRef.current = setTimeout(() => {
      setCurrentNotification(null);
      timerRef.current = null;
    }, notifications.durationMs);
  }, [notificationQueue, currentNotification, notifications.durationMs, preview]);

  const active = preview ? PREVIEW_NOTIFICATION : currentNotification;

  if (!active) return null;

  const activeMap = mapByRound[active.roundNumber];

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
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
          className={
            inline
              ? "relative w-full max-w-sm z-[100]"
              : "fixed bottom-72 left-12 w-full max-w-sm z-[100]"
          }
        >
          <div
            className="relative border p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden"
            style={{
              borderColor: colors.borderSoft,
              background: `linear-gradient(135deg, ${colors.notificationFrom} 0%, ${colors.notificationTo} 100%)`,
            }}
          >
            {/* Decorative background gradients */}
            <div
              className="absolute right-0 top-0 w-32 h-full pointer-events-none"
              style={{
                background: `linear-gradient(to left, ${hexToRgba(
                  colors.danger,
                  0.12
                )}, transparent)`,
              }}
            />
            <div className="absolute left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-slate-50/40 to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between z-10">
              <div className="flex items-center space-x-4">
                {/* Logo wrapper */}
                {notifications.showLogo ? (
                  <div
                    className="relative w-16 h-16 rounded-xl border shadow-sm flex items-center justify-center p-1"
                    style={{
                      background: colors.cellBg,
                      borderColor: colors.borderSoft,
                    }}
                  >
                    <Image
                      src={active.teamLogo || "/placeholder.svg"}
                      alt={`${active.teamName} logo`}
                      fill
                      className="p-1 rounded-xl drop-shadow-sm grayscale-[15%] object-contain"
                    />
                  </div>
                ) : null}

                <div className="min-w-0">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5"
                    style={{ color: colors.danger }}
                  >
                    Team Eliminated
                  </p>
                  <h3
                    className="text-2xl font-black uppercase tracking-wide leading-none truncate max-w-[150px]"
                    style={{ color: colors.textPrimary }}
                  >
                    {active.teamName}
                  </h3>

                  {notifications.showKills ? (
                    <div className="flex items-center mt-2.5">
                      <span
                        className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold border"
                        style={{
                          color: colors.warning,
                          borderColor: hexToRgba(colors.warning, 0.3),
                          background: hexToRgba(colors.warning, 0.15),
                        }}
                      >
                        Elims: {active.killCount}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Rank Block */}
              {notifications.showRank ? (
                <div
                  className="flex flex-col items-center justify-center h-16 w-16 rounded-xl shadow-md border flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.rankFrom} 0%, ${colors.rankTo} 100%)`,
                    borderColor: hexToRgba(colors.rankTo, 0.6),
                  }}
                >
                  <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest mb-[-2px]">
                    Rank
                  </span>
                  <p className="text-3xl font-black text-white leading-none">
                    #{active.eliminationOrder}
                  </p>
                </div>
              ) : null}
            </div>

            {notifications.showRound ? (
              <div className="relative z-10 mt-2 text-right">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: colors.textPrimary, opacity: 0.6 }}
                >
                  Round {active.roundNumber}
                  {activeMap ? ` • ${activeMap}` : ""}
                </span>
              </div>
            ) : null}

            {/* Auto-dismiss progress bar line */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{
                duration: Math.max(notifications.durationMs / 1000, 1),
                ease: "linear",
              }}
              className="absolute bottom-0 left-0 h-1"
              style={{
                background: `linear-gradient(90deg, ${colors.rankFrom} 0%, ${colors.rankTo} 100%)`,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
