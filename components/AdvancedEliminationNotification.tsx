"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import axios from "axios";

interface Notification {
  _id: string;
  teamName: string;
  roundNumber: number;
  eliminationOrder: number;
  killCount: number;
  position: number;
  teamId: {
    logo: string;
  };
}

export default function AdvancedEliminationNotification() {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync eliminations and check for pending notifications
  const checkForNotifications = async () => {
    try {
      // First sync eliminations from team data
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/elimination-notification/sync`);

      // Then get pending notifications
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/elimination-notification/pending`
      );

      if (response.data.success && response.data.data.length > 0 && !isDisplaying) {
        const notification = response.data.data[0];
        setCurrentNotification(notification);
        setIsDisplaying(true);

        // Auto-dismiss after 3 seconds
        timerRef.current = setTimeout(async () => {
          // Mark as displayed in backend
          await axios.patch(
            `${process.env.NEXT_PUBLIC_API_URL}/elimination-notification/${notification._id}/displayed`
          );
          setCurrentNotification(null);
          setIsDisplaying(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  useEffect(() => {
    // Initial check
    checkForNotifications();

    // Check every 3 seconds
    checkIntervalRef.current = setInterval(checkForNotifications, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [isDisplaying]);

  return (
    <AnimatePresence>
      {currentNotification && (
        <>
          {/* Screen Flash Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 bg-red-600 z-[100] pointer-events-none"
          />

          {/* Vignette Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, transparent 30%, rgba(139, 0, 0, 0.4) 100%)",
            }}
          />

          {/* Main Notification */}
          <motion.div
            key={currentNotification._id}
            initial={{
              scale: 0.3,
              opacity: 0,
              rotateX: -90,
              y: -300,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateX: 0,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 25,
              },
            }}
            exit={{
              scale: 0.3,
              opacity: 0,
              rotateY: 90,
              x: 1000,
              transition: {
                duration: 0.6,
              },
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[800px]"
            style={{ perspective: "1500px" }}
          >
            {/* Outer Glow */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 50px rgba(220, 38, 38, 0.9), 0 0 100px rgba(220, 38, 38, 0.5)",
                  "0 0 70px rgba(220, 38, 38, 1), 0 0 140px rgba(220, 38, 38, 0.7)",
                  "0 0 50px rgba(220, 38, 38, 0.9), 0 0 100px rgba(220, 38, 38, 0.5)",
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="relative"
            >
              {/* Border Frame */}
              <div
                className="absolute inset-0 rounded-3xl p-1"
                style={{
                  background:
                    "linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%)",
                }}
              >
                <div className="w-full h-full bg-gray-900 rounded-3xl" />
              </div>

              {/* Main Content */}
              <div className="relative bg-gradient-to-br from-gray-950 via-red-950 to-gray-950 rounded-3xl overflow-hidden border-4 border-red-500">
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
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, transparent, transparent 4px, white 4px, white 8px)",
                  }}
                />

                {/* Corner Brackets */}
                {[...Array(4)].map((_, i) => (
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
                    className={`absolute w-12 h-12 border-red-400 ${
                      i === 0
                        ? "top-4 left-4 border-t-4 border-l-4"
                        : i === 1
                        ? "top-4 right-4 border-t-4 border-r-4"
                        : i === 2
                        ? "bottom-4 left-4 border-b-4 border-l-4"
                        : "bottom-4 right-4 border-b-4 border-r-4"
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
                      <span className="text-yellow-400 text-3xl">⚠</span>
                      <h3 className="text-white font-black text-2xl tracking-[0.5em] uppercase">
                        TEAM ELIMINATED
                      </h3>
                      <span className="text-yellow-400 text-3xl">⚠</span>
                    </div>
                  </motion.div>
                </div>

                {/* Main Content Area */}
                <div className="px-12 py-8 flex items-center gap-8">
                  {/* Skull Animation */}
                  <div className="relative">
                    <motion.div
                      animate={{
                        rotate: [-15, 15, -15],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                      }}
                      className="text-9xl relative z-10"
                    >
                      💀
                    </motion.div>
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 bg-red-500 rounded-full blur-3xl -z-10"
                    />
                  </div>

                  {/* Team Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-4">
                      {/* Team Logo */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="relative"
                      >
                        <Image
                          src={currentNotification.teamId?.logo || "/placeholder.svg"}
                          alt={currentNotification.teamName}
                          width={100}
                          height={100}
                          className="object-contain rounded-2xl border-4 border-yellow-500 shadow-2xl"
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
                          className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 rounded-2xl -z-10 blur-md"
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
                          className="text-6xl font-black text-white uppercase tracking-tight mb-3"
                          style={{
                            WebkitTextStroke: "2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {currentNotification.teamName}
                        </motion.h1>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4">
                          {/* Elimination Order Badge */}
                          <motion.div
                            animate={{
                              scale: [1, 1.15, 1],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                            }}
                            className="bg-gradient-to-r from-red-600 to-red-800 border-4 border-red-400 px-6 py-3 rounded-xl shadow-2xl"
                          >
                            <span className="text-white font-black text-4xl">
                              #{currentNotification.eliminationOrder}
                            </span>
                          </motion.div>

                          <div className="bg-red-500/30 border-2 border-red-500 px-4 py-2 rounded-lg">
                            <span className="text-red-200 font-bold uppercase text-lg">
                              Eliminated
                            </span>
                          </div>

                          {currentNotification.killCount > 0 && (
                            <div className="bg-orange-500/30 border-2 border-orange-500 px-4 py-2 rounded-lg flex items-center gap-2">
                              <span className="text-orange-100 font-bold text-lg">
                                {currentNotification.killCount} 🎯
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warning Icon */}
                  <div className="relative">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1.5, repeat: Infinity },
                      }}
                      className="text-8xl"
                    >
                      ⚡
                    </motion.div>
                    <motion.div
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 bg-yellow-500 rounded-full blur-2xl"
                    />
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="bg-gradient-to-r from-red-900 via-red-700 to-red-900 py-3 px-8">
                  <div className="flex items-center justify-center">
                    <span className="text-yellow-300 font-bold text-lg uppercase tracking-wide">
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

            {/* Massive Explosion Particles */}
            {[...Array(36)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 36;
              const distance = 250 + Math.random() * 150;
              return (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 1,
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    opacity: [1, 0.8, 0],
                    scale: [0, 2.5, 5],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2.5,
                    ease: "easeOut",
                    delay: i * 0.015,
                  }}
                  className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${
                      i % 3 === 0
                        ? "#fbbf24"
                        : i % 3 === 1
                        ? "#f97316"
                        : "#dc2626"
                    }, transparent)`,
                    filter: "blur(5px)",
                  }}
                />
              );
            })}

            {/* Shockwave Rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`wave-${i}`}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{
                  scale: [0, 4],
                  opacity: [0.8, 0],
                }}
                transition={{
                  duration: 2,
                  ease: "easeOut",
                  delay: i * 0.3,
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-4 border-red-500 rounded-full"
              />
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
