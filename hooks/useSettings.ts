"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import type { AppSettings } from "@/lib/tableSettings";

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<AppSettings>(
    "/settings",
    fetcher
  );

  return { settings: data, error, isLoading, refresh: mutate };
}
