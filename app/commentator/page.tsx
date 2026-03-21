"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  GiElectric,
  GiRadioTower,
  GiTargeting,
} from "react-icons/gi";

type Severity = "info" | "highlight" | "critical";

interface TeamLogChange {
  field: string;
  previous: unknown;
  current: unknown;
  delta: number | null;
}

interface TeamLogTotals {
  totalPoints: number;
  totalKillsInRound: number;
  killPointsInRound: number;
  positionPointsInRound: number;
  eliminationCountInRound: number;
  teamStatusInRound: "alive" | "eliminated" | "unknown";
}

interface TeamLogItem {
  _id: string;
  eventType: string;
  severity: Severity;
  roundNumber: number | null;
  teamName: string;
  slot: number;
  title: string;
  message: string;
  changes: TeamLogChange[];
  totals: TeamLogTotals;
  createdAt: string;
}

interface SnapshotResponse {
  success: boolean;
  data?: {
    items?: TeamLogItem[];
  };
}

const FEED_LIMIT = 120;

const severityClass: Record<Severity, string> = {
  info: "border-slate-300/30 bg-slate-900/90 text-slate-100",
  highlight: "border-amber-300/60 bg-amber-950/40 text-amber-50",
  critical: "border-red-300/70 bg-red-950/45 text-red-50",
};

const severityBadgeClass: Record<Severity, string> = {
  info: "bg-slate-700 text-slate-100",
  highlight: "bg-amber-500 text-black",
  critical: "bg-red-600 text-white",
};

const sortNewestFirst = (items: TeamLogItem[]) => {
  return [...items].sort((a, b) => {
    const timeB = new Date(b.createdAt).getTime();
    const timeA = new Date(a.createdAt).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return b._id.localeCompare(a._id);
  });
};

