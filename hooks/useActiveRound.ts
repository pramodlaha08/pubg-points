"use client";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { io } from "socket.io-client";
import { api, getApiTournamentId } from "@/lib/api";
import { fetcher } from "@/lib/swr";

interface ActiveRoundState {
  activeRound: number;
}

interface ActiveRoundEvent {
  tournamentId?: string;
  activeRound?: number;
}

export function useActiveRound() {
  const { data, error, isLoading, mutate } = useSWR<ActiveRoundState>(
    "/team/rounds/active",
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

    const onUpdate = (payload?: ActiveRoundEvent) => {
      if (scope && payload?.tournamentId && payload.tournamentId !== scope) {
        return;
      }
      void mutate();
    };

    socket.on("connect", () => {
      if (scope) socket.emit("join_tournament", scope);
    });
    socket.on("active_round_updated", onUpdate);

    return () => {
      socket.off("active_round_updated", onUpdate);
      socket.disconnect();
    };
  }, [mutate]);

  const setActiveRound = useCallback(
    async (roundNumber: number) => {
      const response = await api.put("/team/rounds/active", { roundNumber });
      const next =
        (response?.data?.data?.activeRound as number | undefined) ?? roundNumber;
      await mutate({ activeRound: next }, { revalidate: false });
      return next;
    },
    [mutate]
  );

  return {
    activeRound: data?.activeRound ?? 0,
    setActiveRound,
    error,
    isLoading,
    refresh: mutate,
  };
}
