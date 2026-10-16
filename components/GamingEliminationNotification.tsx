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
import {
  displayName,
  positionStyle,
  typographyStyle,
} from "@/lib/overlayTheme";
import { SurfaceBackground, Watermark } from "@/components/OverlayChrome";

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
  const latestByKeyRef = useRef<Map<string, EliminationNotification>>(new Map());

  const { settings: remoteSettings, refresh } = useSettings();
  const { mapByRound, refresh: refreshRoundInfo } = useRoundInfo();

  const settings = useMemo<PointsTableSettings>(
    () =>
      mergePointsTable(
        previewSettings ?? remoteSettings?.pointsTable ?? DEFAULT_POINTS_TABLE
      ),
    [previewSettings, remoteSettings]
  );

  const { colors, notifications, typography, surface, watermark } = settings;
  const template = notifications.template;

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
  const name = displayName(active.teamName, typography);
  const isFlat = template === "hairline";
  const isBig = template === "big-board";
  const isLower = template === "lower-third";
  const logoSize = isBig ? 72 : isLower ? 56 : 64;

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
          className={inline ? "relative z-[100]" : "z-[100]"}
          style={{
            ...positionStyle(notifications.position, inline),
            width: "100%",
            maxWidth: isBig ? 460 : isLower ? 480 : 384,
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              border: isFlat ? "none" : `1px solid ${colors.borderSoft}`,
              borderRadius: isFlat ? 0 : 16,
              padding: isFlat ? 0 : 16,
              background: isFlat
                ? "transparent"
                : `linear-gradient(135deg, ${colors.notificationFrom} 0%, ${colors.notificationTo} 100%)`,
              boxShadow: isFlat ? "none" : "0 8px 30px rgb(0 0 0 / 0.12)",
            }}
          >
            <SurfaceBackground surface={surface} />
            {!isFlat ? (
              <>
                <div
                  className="pointer-events-none absolute right-0 top-0 h-full w-32"
                  style={{
                    background: `linear-gradient(to left, ${hexToRgba(
                      colors.danger,
                      0.12
                    )}, transparent)`,
                  }}
                />
                <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-slate-50/40 to-transparent" />
              </>
            ) : null}

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {isLower ? (
                  <span
                    className="h-12 w-1.5 shrink-0 rounded-full"
                    style={{ background: colors.danger }}
                  />
                ) : null}

                {notifications.showLogo ? (
                  <div
                    className="relative flex shrink-0 items-center justify-center rounded-xl border shadow-sm"
                    style={{
                      width: logoSize,
                      height: logoSize,
                      padding: isFlat ? 0 : 4,
                      background: isFlat ? "transparent" : colors.cellBg,
                      borderColor: isFlat ? "transparent" : colors.borderSoft,
                    }}
                  >
                    <Image
                      src={active.teamLogo || "/placeholder.svg"}
                      alt={`${active.teamName} logo`}
                      fill
                      className="rounded-xl object-contain drop-shadow-sm"
                      style={{ padding: isFlat ? 0 : 4 }}
                    />
                  </div>
                ) : null}

                <div className="min-w-0">
                  <p
                    className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: colors.danger, ...typographyStyle(typography) }}
                  >
                    {isFlat ? "Eliminated" : "Team Eliminated"}
                  </p>
                  <h3
                    className={`truncate font-black uppercase leading-none tracking-wide ${
                      isBig ? "text-4xl" : "text-2xl"
                    }`}
                    style={{
                      color: colors.textPrimary,
                      maxWidth: isBig ? 220 : 150,
                      ...typographyStyle(typography),
                    }}
                  >
                    {name}
                  </h3>

                  {notifications.showKills ? (
                    <div className="mt-2.5 flex items-center">
                      <span
                        className="inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold"
                        style={{
                          color: colors.textPrimary,
                          borderColor: hexToRgba(colors.warning, 0.5),
                          background: hexToRgba(colors.warning, 0.16),
                        }}
                      >
                        {active.killCount} ELIMS
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {notifications.showRank ? (
                <div
                  className="flex shrink-0 flex-col items-center justify-center rounded-xl border shadow-sm"
                  style={{
                    width: isFlat ? 56 : 64,
                    height: isFlat ? 56 : 64,
                    background: isFlat
                      ? "transparent"
                      : `linear-gradient(180deg, ${colors.rankFrom} 0%, ${colors.rankTo} 100%)`,
                    borderColor: isFlat ? "transparent" : colors.border,
                  }}
                >
                  <span
                    className="mb-[-2px] text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: colors.textPrimary, opacity: 0.7 }}
                  >
                    Rank
                  </span>
                  <p
                    className="text-3xl font-black leading-none"
                    style={{ color: isFlat ? colors.textPrimary : "#FFFFFF" }}
                  >
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

            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{
                duration: Math.max(notifications.durationMs / 1000, 1),
                ease: "linear",
              }}
              className="absolute bottom-0 left-0 h-1"
              style={{
                background: isFlat
                  ? colors.accent
                  : `linear-gradient(90deg, ${colors.rankFrom} 0%, ${colors.rankTo} 100%)`,
              }}
            />
            <Watermark watermark={watermark} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
