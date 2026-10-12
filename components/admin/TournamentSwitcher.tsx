"use client";

import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useTournament } from "@/components/providers/TournamentProvider";

export default function TournamentSwitcher() {
  const router = useRouter();
  const { tournaments, tournamentId, setTournamentId, isLoading } =
    useTournament();

  if (isLoading && tournaments.length === 0) {
    return (
      <div className="hidden h-10 w-40 animate-pulse rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface-2)] sm:block" />
    );
  }

  if (tournaments.length === 0) {
    return (
      <button
        type="button"
        onClick={() => router.push("/admin/tournaments")}
        className="hidden items-center gap-2 rounded-lg border border-[var(--adm-border)] px-3 py-2 text-sm text-[var(--adm-muted)] hover:bg-[var(--adm-surface-2)] sm:flex"
      >
        <Trophy className="h-4 w-4" />
        Create tournament
      </button>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Trophy className="h-4 w-4 text-[var(--adm-muted)]" />
      <Select
        aria-label="Select tournament"
        className="h-10 w-52"
        value={tournamentId ?? ""}
        onChange={(event) => {
          if (event.target.value) setTournamentId(event.target.value);
        }}
      >
        {tournaments.map((tournament) => (
          <option key={tournament._id} value={tournament._id}>
            {tournament.name}
            {tournament.season ? ` · ${tournament.season}` : ""}
            {tournament.isDefault ? " (default)" : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}
