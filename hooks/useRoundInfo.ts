"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import type { RoundInfo } from "@/types/roundInfo";

export function useRoundInfo() {
  const { data, error, isLoading, mutate } = useSWR<RoundInfo[]>(
    "/roundinfo",
    fetcher
  );

  const mapByRound = useMemo(() => {
    const map: Record<number, string> = {};
    for (const item of data ?? []) {
      if (item.mapName) map[item.roundNumber] = item.mapName;
    }
    return map;
  }, [data]);

  return {
    roundInfo: data ?? [],
    mapByRound,
    error,
    isLoading,
    refresh: mutate,
  };
}
