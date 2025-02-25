"use client"
import SplitLeaderboard from "@/components/Leaderboard"
import axios from "axios"
import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { GiChickenOven } from "react-icons/gi"

interface Team {
  _id: string
  name: string
  logo: string
  slot: number
  currentRound: number
  totalPoints: number
  rounds: {
    roundNumber: number
    kills: number
    killPoints: number
    position: number
    positionPoints: number
    eliminationCount: number
    eliminatedPlayers: number[]
    status: string
  }[]
}

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([])
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/team`)
        const data = response.data
        if (data.success) {
          setTeams(data.data.sort((a: Team, b: Team) => b.totalPoints - a.totalPoints))
        }
      } catch {
        console.error("Error fetching teams:")
      }
    }
    fetchTeams()
    const interval = setInterval(fetchTeams, 100000)
    return () => clearInterval(interval)
  }, [])

  const firstTeam = teams.length > 0 ? teams[0] : null
  const currentRound = firstTeam?.rounds[firstTeam.currentRound - 1] || null

  return (
    <main className="min-h-screen w-full bg-[#86f52c] relative overflow-hidden">
      {/* Animated background elements */}
      {/* <div className="absolute inset-0 z-0">
        <div className="absolute w-[800px] h-[800px] -top-[400px] -left-[400px] bg-radial-gradient from-[#ff6b0030] to-transparent animate-pulse" />
        <div className="absolute w-[800px] h-[800px] -bottom-[400px] -right-[400px] bg-radial-gradient from-[#00a8ff30] to-transparent animate-pulse delay-1000" />
      </div> */}

      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <div className="absolute inset-0 flex flex-col">
          {/* Header Section */}
          <div className="flex justify-between items-center p-3 relative z-10">
            <div className="flex flex-col space-y-3">
              <h1 className=" text-[#ff6b00]  text-2xl font-black uppercase ">
                Match Rankings
              </h1>
              <div className="relative bg-gradient-to-r from-[#00a8ff] to-[#ff6b00] p-0.5 rounded-lg group">
                <div className="bg-[#243042] flex items-center space-x-8 w-32 rounded-md px-2 py-[0.15rem] font-bold shadow-lg">
                  <p className="text-[#ffd700] text-lg text-center px-6">Match</p>
                  <p className="text-lg text-[#fff] pl-8 font-bold">{firstTeam?.currentRound}/6</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#00a8ff] to-[#ff6b00] opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-lg" />
              </div>
            </div>
            <div className="text-[#ff6b00] text-2xl font-black text-right ">
              <p>PUBG Mobile </p>
              <p>Biratnagar Championship</p>
            </div>
          </div>

          {/* Top 1 Team Highlight */}
          <div className="flex-1 p-6 relative z-10">
            {firstTeam && currentRound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full h-full rounded-lg bg-[#243042] border-2 border-[#ffd700]/20 shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#00a8ff20] to-[#ff6b0020] opacity-30 rounded-lg" />
                <div className="relative z-10 p-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative w-24 h-24 border-2 border-[#ffd700] rounded-full glow-gold overflow-hidden bg-[#1a2234]/80">
                      <Image
                        src={firstTeam.logo || "/placeholder.svg"}
                        alt={firstTeam.name}
                        fill
                        className="object-contain p-2 rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-4xl font-extrabold text-transparent bg-gradient-to-r from-[#ffd700] to-[#ff6b00] bg-clip-text uppercase tracking-wider animate-text-gradient">
                        {firstTeam.name}
                      </h2>
                      <p className="text-lg text-gray-300 mt-2">
                        Total Points:{" "}
                        <span className="text-[#00a8ff] font-bold glow-text">{firstTeam.totalPoints}</span>
                      </p>
                      <p className="text-lg font-bold text-transparent bg-gradient-to-r from-[#ffd700] to-[#ff6b00] bg-clip-text flex gap-4 items-center mt-2 capitalize">
                        Winner winner chicken dinner{" "}
                        <GiChickenOven size="2rem" className="animate-bounce text-[#ffd700]" />
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 relative bg-[#1a2234] rounded-lg p-4 border border-[#ffd700]/20 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00a8ff20] to-[#ff6b0020] rounded-lg" />
                    <div className="relative z-10 flex justify-between items-center">
                      {[
                        {
                          label: "Rank",
                          value: <GiChickenOven className="text-[#ffd700]" />,
                          color: "text-[#ffd700]",
                        },
                        {
                          label: "Place Points",
                          value: currentRound.positionPoints,
                          color: "text-[#00a8ff]",
                        },
                        {
                          label: "Elims Points",
                          value: currentRound.kills,
                          color: "text-[#ff6b00]",
                        },
                        {
                          label: "Total Points",
                          value: currentRound.positionPoints + currentRound.killPoints,
                          color: "text-[#ffd700]",
                        },
                      ].map((item, index) => (
                        <div key={index} className="text-center">
                          <p className="text-sm text-gray-400">{item.label}</p>
                          <p className={`text-2xl font-bold ${item.color} glow-text`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Section: Leaderboard */}
          <div className="p-6 relative z-10">
            <SplitLeaderboard teams={teams} />
          </div>
        </div>
      </div>
    </main>
  )
}

