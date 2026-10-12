"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { mutate as globalMutate } from "swr";
import { api, setApiTournamentId, TOURNAMENT_STORAGE_KEY } from "@/lib/api";
import type { Tournament } from "@/types/tournament";

interface TournamentContextValue {
  tournaments: Tournament[];
  tournamentId: string | null;
  activeTournament: Tournament | null;
  isLoading: boolean;
  setTournamentId: (id: string) => void;
  refresh: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextValue>({
  tournaments: [],
  tournamentId: null,
  activeTournament: null,
  isLoading: true,
  setTournamentId: () => {},
  refresh: async () => {},
});

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await api.get("/tournaments");
      const list: Tournament[] = response.data?.data ?? [];
      setTournaments(list);

      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(TOURNAMENT_STORAGE_KEY)
          : null;
      const storedValid = stored && list.some((t) => t._id === stored);
      const storedInvalid = Boolean(stored) && !storedValid;
      const fallback =
        list.find((t) => t.isDefault)?._id ?? list[0]?._id ?? null;
      const next = storedValid ? (stored as string) : fallback;

      setTournamentIdState(next);
      setApiTournamentId(next);
      if (next && typeof window !== "undefined") {
        window.localStorage.setItem(TOURNAMENT_STORAGE_KEY, next);
      }
      // A stale stored id would have made the initial requests 404; revalidate
      // every resource once we've resolved the correct fallback tournament.
      if (storedInvalid) {
        void globalMutate(() => true, undefined, { revalidate: true });
      }
    } catch {
      // Leave provider in a safe empty state; requests fall back to default.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setTournamentId = useCallback((id: string) => {
    setTournamentIdState(id);
    setApiTournamentId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOURNAMENT_STORAGE_KEY, id);
    }
    // Revalidate every SWR resource so all views reflect the new tournament.
    void globalMutate(() => true, undefined, { revalidate: true });
  }, []);

  const activeTournament = useMemo(
    () => tournaments.find((t) => t._id === tournamentId) ?? null,
    [tournaments, tournamentId]
  );

  const value = useMemo<TournamentContextValue>(
    () => ({
      tournaments,
      tournamentId,
      activeTournament,
      isLoading,
      setTournamentId,
      refresh: load,
    }),
    [tournaments, tournamentId, activeTournament, isLoading, setTournamentId, load]
  );

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  return useContext(TournamentContext);
}
