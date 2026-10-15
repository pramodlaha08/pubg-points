"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { CheckCircle2, Network, Plus, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useTeams } from "@/hooks/useTeams";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";
import { PlayerMappingBoard, toLobbyRow, uid, type LobbyRow } from "@/components/admin/PlayerMappingBoard";
import { DeleteDataButton } from "@/components/admin/DeleteDataButton";
import type { SavedRosterPlayer } from "@/types/verify";

const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error)
    ? (error.response?.data?.message as string | undefined)
    : undefined) || fallback;

export default function PlayerMappingPage() {
  const { teams } = useTeams();
  const [roundNumber, setRoundNumber] = useState("1");
  const [rows, setRows] = useState<LobbyRow[]>([]);
  const [imageHash, setImageHash] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const round = Number(roundNumber) || 0;

  const resetAll = () => {
    setRows([]);
    setImageHash("");
    setRawText("");
  };

  useEffect(() => {
    const roundNum = Number(roundNumber);
    if (!Number.isInteger(roundNum) || roundNum < 1) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const response = await api.get("/match/roster", {
          params: { roundNumber: roundNum },
        });
        if (cancelled) return;
        const players: SavedRosterPlayer[] =
          response.data?.data?.roster?.players ?? [];
        setRows(
          players.map((player) =>
            toLobbyRow({
              name: player.name,
              slot: player.slot,
              status: player.teamId ? "matched" : "unmatched",
              teamId: player.teamId,
              confidence: player.teamId ? 1 : 0,
              source: "saved",
              origin: "existing",
            })
          )
        );
        setImageHash(response.data?.data?.roster?.imageHash ?? "");
        setRawText(response.data?.data?.roster?.rawText ?? "");
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roundNumber]);

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        key: uid(),
        name: "",
        slot: "",
        teamId: "",
        status: "unmatched",
        confidence: 0,
        source: "fuzzy",
        suggestion: null,
        origin: "new",
      },
    ]);

  const handleSave = async () => {
    const players = rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        slot: row.slot === "" ? null : Number(row.slot),
        teamId: row.teamId || null,
      }));
    if (!players.length) {
      return notifyError("No players to save");
    }
    setSaving(true);
    try {
      await api.post("/match/roster", {
        roundNumber: round,
        players,
        imageHash,
        rawText,
      });
      notifySuccess(`Saved ${players.length} player mapping(s) for round ${round}.`);
    } catch (error) {
      notifyError(errorMessage(error, "Could not save the mapping"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Player Mapping"
        description="Control which players are assigned to each team for a round"
        actions={
          <>
            <DeleteDataButton allData onCleared={resetAll} />
            <Link href="/admin/verify">
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
                Auto Scoring
              </Button>
            </Link>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
              Match / Round number
            </label>
            <Input
              type="number"
              min={1}
              value={roundNumber}
              onChange={(event) => setRoundNumber(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-4 w-4" />
              Add row
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "Saving..." : "Save mapping"}
            </Button>
            <DeleteDataButton roundNumber={round} onCleared={resetAll} />
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 ? (
        <PlayerMappingBoard rows={rows} setRows={setRows} teams={teams} />
      ) : (
        <Card>
          <CardContent>
            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--adm-muted)]">
                Loading mapping…
              </p>
            ) : (
              <EmptyState
                icon={Network}
                title="No players mapped for this round"
                description="Register players from a lobby screenshot in Auto Scoring, or add rows manually to build the mapping."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
