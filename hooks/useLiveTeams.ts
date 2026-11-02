"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { io } from "socket.io-client";
import { getApiTournamentId } from "@/lib/api";
import { fetcher } from "@/lib/swr";
import type { Team } from "@/types/team";

type LiveTeam = Team & { absent?: boolean };

export function useLiveTeams() {
  const { data, isLoading, mutate } = useSWR<LiveTeam[]>("/team", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
  });

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

    const refresh = () => {
      void mutate();
    };

    const applyTeam = (updated: LiveTeam) => {
      if (!updated?._id) return;
      void mutate(
        (current) => {
          if (!current) return current;
          if (updated.absent) {
            return current.filter((team) => team._id !== updated._id);
          }
          return current.map((team) =>
            team._id === updated._id ? { ...team, ...updated } : team
          );
        },
        false
      );
    };

    socket.on("connect", () => {
      if (scope) socket.emit("join_tournament", scope);
      refresh();
    });
    socket.on("team_updated", applyTeam);
    socket.on("team_created", refresh);
    socket.on("team_deleted", refresh);
    socket.on("team_log_created", refresh);
    socket.on("round_created", refresh);
    socket.on("round_deleted", refresh);
    socket.on("positions_updated", refresh);
    socket.on("elimination_state_changed", refresh);

    return () => {
      socket.off("team_updated", applyTeam);
      socket.off("team_created", refresh);
      socket.off("team_deleted", refresh);
      socket.off("team_log_created", refresh);
      socket.off("round_created", refresh);
      socket.off("round_deleted", refresh);
      socket.off("positions_updated", refresh);
      socket.off("elimination_state_changed", refresh);
      socket.disconnect();
    };
  }, [mutate]);

  return {
    teams: (data ?? []).filter((team) => !team.absent),
    isLoading,
    refresh: mutate,
  };
}