const formatClock = (iso: string) => {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function CommentatorPage() {
  const [feed, setFeed] = useState<TeamLogItem[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string>("");
  const [lastEventAt, setLastEventAt] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);
  const hasBootedRef = useRef(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  const socketBase = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      return process.env.NEXT_PUBLIC_SOCKET_URL;
    }
    return apiBase.replace(/\/api\/v1\/?$/, "");
  }, [apiBase]);

  const restoreSnapshot = useCallback(async () => {
    try {
      setSnapshotError("");
      console.log("[Commentator] Restoring snapshot from:", `${apiBase}/team-log/snapshot`);
      const response = await axios.get<SnapshotResponse>(
        `${apiBase}/team-log/snapshot`,
      );

      console.log("[Commentator] Snapshot response:", {
        success: response.data?.success,
        itemCount: response.data?.data?.items?.length,
      });

      const snapshotItems = sortNewestFirst(response.data?.data?.items || []);
      setFeed(snapshotItems.slice(0, FEED_LIMIT));
      if (snapshotItems[0]?.createdAt) {
        setLastEventAt(snapshotItems[0].createdAt);
      }
      console.log("[Commentator] Snapshot restored with", snapshotItems.length, "items");
    } catch (error) {
      console.error("[Commentator] Snapshot restore failed:", error);
      setSnapshotError("Could not restore commentary snapshot.");
    }
  }, [apiBase]);


  // Load initial snapshot on mount
  useEffect(() => {
    console.log("[Commentator] Mount: loading initial snapshot");
    if (!apiBase) {
      setSnapshotError("Set NEXT_PUBLIC_API_URL to use commentator feed.");
      return;
    }
    restoreSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount
  // Connect socket once after snapshot is loaded
  useEffect(() => {
    if (!apiBase || hasBootedRef.current) {
      return;
    }
    hasBootedRef.current = true;

    console.log("[Commentator] Booting socket with apiBase:", apiBase, "socketBase:", socketBase);

    const socket = io(socketBase, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Commentator] Socket connected:", socket.id);
      setIsConnected(true);
      socket.emit("subscribe_commentary_feed", { limit: FEED_LIMIT });
      console.log("[Commentator] Emitted subscribe_commentary_feed");
    });

    socket.on("disconnect", () => {
      console.log("[Commentator] Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("[Commentator] Socket connection error:", error);
    });

    socket.on(
      "commentary_feed_snapshot",
      (payload: { items?: TeamLogItem[] }) => {
        console.log("[Commentator] Received socket snapshot with", payload?.items?.length, "items");
        const items = sortNewestFirst(payload?.items || []);
        setFeed(items.slice(0, FEED_LIMIT));
        if (items[0]?.createdAt) {
          setLastEventAt(items[0].createdAt);
        }
      },
    );

    socket.on("commentary_feed_error", () => {
      console.error("[Commentator] Commentary feed error from server");
      setSnapshotError("Live snapshot failed. Using last known feed.");
    });

    socket.on("team_log_created", (entry: TeamLogItem) => {
      console.log("[Commentator] Raw event received:", {
        id: entry._id,
        title: entry.title,
        severity: entry.severity,
      });
      setLastEventAt(entry.createdAt);
      if (!isLive) {
        console.log("[Commentator] Live mode OFF, skipping event");
        return;
      }

      setFeed((current) => {
        console.log("[Commentator] setFeed called, current length:", current.length);

        if (current.some((item) => item._id === entry._id)) {
          console.log("[Commentator] Duplicate event, skipping:", entry._id);
          return current;
        }

        console.log("[Commentator] ✅ Adding new event:", entry.title);
        const next = [entry, ...current].slice(0, FEED_LIMIT);
        console.log("[Commentator] Feed now length:", next.length);
        return next;
      });
    });

    return () => {
      console.log("[Commentator] Cleaning up socket");
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [apiBase, socketBase, isLive]);

  const totalCritical = useMemo(
    () => feed.filter((item) => item.severity === "critical").length,
    [feed],
  );

  const totalHighlights = useMemo(
    () => feed.filter((item) => item.severity === "highlight").length,
    [feed],
  );

  // Debug: Log whenever feed state changes
  useEffect(() => {
    console.log("[Commentator] Feed state updated. Current feed length:", feed.length);
    if (feed.length > 0) {
      console.log("[Commentator] Latest event in feed:", {
        title: feed[0].title,
        severity: feed[0].severity,
        timestamp: feed[0].createdAt,
      });
    }
  }, [feed]);

  return (
    <section className="min-h-screen bg-slate-950 px-3 py-4 sm:px-4 sm:py-5">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header: Minimal and Compact */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GiRadioTower className="h-5 w-5 text-cyan-300" />
            <h1 className="text-lg font-bold text-cyan-100 uppercase tracking-tight">
              Live Feed
            </h1>
          </div>

          {/* Status & Counts - Compact Row */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-600/30 bg-black/40 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-400" : "bg-yellow-500"
                }`}
              />
              <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">
                {isConnected ? "Connected" : "Reconnecting"}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-600/30" />
            <span className="text-xs font-semibold text-cyan-300 whitespace-nowrap">
              {feed.length} Events
            </span>
            <span className="text-xs font-semibold text-amber-300 whitespace-nowrap">
              {totalHighlights} ⭐
            </span>
            <span className="text-xs font-semibold text-red-300 whitespace-nowrap">
              {totalCritical} 🔴
            </span>
          </div>
        </div>

        {/* Controls Bar - Minimal */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-600/30 bg-black/25 px-3 py-2">
          <div className="flex items-center gap-2">
            <GiElectric className="h-4 w-4 text-cyan-300" />
            <span className="text-xs font-semibold text-slate-300">
              {lastEventAt ? formatClock(lastEventAt) : "Waiting..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLive((prev) => !prev)}
              className="whitespace-nowrap rounded-md border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-bold text-cyan-200 transition-colors hover:border-cyan-500/60 hover:bg-cyan-950/50"
            >
              {isLive ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={restoreSnapshot}
              className="whitespace-nowrap rounded-md border border-amber-500/40 bg-amber-950/25 px-3 py-1.5 text-xs font-bold text-amber-200 transition-colors hover:border-amber-500/60 hover:bg-amber-950/40"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error Banner - Compact */}
        {snapshotError ? (
          <div className="mb-3 rounded-lg border border-red-500/40 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
            {snapshotError}
          </div>
        ) : null}

        {/* Feed Items - Minimal and Compact */}
        <div className="space-y-3">
          {feed.map((item) => (
            <article
              key={item._id}
              className={`rounded-lg border p-4 transition-all ${severityClass[item.severity]}`}
            >
              {/* Title + Time Row */}
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-md px-2 py-1 text-xs font-bold tracking-wide ${severityBadgeClass[item.severity]}`}
                  >
                    {item.severity.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-slate-100">
                    #{item.slot}
                  </span>
                  <span className="font-bold text-white text-sm">
                    {item.teamName}
                  </span>
                </div>
                <span className="whitespace-nowrap rounded-md bg-black/30 px-2 py-1 text-xs font-semibold text-slate-300">
                  {formatClock(item.createdAt)}
                </span>
              </div>

              {/* Title and Message */}
              <h2 className="mb-1 text-base font-bold text-white leading-snug break-words">
                {item.title}
              </h2>
              <p className="mb-3 text-sm text-slate-100 leading-relaxed break-words">
                {item.message}
              </p>

              {/* Stats Grid - Compact */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 mb-2">
                <div className="rounded-md bg-black/30 px-2 py-1.5 border border-slate-500/20">
                  <p className="text-xs opacity-70 font-semibold mb-0.5">Round</p>
                  <p className="text-sm font-bold text-slate-50">
                    {item.roundNumber ?? "-"}
                  </p>
                </div>
                <div className="rounded-md bg-black/30 px-2 py-1.5 border border-slate-500/20">
                  <p className="text-xs opacity-70 font-semibold mb-0.5">Total</p>
                  <p className="text-sm font-bold text-cyan-100">
                    {item.totals.totalPoints}
                  </p>
                </div>
                <div className="rounded-md bg-black/30 px-2 py-1.5 border border-slate-500/20">
                  <p className="text-xs opacity-70 font-semibold mb-0.5">Kills</p>
                  <p className="text-sm font-bold text-amber-100">
                    {item.totals.totalKillsInRound}
                  </p>
                </div>
                <div className="rounded-md bg-black/30 px-2 py-1.5 border border-slate-500/20">
                  <p className="text-xs opacity-70 font-semibold mb-0.5">Elim</p>
                  <p className="text-sm font-bold text-red-100">
                    {item.totals.eliminationCountInRound}
                  </p>
                </div>
                {item.totals.killPointsInRound > 0 && (
                  <div className="rounded-md bg-black/30 px-2 py-1.5 border border-slate-500/20">
                    <p className="text-xs opacity-70 font-semibold mb-0.5">K-Pts</p>
                    <p className="text-sm font-bold text-sky-100">
                      {item.totals.killPointsInRound}
                    </p>
                  </div>
                )}
                {item.totals.positionPointsInRound > 0 && (
                  <div className="rounded-md bg-black/30 px-2 py-1.5 border border-slate-500/20">
                    <p className="text-xs opacity-70 font-semibold mb-0.5">P-Pts</p>
                    <p className="text-sm font-bold text-emerald-100">
                      {item.totals.positionPointsInRound}
                    </p>
                  </div>
                )}
              </div>

              {/* Changes Inline - Minimal */}
              {item.changes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {item.changes.slice(0, 3).map((change) => (
                    <span
                      key={`${item._id}-${change.field}`}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-400/30 bg-black/25 px-2 py-0.5 text-xs font-semibold text-slate-200 break-words"
                    >
                      <GiTargeting className="h-3 w-3 text-cyan-300 flex-shrink-0" />
                      <span className="truncate">{change.field}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
