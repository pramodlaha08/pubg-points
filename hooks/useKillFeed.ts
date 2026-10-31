"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { io } from "socket.io-client";
import { getApiTournamentId } from "@/lib/api";
import { fetcher } from "@/lib/swr";

const KILL_EVENT_TYPES = new Set([
  "KILL_ADDED",
  "KILL_UPDATED",
  "KILL_DECREASED",
]);

interface TeamLogFeedItem {
  _id: string;
  tournamentId?: string;
  eventType: string;
  teamName?: string;
  roundNumber?: number | null;
  changes?: {
    field: string;
    previous?: number | null;
    current?: number | null;
    delta?: number | null;
  }[];
  totals?: { totalKillsInRound?: number };
  revertedAt?: string | null;
  createdAt: string;
}

export interface KillFeedEvent {
  id: string;
  teamName: string;
  roundNumber: number | null;
  delta: number;
  kills: number | null;
  at: string;
}

const toEvent = (log: TeamLogFeedItem): KillFeedEvent | null => {
  if (!KILL_EVENT_TYPES.has(log.eventType) || log.revertedAt) return null;
  const change = log.changes?.find((item) => item.field === "round.kills");
  const previous = Number(change?.previous);
  const current = Number(change?.current);
  const delta = Number.isFinite(Number(change?.delta))
    ? Number(change?.delta)
    : Number.isFinite(previous) && Number.isFinite(current)
      ? current - previous
      : 0;
  return {
    id: log._id,
    teamName: log.teamName || "Unknown team",
    roundNumber: log.roundNumber ?? null,
    delta,
    kills: Number.isFinite(current)
      ? current
      : Number.isFinite(Number(log.totals?.totalKillsInRound))
        ? Number(log.totals?.totalKillsInRound)
        : null,
    at: log.createdAt,
  };
};

export function useKillFeed() {
  const { data, mutate } = useSWR<TeamLogFeedItem[]>(
    "/team-log/feed?limit=40",
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  useEffect(() => {
    const socketBase =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/v1\/?$/, "");
    if (!socketBase) return;

    const scope = getApiTournamentId();
    const socket = io(socketBase, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
    });

    const onLog = (payload?: TeamLogFeedItem) => {
      if (scope && payload?.tournamentId && payload.tournamentId !== scope) {
        return;
      }
      void mutate();
    };

    socket.on("connect", () => {
      if (scope) socket.emit("join_tournament", scope);
    });
    socket.on("team_log_created", onLog);

    return () => {
      socket.off("team_log_created", onLog);
      socket.disconnect();
    };
  }, [mutate]);

  const events = (data || [])
    .map(toEvent)
    .filter((event): event is KillFeedEvent => Boolean(event));

  return { events };
}
