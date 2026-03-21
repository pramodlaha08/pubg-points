"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  GiCrossedSabres,
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
    <section className="min-h-screen bg-slate-950 px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-slate-950 via-[#091225] to-slate-900 p-5 shadow-[0_0_50px_rgba(34,211,238,0.15)] sm:p-7 lg:p-8">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 className="flex items-center gap-3 text-[clamp(2rem,3vw,3.2rem)] font-black uppercase tracking-wide text-cyan-100">
              <GiRadioTower className="flex-shrink-0 text-cyan-300" />
              Live Commentator Feed
            </h1>
            <p className="mt-2 text-[clamp(1.05rem,1.5vw,1.5rem)] font-semibold text-slate-200">
              Instant match stories: points gained, losses, kills, eliminations, and placement swings.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-300/40 bg-emerald-900/25 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase text-emerald-100">Status</p>
              <p className="mt-1 text-lg font-extrabold text-emerald-200">
                {isConnected ? "Connected" : "Reconnecting"}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-300/40 bg-cyan-900/20 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase text-cyan-100">Events</p>
              <p className="mt-1 text-lg font-extrabold text-cyan-100">
                {feed.length}
              </p>
            </div>
            <div className="rounded-xl border border-amber-300/50 bg-amber-950/30 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase text-amber-100">Highlights</p>
              <p className="mt-1 text-lg font-extrabold text-amber-100">
                {totalHighlights}
              </p>
            </div>
            <div className="rounded-xl border border-red-300/60 bg-red-950/35 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase text-red-100">Critical</p>
              <p className="mt-1 text-lg font-extrabold text-red-100">
                {totalCritical}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-col items-stretch justify-between gap-4 rounded-xl border border-slate-500/40 bg-black/25 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-[clamp(1rem,1.2vw,1.2rem)] font-semibold text-slate-100">
            <GiElectric className="flex-shrink-0 text-cyan-300" />
            <span>
              Last Event:{" "}
              <span className="font-bold text-cyan-100">
                {lastEventAt ? formatClock(lastEventAt) : "Waiting..."}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLive((prev) => !prev)}
              className="rounded-lg border border-cyan-300/40 bg-cyan-950/30 px-5 py-2 text-xs font-bold uppercase tracking-wide text-cyan-100 transition-colors hover:border-cyan-300/60 hover:bg-cyan-950/50"
            >
              {isLive ? "Pause Live" : "Resume Live"}
            </button>
            <button
              type="button"
              onClick={restoreSnapshot}
              className="rounded-lg border border-amber-300/50 bg-amber-950/35 px-5 py-2 text-xs font-bold uppercase tracking-wide text-amber-100 transition-colors hover:border-amber-300/70 hover:bg-amber-950/50"
            >
              Refresh Snapshot
            </button>
          </div>
        </div>

        {snapshotError ? (
          <div className="mb-4 rounded-xl border border-red-300/60 bg-red-950/40 px-4 py-3 text-lg font-semibold text-red-100">
            {snapshotError}
          </div>
        ) : null}

        <div className="space-y-4">
          {feed.map((item) => (
            <article
              key={item._id}
              className={`rounded-2xl border p-5 sm:p-6 lg:p-7 ${severityClass[item.severity]} transition-all hover:shadow-lg`}
            >
              <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-wider ${severityBadgeClass[item.severity]}`}
                  >
                    {item.severity}
                  </span>
                  <span className="font-bold text-slate-100 text-[clamp(1rem,1.2vw,1.2rem)]">#{item.slot}</span>
                  <span className="font-bold text-slate-200 text-[clamp(1.05rem,1.3vw,1.3rem)]">{item.teamName}</span>
                </div>
                <div className="whitespace-nowrap rounded-lg bg-black/20 px-3 py-1 text-sm font-semibold text-slate-300">
                  {formatClock(item.createdAt)}
                </div>
              </div>

              <h2 className="text-[clamp(1.35rem,2vw,2.1rem)] font-extrabold leading-tight text-white mb-2">
                {item.title}
              </h2>
              <p className="text-[clamp(1.1rem,1.5vw,1.6rem)] font-semibold leading-relaxed text-slate-50 mb-4">
                {item.message}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 mb-4">
                <div className="rounded-lg bg-black/25 px-3 py-3 text-slate-100 border border-slate-500/20 hover:border-slate-500/40 transition-colors">
                  <p className="text-xs font-semibold opacity-75 uppercase mb-1">Round</p>
                  <p className="text-lg font-extrabold text-slate-50">
                    {item.roundNumber ?? "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-black/25 px-3 py-3 text-slate-100 border border-slate-500/20 hover:border-slate-500/40 transition-colors">
                  <p className="text-xs font-semibold opacity-75 uppercase mb-1">Total Pts</p>
                  <p className="text-lg font-extrabold text-cyan-100">
                    {item.totals.totalPoints}
                  </p>
                </div>
                <div className="rounded-lg bg-black/25 px-3 py-3 text-slate-100 border border-slate-500/20 hover:border-slate-500/40 transition-colors">
                  <p className="text-xs font-semibold opacity-75 uppercase mb-1">Kills</p>
                  <p className="text-lg font-extrabold text-amber-100">
                    {item.totals.totalKillsInRound}
                  </p>
                </div>
                <div className="rounded-lg bg-black/25 px-3 py-3 text-slate-100 border border-slate-500/20 hover:border-slate-500/40 transition-colors">
                  <p className="text-xs font-semibold opacity-75 uppercase mb-1">Elims</p>
                  <p className="text-lg font-extrabold text-red-100">
                    {item.totals.eliminationCountInRound}
                  </p>
                </div>
                {item.totals.killPointsInRound > 0 && (
                  <div className="rounded-lg bg-black/25 px-3 py-3 text-slate-100 border border-slate-500/20 hover:border-slate-500/40 transition-colors">
                    <p className="text-xs font-semibold opacity-75 uppercase mb-1">Kill Pts</p>
                    <p className="text-lg font-extrabold text-sky-100">
                      {item.totals.killPointsInRound}
                    </p>
                  </div>
                )}
                {item.totals.positionPointsInRound > 0 && (
                  <div className="rounded-lg bg-black/25 px-3 py-3 text-slate-100 border border-slate-500/20 hover:border-slate-500/40 transition-colors">
                    <p className="text-xs font-semibold opacity-75 uppercase mb-1">Pos Pts</p>
                    <p className="text-lg font-extrabold text-emerald-100">
                      {item.totals.positionPointsInRound}
                    </p>
                  </div>
                )}
              </div>

              {item.changes.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {item.changes.slice(0, 6).map((change) => (
                    <span
                      key={`${item._id}-${change.field}`}
                      className="rounded-md border border-slate-400/40 bg-black/30 px-3 py-1.5 text-sm font-semibold text-slate-100 hover:border-slate-400/60 transition-colors"
                    >
                      <GiTargeting className="mr-1 inline-block text-cyan-300" />
                      {change.field}
                      {typeof change.delta === "number"
                        ? ` (${change.delta > 0 ? "+" : ""}${change.delta})`
                        : ""}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {feed.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-cyan-300/30 bg-cyan-950/20 p-8 text-center">
            <p className="text-[clamp(1.2rem,1.8vw,1.8rem)] font-bold text-cyan-100">
              Waiting for first commentary event...
            </p>
            <p className="mt-2 text-sm text-cyan-200">
              Live updates will appear here as events happen
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <GiCrossedSabres className="flex-shrink-0 text-cyan-300" />
          <span>Use this page on tablet/desktop in landscape for maximum readability from distance.</span>
        </div>
      </div>
    </section>
  );
}
