"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import type { TeamLogEntry } from "@/types/team";

interface TeamLogResponse {
  items: TeamLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useTeamLogs(limit = 30, roundNumber?: number) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (roundNumber !== undefined) query.set("roundNumber", String(roundNumber));

  const { data, error, isLoading, mutate } = useSWR<TeamLogResponse>(
    `/team-log?${query.toString()}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  return {
    logs: data?.items ?? [],
    pagination: data?.pagination,
    error,
    isLoading,
    refresh: mutate,
  };
}
