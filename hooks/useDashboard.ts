"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import type { DashboardStats } from "@/types/team";

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    "/dashboard",
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: true }
  );

  return { stats: data, error, isLoading, refresh: mutate };
}
