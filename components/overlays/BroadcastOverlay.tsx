"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import useSWR from "swr";
import { io } from "socket.io-client";
import TeamTable from "@/components/TeamTable2";
import GamingEliminationNotification from "@/components/GamingEliminationNotification";
import {
  CountdownCard,
  KillFeedList,
  LowerThirdCard,
  WinnerCard,
  type WinnerTeam,
} from "@/components/overlays/BroadcastPanels";
import { useKillFeed } from "@/hooks/useKillFeed";
import { useSettings } from "@/hooks/useSettings";
import { useLiveTeams } from "@/hooks/useLiveTeams";
import { useActiveRound } from "@/hooks/useActiveRound";
import SQUAD_CONFIG from "@/lib/squadConfig";
import EditorialPointsTable from "@/components/overlays/EditorialPointsTable";
import FinalistCards from "@/components/overlays/FinalistCards";
import {
  EditorialCountdown,
  EditorialKillFeed,
  EditorialLowerThird,
  EditorialWinner,
} from "@/components/overlays/EditorialPanels";
import { fetcher } from "@/lib/swr";
import { getApiTournamentId } from "@/lib/api";
import {
  LAYOUT_LABELS,
  normalizeLayout,
} from "@/lib/broadcastLayout";
import { isEditorialTemplate, mergePointsTable } from "@/lib/tableSettings";
import type {
  BroadcastLayout,
  BroadcastLayoutEntry,
  BroadcastLayoutKey,
  BroadcastState,
} from "@/types/broadcast";

interface BroadcastOverlayProps {
  broadcast: BroadcastState;
  layout?: Partial<BroadcastLayout> | null;
  editing?: boolean;
  selectedKey?: BroadcastLayoutKey | null;
  onSelect?: (key: BroadcastLayoutKey) => void;
  onLayoutChange?: (layout: BroadcastLayout) => void;
  design?: "classic" | "editorial";
}

