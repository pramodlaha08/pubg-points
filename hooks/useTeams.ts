"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import type { Team } from "@/types/team";

export function useTeams(refreshInterval = 0) {
  const { data, error, isLoading, mutate } = useSWR<Team[]>("/team", fetcher, {
    refreshInterval,
  });

  return { teams: data ?? [], error, isLoading, refresh: mutate };
}
