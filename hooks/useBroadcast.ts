"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { io } from "socket.io-client";
import { getApiTournamentId } from "@/lib/api";
import { fetcher } from "@/lib/swr";
import type { BroadcastState } from "@/types/broadcast";

export function useBroadcast() {
  const { data, error, isLoading, mutate } = useSWR<BroadcastState>(
    "/broadcast",
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

    const onUpdate = (payload: BroadcastState) => {
      if (scope && payload?.tournamentId && payload.tournamentId !== scope) {
        return;
      }
      mutate(payload, false);
    };

    socket.on("connect", () => {
      if (scope) socket.emit("join_tournament", scope);
    });
    socket.on("broadcast_updated", onUpdate);

    return () => {
      socket.off("broadcast_updated", onUpdate);
      socket.disconnect();
    };
  }, [mutate]);

  return { broadcast: data, error, isLoading, refresh: mutate };
}