function LayoutBox({
  blockKey,
  entry,
  editing,
  selected,
  onSelect,
  onMove,
  children,
}: {
  blockKey: BroadcastLayoutKey;
  entry: BroadcastLayoutEntry;
  editing: boolean;
  selected: boolean;
  onSelect?: (key: BroadcastLayoutKey) => void;
  onMove?: (key: BroadcastLayoutKey, entry: BroadcastLayoutEntry) => void;
  children: ReactNode;
}) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
    blockWidth: number;
    blockHeight: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!editing || !onMove) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(blockKey);

    const canvas = event.currentTarget.closest(
      "[data-layout-canvas]"
    ) as HTMLElement | null;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const blockRect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: entry.x,
      originY: entry.y,
      width: rect.width,
      height: rect.height,
      blockWidth: blockRect.width,
      blockHeight: blockRect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = ((event.clientX - drag.startX) / drag.width) * 100;
    const dy = ((event.clientY - drag.startY) / drag.height) * 100;
    const maxX = Math.max(0, 100 - (56 / drag.width) * 100);
    const maxY = Math.max(0, 100 - (56 / drag.height) * 100);
    const nextX = Math.min(Math.max(0, drag.originX + dx), maxX);
    const nextY = Math.min(Math.max(0, drag.originY + dy), maxY);
    onMove?.(blockKey, {
      ...entry,
      x: Math.round(nextX * 100) / 100,
      y: Math.round(nextY * 100) / 100,
    });
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setDragging(false);
    }
  };

  return (
    <div
      className={
        editing
          ? `absolute select-none rounded-lg ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            } ${
              selected
                ? "z-30 outline outline-2 outline-amber-400"
                : "z-20 outline outline-1 outline-cyan-300/50 hover:outline-amber-300/80"
            }`
          : "pointer-events-none absolute"
      }
      data-layout-block={blockKey}
      style={{
        left: `${entry.x}%`,
        top: `${entry.y}%`,
        width: entry.width > 0 ? `${entry.width}%` : "auto",
        transform: `scale(${entry.scale / 100})`,
        transformOrigin: "top left",
        touchAction: editing ? "none" : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      {editing ? (
        <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-black/85 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300 shadow">
          {LAYOUT_LABELS[blockKey]}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export default function BroadcastOverlay({
  broadcast,
  layout,
  editing = false,
  selectedKey = null,
  onSelect,
  onLayoutChange,
  design = "classic",
}: BroadcastOverlayProps) {
  const editorial = design === "editorial";
  const activeLayout = normalizeLayout(layout ?? broadcast.layout);
  const { events } = useKillFeed();
  const {
    settings,
    isLoading: settingsLoading,
    refresh: refreshSettings,
  } = useSettings();
  const tableSettings = mergePointsTable(settings?.pointsTable);
  const { allTeams, isLoading: teamsLoading } = useLiveTeams();
  const { activeRound, isLoading: activeRoundLoading } = useActiveRound();
  const editorialTable =
    editorial &&
    isEditorialTemplate(tableSettings.layout.template);
  const roundNumber = activeRound || allTeams[0]?.currentRound || 0;
  const roundTeams = roundNumber
    ? allTeams.filter((team) =>
        team.rounds.some((round) => round.roundNumber === roundNumber)
      )
    : allTeams;
  const finalists = roundTeams.filter((team) => {
    const round = team.rounds.find(
      (item) => item.roundNumber === roundNumber
    );
    return (
      (round?.eliminationCount ?? 0) < SQUAD_CONFIG.fullEliminationCount
    );
  });
  const finalStage =
    roundTeams.length > 5 && finalists.length > 0 && finalists.length <= 5;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const socketBase =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/v1\/?$/, "");
    if (!socketBase) return;

    const scope = getApiTournamentId();
    const socket = io(socketBase, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
    });

    const onSettings = () => void refreshSettings();
    socket.on("connect", () => {
      if (scope) socket.emit("join_tournament", scope);
    });
    socket.on("settings_updated", onSettings);

    return () => {
      socket.off("settings_updated", onSettings);
      socket.disconnect();
    };
  }, [refreshSettings]);

  const shouldFetchWinnerTeam =
    Boolean(broadcast.winner?.teamId) &&
    (Boolean(broadcast.winner?.visible) || editing);
  const { data: teams } = useSWR<WinnerTeam[]>(
    shouldFetchWinnerTeam ? "/team" : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const winnerTeam =
    teams?.find((team) => team._id === broadcast.winner?.teamId) ?? null;
  const winnerTeamsLoading = shouldFetchWinnerTeam && !teams;
  const overlayLoading =
    !editing &&
    (settingsLoading ||
      teamsLoading ||
      activeRoundLoading ||
      winnerTeamsLoading);

  if (overlayLoading) {
    return (
      <main className="broadcast-page fixed inset-0 h-screen w-full overflow-hidden" />
    );
  }

  const pointsVisible = broadcast.overlays.pointsTable !== false;
  const killFeedVisible = broadcast.overlays.killFeed !== false;
  const move = (key: BroadcastLayoutKey, entry: BroadcastLayoutEntry) => {
    onLayoutChange?.({ ...activeLayout, [key]: entry });
  };

  return (
    <main
      className={
        editing
          ? `relative h-full w-full overflow-hidden ${
              editorial ? "bg-[#0B0D10]" : "bg-[#08111f]"
            }`
          : "broadcast-page fixed inset-0 h-screen w-full overflow-hidden"
      }
      data-layout-canvas={editing ? "true" : undefined}
    >
      {finalStage ? (
        finalists.length > 1 ? (
          <FinalistCards
            teams={finalists}
            roundNumber={roundNumber}
            previewSettings={tableSettings}
          />
        ) : null
      ) : pointsVisible || editing ? (
        <LayoutBox
          blockKey="pointsTable"
          entry={activeLayout.pointsTable}
          editing={editing}
          selected={selectedKey === "pointsTable"}
          onSelect={onSelect}
          onMove={move}
        >
          {editorialTable ? (
            <EditorialPointsTable
              fitToHeight={!editing}
              topPercent={activeLayout.pointsTable.y}
              scalePercent={activeLayout.pointsTable.scale}
            />
          ) : (
            <div className="w-fit rounded-lg p-2 shadow-2xl backdrop-blur-sm">
              <TeamTable themeColor="" fitToHeight={!editing} />
            </div>
          )}
        </LayoutBox>
      ) : null}

      {killFeedVisible || editing ? (
        <LayoutBox
          blockKey="killFeed"
          entry={activeLayout.killFeed}
          editing={editing}
          selected={selectedKey === "killFeed"}
          onSelect={onSelect}
          onMove={move}
        >
          {editorial ? (
            <EditorialKillFeed
              events={events}
              now={now}
              preview={editing}
              previewSettings={tableSettings}
            />
          ) : (
            <KillFeedList events={events} now={now} preview={editing} />
          )}
        </LayoutBox>
      ) : null}

      {!finalStage && (broadcast.overlays.notification !== false || editing) ? (
        <LayoutBox
          blockKey="notification"
          entry={activeLayout.notification}
          editing={editing}
          selected={selectedKey === "notification"}
          onSelect={onSelect}
          onMove={move}
        >
          <GamingEliminationNotification
            previewSettings={tableSettings}
            preview={editing}
            inline
          />
        </LayoutBox>
      ) : null}

      {broadcast.lowerThird?.visible || editing ? (
        <LayoutBox
          blockKey="lowerThird"
          entry={activeLayout.lowerThird}
          editing={editing}
          selected={selectedKey === "lowerThird"}
          onSelect={onSelect}
          onMove={move}
        >
          {editorial ? (
            <EditorialLowerThird
              state={broadcast.lowerThird}
              preview={editing}
              previewSettings={tableSettings}
              variant={tableSettings.cards.lowerThird}
            />
          ) : (
            <LowerThirdCard state={broadcast.lowerThird} preview={editing} />
          )}
        </LayoutBox>
      ) : null}

      {broadcast.countdown?.visible || editing ? (
        <LayoutBox
          blockKey="countdown"
          entry={activeLayout.countdown}
          editing={editing}
          selected={selectedKey === "countdown"}
          onSelect={onSelect}
          onMove={move}
        >
          {editorial ? (
            <EditorialCountdown
              state={broadcast.countdown}
              serverTime={broadcast.serverTime}
              preview={editing}
              previewSettings={tableSettings}
              variant={tableSettings.cards.countdown}
            />
          ) : (
            <CountdownCard
              state={broadcast.countdown}
              serverTime={broadcast.serverTime}
              preview={editing}
            />
          )}
        </LayoutBox>
      ) : null}

      {broadcast.winner?.visible || editing ? (
        <LayoutBox
          blockKey="winner"
          entry={activeLayout.winner}
          editing={editing}
          selected={selectedKey === "winner"}
          onSelect={onSelect}
          onMove={move}
        >
          {editorial ? (
            <EditorialWinner
              winner={broadcast.winner}
              team={winnerTeam}
              preview={editing}
              previewSettings={tableSettings}
              variant={tableSettings.cards.winner}
            />
          ) : (
            <WinnerCard
              winner={broadcast.winner}
              team={winnerTeam}
              preview={editing}
            />
          )}
        </LayoutBox>
      ) : null}
    </main>
  );
}
