"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/utils/ToastifyNotification";

type DeleteDataButtonProps = {
  roundNumber?: number;
  allData?: boolean;
  onCleared: () => void;
};

export function DeleteDataButton({
  roundNumber,
  allData = false,
  onCleared,
}: DeleteDataButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    const message = allData
      ? "Delete ALL auto-scoring data for this tournament?\n\nThis removes every round's player mappings, learned player-to-team memory, and saved verification history. Live leaderboard scores are NOT affected.\n\nThis cannot be undone."
      : `Delete auto-scoring data for round ${roundNumber}?\n\nThis removes that round's player mapping and saved verification history. Live leaderboard scores are NOT affected.`;
    if (!window.confirm(message)) return;

    setBusy(true);
    try {
      const response = await api.delete("/match/data", {
        data: allData ? {} : { roundNumber },
      });
      const deleted = response.data?.data ?? {};
      const count =
        (deleted.rosters ?? 0) +
        (deleted.verifications ?? 0) +
        (deleted.aliases ?? 0);
      notifySuccess(
        allData
          ? `All auto-scoring data deleted (${count} record(s)).`
          : `Round ${roundNumber} data deleted (${count} record(s)).`
      );
      onCleared();
    } catch (error) {
      notifyError(
        (isAxiosError(error)
          ? (error.response?.data?.message as string | undefined)
          : undefined) || "Could not delete the data"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={allData ? "danger" : "outline"}
      onClick={handleClick}
      disabled={busy || (!allData && !roundNumber)}
      className={
        allData ? undefined : "text-red-600 hover:bg-red-500/10 dark:text-red-400"
      }
    >
      <Trash2 className="h-4 w-4" />
      {busy ? "Deleting..." : allData ? "Delete all data" : "Delete this round"}
    </Button>
  );
}
