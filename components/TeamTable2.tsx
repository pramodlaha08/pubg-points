"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import SQUAD_CONFIG from "@/lib/squadConfig";

interface Team {
  _id: string;
  name: string;
  logo: string;
  slot: number;
  currentRound: number;
  totalPoints: number;
  rounds: {
    roundNumber: number;
    kills: number;
    killPoints: number;
    position: number;
    positionPoints: number;
    eliminationCount: number;
    eliminatedPlayers: number[];
    status: string;
  }[];
}

const trophyVariants = {
  initial: { rotate: 0, scale: 1, textShadow: "0 0 0px rgba(255, 165, 0, 0)" },
  animate: {
    rotate: [-5, 5, -5],
    scale: [1, 1.2, 1],
    textShadow: [
      "0 0 0px rgba(255, 165, 0, 0)",
      "0 0 10px rgba(255, 165, 0, 0.8)",
      "0 0 20px rgba(255, 230, 0, 0.9)",
      "0 0 10px rgba(255, 165, 0, 0.8)",
      "0 0 0px rgba(255, 165, 0, 0)"
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

interface AnimatedTeamTableProps {
  readonly showDebug?: boolean;
}

export default function AnimatedTeamTable({ showDebug }: AnimatedTeamTableProps) {
  // Use env var for debug mode, allow prop override
  const debugMode = showDebug !== undefined ? showDebug : process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  const [teams, setTeams] = useState<Team[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>("-");
  const [lastSyncAt, setLastSyncAt] = useState<string>("-");
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/team`
        );
        const data = response.data;

        if (data.success) {
          setTeams(
            data.data.sort((a: Team, b: Team) => b.totalPoints - a.totalPoints)
          );
          setLastSyncAt(new Date().toLocaleTimeString());
        }
      } catch  {
        console.error("Error fetching teams:");
      }
    };

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const socketBase = process.env.NEXT_PUBLIC_SOCKET_URL || apiBase.replace(/\/api\/v1\/?$/, "");

    let refreshTimer: NodeJS.Timeout | null = null;
    const scheduleRefresh = (source: string) => {
      setLastEvent(source);
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => {
        void fetchTeams();
        setUpdateCount((prev) => prev + 1);
        refreshTimer = null;
      }, 120);
    };

    const socket: Socket = io(socketBase, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      scheduleRefresh("connect");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("team_log_created", () => scheduleRefresh("team_log_created"));
    socket.on("team_created", () => scheduleRefresh("team_created"));
    socket.on("team_deleted", () => scheduleRefresh("team_deleted"));
    socket.on("round_created", () => scheduleRefresh("round_created"));
    socket.on("round_deleted", () => scheduleRefresh("round_deleted"));
    socket.on("positions_updated", () => scheduleRefresh("positions_updated"));
    socket.on("elimination_state_changed", () => scheduleRefresh("elimination_state_changed"));

    fetchTeams();

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div className="w-[360px] mx-auto">
        {debugMode ? (
          <div className="mb-2 rounded border border-white/30 bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
            <div>SOCKET: {isConnected ? "LIVE" : "OFFLINE"}</div>
            <div>LAST EVENT: {lastEvent}</div>
            <div>LAST SYNC: {lastSyncAt}</div>
            <div>UPDATES: {updateCount}</div>
          </div>
        ) : null}
        <div className="flex flex-col rounded-lg overflow-hidden">
          <div className="flex h-10 bg-gradient-to-r from-[#245aaa] to-[#b25c5c] text-gray-200 text-sm font-bold shadow-lg">
            <div className="w-10 flex items-center justify-center pl-3">RANK</div>
            <div className="flex-1 flex items-center justify-start pl-5">TEAM</div>
            <div className="w-16 flex items-center justify-center">ALIVE</div>
            <div className="w-12 flex items-center justify-center">PTS</div>
            <div className="w-12 flex items-center justify-center pr-2">ELIMS</div>
          </div>
          <div className="flex-1 overflow-hidden">
            <AnimatePresence>
              {teams.map((team, index) => {
                const currentRound = team.rounds.find(
                  (r) => r.roundNumber === team.currentRound
                );
                const isEliminated = (currentRound?.eliminationCount ?? 0) >= SQUAD_CONFIG.fullEliminationCount;

                return (
                  <motion.div
                    key={team._id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className={`flex h-10 border-b border-[#F36F21] text-sm shadow-md ${
                      isEliminated
                        ? "bg-[#cf606083] text-gray-950"
                        : "bg-gradient-to-r  from-[#235192d8] to-[#d45810ce] text-white"
                    }`}
                  >
                    <div className="w-10 flex items-center justify-center font-bold text-lg text-gray-100 relative">
                      {index === 0 ? (
                        <motion.span
                          className="relative z-10"
                          variants={trophyVariants}
                          initial="initial"
                          animate="animate"
                        >
                          🏆
                        </motion.span>
                      ) : (
                        `${index + 1}`
                      )}
                    </div>
                    <div className="flex-1 flex items-center space-x-2 pl-2">
                      <Image
                        src={team.logo || "/placeholder.svg"}
                        alt={team.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span
                        className={`${
                          isEliminated
                            ? "text-gray-950 font-bold"
                            : "text-gray-200 font-bold"
                        }`}
                      >
                        {team.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="w-16 flex items-center justify-center">
                      <div className="flex gap-1">
                        {SQUAD_CONFIG.playerIndices().map((playerIndex) => (
                          <div
                            key={playerIndex}
                            className={`h-4 w-[6px] ${
                              currentRound?.eliminatedPlayers?.includes(
                                playerIndex
                              )
                                ? "bg-red-600"
                                : "bg-[#245aaa]"
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`w-12 flex items-center justify-center font-bold ${
                        isEliminated ? "text-slate-950" : "text-gray-200"
                      }`}
                    >
                      {team.totalPoints}
                    </div>
                    <div
                      className={`w-12 flex items-center justify-center font-bold   ${
                        isEliminated ? "text-slate-950" : "text-[#ffffff]"
                      }`}
                    >
                      {currentRound?.kills ?? 0}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
