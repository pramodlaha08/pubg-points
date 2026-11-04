"use client";

import { useCallback, useEffect, useRef } from "react";

type TeamMutationTeam = {
  _id: string;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const getErrorStatus = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return typeof status === "number" ? status : undefined;
};

export function useTeamMutationQueue<TTeam extends TeamMutationTeam>(
  onTeamSettled: (team: TTeam) => void,
) {
  const queuesRef = useRef<
    Record<string, Array<() => Promise<TTeam | undefined>>>
  >({});
  const drainingRef = useRef<Record<string, boolean>>({});
  const onTeamSettledRef = useRef(onTeamSettled);

  useEffect(() => {
    onTeamSettledRef.current = onTeamSettled;
  }, [onTeamSettled]);

  const drain = useCallback(async (teamId: string) => {
    if (drainingRef.current[teamId]) return;
    drainingRef.current[teamId] = true;
    let latestTeam: TTeam | undefined;
    let failures = 0;
    let aborted = false;

    try {
      while ((queuesRef.current[teamId]?.length ?? 0) > 0) {
        const task = queuesRef.current[teamId][0];
        try {
          const updatedTeam = await task();
          if (updatedTeam) latestTeam = updatedTeam;
          queuesRef.current[teamId].shift();
          failures = 0;
        } catch (error) {
          const status = getErrorStatus(error);
          if (status === 401 || status === 403) {
            queuesRef.current[teamId] = [];
            aborted = true;
            break;
          }
          failures += 1;
          const delay = Math.min(
            15000,
            750 * 2 ** Math.min(failures - 1, 5),
          );
          await wait(delay);
        }
      }
    } finally {
      drainingRef.current[teamId] = false;
    }

    if (latestTeam && !aborted) {
      onTeamSettledRef.current(latestTeam);
    }
  }, []);

  const enqueue = useCallback(
    (teamId: string, task: () => Promise<TTeam | undefined>) => {
      queuesRef.current[teamId] = [
        ...(queuesRef.current[teamId] ?? []),
        task,
      ];
      void drain(teamId);
    },
    [drain],
  );

  return enqueue;
}
