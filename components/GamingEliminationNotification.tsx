"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import axios from "axios";

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
    _id: string;
  }[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface EliminationNotification {
  teamId: string;
  teamName: string;
  teamLogo: string;
  roundNumber: number;
  position: number;
  killCount: number;
  eliminationOrder: number;
}

export default function GamingEliminationNotification() {
  const [currentNotification, setCurrentNotification] =
    useState<EliminationNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<
    EliminationNotification[]
  >([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);
  const pendingDisplayRef = useRef<Set<string>>(new Set()); // Track teams being marked as displayed

  // Safety mechanism: force clear notification after max time
  useEffect(() => {
    if (currentNotification) {
      const safetyTimer = setTimeout(() => {
        console.warn(
          `Safety timeout triggered - force clearing notification for ${currentNotification.teamName}`,
        );
        setCurrentNotification(null);
        processingRef.current = false;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }, 5000); // 5 seconds as safety net

      return () => clearTimeout(safetyTimer);
    }
  }, [currentNotification]);

  useEffect(() => {
    // Poll for new eliminations every 2 seconds
    const checkEliminations = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/team`,
        );
        const teams: Team[] = response.data.data || [];

        // Count total teams and alive teams
        const totalTeams = teams.length;
        const aliveTeams = teams.filter((team) => {
          const currentRound = team.rounds.find(
            (r) => r.roundNumber === team.currentRound,
          );
          return currentRound && currentRound.status === "alive";
        });

        // Find teams that are eliminated but not yet displayed
        const eliminatedTeams = teams.filter((team) => {
          const currentRound = team.rounds.find(
            (r) => r.roundNumber === team.currentRound,
          );
          return currentRound && currentRound.status === "eliminated";
        });

        // Check each eliminated team in backend tracking
        for (const team of eliminatedTeams) {
          try {
            const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/elimination/check/${team._id}/${team.currentRound}`;
            console.log(
              `🔍 Checking: ${team.name} (Round ${team.currentRound})`,
            );

            const trackResponse = await axios.get(checkUrl);

            const { displayed, tracked } = trackResponse.data.data;
            console.log(
              `📊 Backend response for ${team.name}: displayed=${displayed}, tracked=${tracked}`,
            );

            const notificationKey = `${team._id}-${team.currentRound}`;

            // Skip if already pending display or in queue
            if (pendingDisplayRef.current.has(notificationKey)) {
              console.log(`⏭️ Skipping ${team.name} - already pending`);
              continue;
            }

            // If not tracked yet, create the tracking record first
            if (!tracked) {
              console.log(`📝 Creating tracking record for ${team.name}...`);
              const currentRound = team.rounds.find(
                (r) => r.roundNumber === team.currentRound,
              );

              await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/elimination/track`,
                {
                  teamId: team._id,
                  teamName: team.name,
                  roundNumber: team.currentRound,
                  status: "eliminated",
                  eliminationOrder: aliveTeams.length + 1,
                  killCount: currentRound?.kills || 0,
                  position: currentRound?.position || 0,
                },
              );
              console.log(`✅ Tracking record created for ${team.name}`);
            }

            // If not displayed yet, add to queue (backend is source of truth)
            if (!displayed) {
              const eliminationOrder = aliveTeams.length + 1;
              const currentRound = team.rounds.find(
                (r) => r.roundNumber === team.currentRound,
              );

              const notification: EliminationNotification = {
                teamId: team._id,
                teamName: team.name,
                teamLogo: team.logo,
                roundNumber: team.currentRound,
                position: currentRound?.position || 0,
                killCount: currentRound?.kills || 0,
                eliminationOrder: eliminationOrder,
              };

              // Mark as pending immediately
              pendingDisplayRef.current.add(notificationKey);
              console.log(
                `📝 pendingDisplayRef now has:`,
                Array.from(pendingDisplayRef.current),
              );

              // Add to queue if not already there
              setNotificationQueue((prev) => {
                const exists = prev.some(
                  (n) =>
                    n.teamId === team._id &&
                    n.roundNumber === team.currentRound,
                );
                if (!exists) {
                  console.log(
                    `✅ Adding ${team.name} to queue (order: ${eliminationOrder})`,
                  );
                  return [...prev, notification];
                }
                console.log(`⏭️ Skipping ${team.name} - already in queue`);
                return prev;
              });
            } else {
              console.log(
                `✅ Already displayed: ${team.name} (Round ${team.currentRound})`,
              );
            }
          } catch (error: any) {
            console.error(
              `❌ Error checking elimination for team ${team.name}:`,
              error.message,
            );
          }
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    checkEliminations();
    const interval = setInterval(checkEliminations, 2000);

    return () => clearInterval(interval);
  }, []);

  // Process notification queue
  useEffect(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If there's already a notification showing, don't process queue yet
    if (currentNotification) {
      return;
    }

    // Process next notification in queue
    if (notificationQueue.length > 0 && !processingRef.current) {
      processingRef.current = true;
      const [next, ...rest] = notificationQueue;

      console.log(`🎬 Showing notification for ${next.teamName}`);
      setCurrentNotification(next);
      setNotificationQueue(rest);

      const notificationKey = `${next.teamId}-${next.roundNumber}`;

      // Mark as displayed in backend IMMEDIATELY (before showing)
      const displayUrl = `${process.env.NEXT_PUBLIC_API_URL}/elimination/display`;
      console.log(`📤 Calling /display for ${next.teamName}:`, {
        teamId: next.teamId,
        roundNumber: next.roundNumber,
      });

      axios
        .post(displayUrl, {
          teamId: next.teamId,
          roundNumber: next.roundNumber,
        })
        .then((response) => {
          console.log(
            `✅ Backend confirmed displayed for ${next.teamName}:`,
            response.data,
          );
        })
        .catch((err) => {
          console.error(
            `❌ Error marking ${next.teamName} as displayed:`,
            err.response?.data || err.message,
          );
          // Remove from pending on error so it can retry
          pendingDisplayRef.current.delete(notificationKey);
        });

      // Auto-dismiss after 6 seconds
      timerRef.current = setTimeout(() => {
        console.log(`⏰ Dismissing notification for ${next.teamName}`);
        console.log(
          `📝 pendingDisplayRef still has:`,
          Array.from(pendingDisplayRef.current),
        );
        setCurrentNotification(null);
        processingRef.current = false;
        timerRef.current = null;
        // Keep in pendingDisplayRef to prevent re-showing
      }, 5000);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notificationQueue, currentNotification]);

  if (!currentNotification) return null;

  return (
    <AnimatePresence mode="wait">
      {currentNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          {/* Screen Flash Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-red-600"
          />

          {/* Vignette Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle, transparent 30%, rgba(139, 0, 0, 0.4) 100%)",
            }}
          />

          {/* Main Notification Card */}
          <motion.div
            key={`${currentNotification.teamId}-${currentNotification.roundNumber}`}
            initial={{
              scale: 0.3,
              opacity: 0,
              rotateX: -90,
              y: -200,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateX: 0,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
              },
            }}
            exit={{
              scale: 0.3,
              opacity: 0,
              rotateY: 90,
              x: 800,
              transition: {
                duration: 0.6,
              },
            }}
            className="relative w-[600px] pointer-events-auto"
            style={{ perspective: "1500px" }}
          >
            {/* Outer Glow */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 40px rgba(220, 38, 38, 0.8), 0 0 80px rgba(220, 38, 38, 0.4)",
                  "0 0 60px rgba(220, 38, 38, 1), 0 0 120px rgba(220, 38, 38, 0.6)",
                  "0 0 40px rgba(220, 38, 38, 0.8), 0 0 80px rgba(220, 38, 38, 0.4)",
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="relative"
            >
              {/* Border Container */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)",
                  padding: "4px",
                }}
              >
                <div className="w-full h-full bg-gray-900/80 rounded-2xl" />
              </div>

              {/* Main Content */}
              <div className="relative bg-gradient-to-br from-gray-900/85 via-red-950/85 to-gray-900/85 rounded-2xl overflow-hidden border-2 border-red-500">
                {/* Animated Scan Lines */}
                <motion.div
                  animate={{
                    y: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 opacity-10"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, transparent, transparent 4px, white 4px, white 8px)",
                  }}
                />

                {/* Corner Decorations */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                    className={`absolute w-8 h-8 border-red-500 ${
                      i === 0
                        ? "top-2 left-2 border-t-4 border-l-4"
                        : i === 1
                          ? "top-2 right-2 border-t-4 border-r-4"
                          : i === 2
                            ? "bottom-2 left-2 border-b-4 border-l-4"
                            : "bottom-2 right-2 border-b-4 border-r-4"
                    }`}
                  />
                ))}

                {/* Top Banner */}
                <div className="relative bg-gradient-to-r from-transparent via-red-600 to-transparent py-4">
                  <motion.div
                    animate={{
                      opacity: [1, 0.6, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-yellow-400 text-2xl">⚠</span>
                      <h3 className="text-white font-black text-xl tracking-[0.4em] uppercase">
                        TEAM ELIMINATED
                      </h3>
                      <span className="text-yellow-400 text-2xl">⚠</span>
                    </div>
                  </motion.div>
                </div>

                {/* Main Content Area */}
                <div className="px-6 py-5 flex items-center gap-5">
                  {/* Left - Skull Animation */}
                  <div className="relative">
                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.2, 1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="text-7xl relative z-10"
                    >
                      💀
                    </motion.div>

                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 bg-red-500 rounded-full blur-2xl"
                    />
                  </div>

                  {/* Center - Team Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Team Logo */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="relative"
                      >
                        <Image
                          src={
                            currentNotification.teamLogo || "/placeholder.svg"
                          }
                          alt={currentNotification.teamName}
                          width={70}
                          height={70}
                          className="object-contain rounded-xl border-2 border-yellow-500 shadow-2xl"
                        />
                        <motion.div
                          animate={{
                            rotate: [0, 360],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 rounded-xl -z-10 blur-sm"
                        />
                      </motion.div>

                      {/* Team Name & Stats */}
                      <div className="flex-1">
                        <motion.h1
                          animate={{
                            textShadow: [
                              "0 0 20px rgba(255,255,255,0.8)",
                              "0 0 40px rgba(255,255,255,1)",
                              "0 0 20px rgba(255,255,255,0.8)",
                            ],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                          }}
                          className="text-4xl font-black text-white uppercase tracking-tight mb-3"
                          style={{
                            WebkitTextStroke: "2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {currentNotification.teamName}
                        </motion.h1>

                        {/* Stats Row */}
                        <div className="flex items-center gap-3">
                          <div className="bg-red-500/30 border-2 border-red-500 px-3 py-1.5 rounded-lg">
                            <span className="text-red-200 font-bold uppercase text-sm">
                              Eliminated
                            </span>
                          </div>

                          {/* <div className="bg-yellow-500/30 border-2 border-yellow-500 px-4 py-1 rounded-lg flex items-baseline gap-0.5">
                            <span
                              className="text-yellow-400 font-black text-3xl leading-none"
                              style={{
                                WebkitTextStroke: "1px rgba(0,0,0,0.3)",
                              }}
                            >
                              #
                            </span>
                            <span className="text-yellow-100 font-black text-2xl leading-none">
                              {currentNotification.eliminationOrder}
                            </span>
                          </div> */}

                          {currentNotification.killCount > 0 && (
                            <div className="bg-orange-500/30 border-2 border-orange-500 px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <span className="text-orange-100 font-bold text-sm">
                                {currentNotification.killCount} 🎯
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right - Elimination Number */}
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-yellow-400 font-black text-7xl leading-none"
                      style={{
                        WebkitTextStroke: "2px rgba(0,0,0,0.4)",
                      }}
                    >
                      #
                    </span>
                    <span
                      className="text-white font-black text-6xl leading-none"
                      style={{
                        WebkitTextStroke: "1.5px rgba(0,0,0,0.3)",
                      }}
                    >
                      {currentNotification.eliminationOrder}
                    </span>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="bg-gradient-to-r from-red-900 via-red-700 to-red-900 py-3 px-8">
                  <div className="flex items-center justify-center text-lg">
                    <span className="text-yellow-300 font-bold uppercase tracking-wide">
                      Round {currentNotification.roundNumber}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 6, ease: "linear" }}
                  className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 origin-left"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
