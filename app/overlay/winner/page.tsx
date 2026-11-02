"use client";

import useSWR from "swr";
import { useBroadcast } from "@/hooks/useBroadcast";
import { fetcher } from "@/lib/swr";
import { EditorialWinner } from "@/components/overlays/EditorialPanels";
import type { WinnerTeam } from "@/components/overlays/BroadcastPanels";

export default function WinnerOverlay() {
  const { broadcast } = useBroadcast();
  const winner = broadcast?.winner;
  const { data: teams } = useSWR<WinnerTeam[]>(
    winner?.visible ? "/team" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const team = teams?.find((item) => item._id === winner?.teamId) ?? null;

  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
      <div className="w-[min(1075px,86vw)]">
        <EditorialWinner winner={winner} team={team} />
      </div>
    </div>
  );
}
