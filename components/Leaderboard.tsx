"use client"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

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

const trophyVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [-10, 0, 10, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

interface TeamTableProps {
  teams: Team[]
  startIndex: number
  endIndex: number
}

const TeamTable = ({ teams, startIndex, endIndex }: TeamTableProps) => {
  const slicedTeams = teams.slice(startIndex, endIndex)
  
  return (
    <div className="relative w-full max-w-md glow-border">
      <div className="absolute inset-0 bg-gradient-to-r from-[#07559D] via-[#FEC810] to-[#E76F00] rounded-lg animate-border-rotate" />
      <div className="relative bg-[#0d1117] rounded-lg p-0.5">
        <div className="relative z-10 rounded-lg overflow-hidden">
          <div className="flex h-12 bg-gradient-to-r from-[#1a1f2d] to-[#2a3142] text-gray-200 text-sm font-bold p-2 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#07559D40] to-[#E76F0040] opacity-30" />
            <div className="w-12 flex items-center justify-center z-10">RANK</div>
            <div className="flex-1 flex items-center justify-start pl-4 z-10">TEAM</div>
            <div className="w-20 flex items-center justify-center z-10">PLACE</div>
            <div className="w-16 flex items-center justify-center z-10">ELIMS</div>
            <div className="w-16 flex items-center justify-center z-10">TOTAL</div>
          </div>
          <div className="flex-1">
            <AnimatePresence>
              {slicedTeams.map((team, index) => {
                const actualRank = startIndex + index + 1
                const currentRoundIndex = team.currentRound - 1
                const currentRound = team.rounds[currentRoundIndex]
                const isFirst = actualRank === 1

                const placePoints = currentRound?.positionPoints ?? 0
                const elimPoints = currentRound?.killPoints ?? 0
                const roundTotal = placePoints + elimPoints

                return (
                  <motion.div
                    key={team._id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 120, damping: 12 }}
                    className={cn(
                      "relative flex h-14 border-b border-orange-500/20 text-sm group",
                      isFirst ? "bg-gradient-to-r from-orange-900/40 to-amber-900/40" : "bg-gradient-to-r from-[#1a1f2d]/90 to-[#2a3142]/90"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#07559D20] to-[#E76F0020] opacity-0 group-hover:opacity-30 transition-opacity" />
                    <div className="w-12 flex items-center justify-center font-bold text-lg z-10">
                      {isFirst ? (
                        <motion.div variants={trophyVariants} animate="animate" className="glow-gold">
                          <Trophy className="h-6 w-6 text-yellow-500" />
                        </motion.div>
                      ) : (
                        <span className="text-blue-400 glow-text">{actualRank}</span>
                      )}
                    </div>
                    <div className="flex-1 flex items-center space-x-3 pl-2 z-10">
                      <div className="relative w-8 h-8 border border-[#FEC810]/30 rounded-sm glow-gold ">
                        <Image src={team.logo || "/placeholder.svg"} alt={team.name} fill className="object-contain p-1" />
                      </div>
                      <span className="font-bold tracking-wide text-transparent bg-gradient-to-r from-[#FEC810] to-white bg-clip-text">
                        {team.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="w-20 flex items-center justify-center font-bold text-base text-blue-400 glow-text z-10">
                      {placePoints}
                    </div>
                    <div className="w-16 flex items-center justify-center font-bold text-base text-orange-400 glow-text z-10">
                      {elimPoints}
                    </div>
                    <div className="w-16 flex items-center justify-center font-bold text-base text-white glow-text z-10">
                      {roundTotal}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SplitLeaderboard({ teams }: { readonly teams: Team[] }) {
  const sortedTeams = [...teams].sort((a, b) => {
    const aRound = a.rounds[a.currentRound - 1]
    const bRound = b.rounds[b.currentRound - 1]
    const aTotal = (aRound?.positionPoints ?? 0) + (aRound?.killPoints ?? 0)
    const bTotal = (bRound?.positionPoints ?? 0) + (bRound?.killPoints ?? 0)
    return bTotal - aTotal
  })

  return (
    <div className="flex flex-row justify-center gap-6 w-full">
      <TeamTable teams={sortedTeams} startIndex={0} endIndex={4} />
      <TeamTable teams={sortedTeams} startIndex={4} endIndex={8} />
    </div>
  )
}