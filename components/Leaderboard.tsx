"use client"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy } from "lucide-react"
import { GiChickenOven } from "react-icons/gi"
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
      repeat: Number.POSITIVE_INFINITY,
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

  const getChickenCount = (team: Team) => {
    return team.rounds.filter((round) => round.position === 1).length
  }

  const calculateTotalStats = (team: Team) => {
    return team.rounds.reduce(
      (acc, round) => {
        return {
          placePoints: acc.placePoints + (round.positionPoints || 0),
          elimPoints: acc.elimPoints + (round.killPoints || 0),
        }
      },
      { placePoints: 0, elimPoints: 0 },
    )
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-0 bg-gradient-to-r from-[#00a8ff] via-[#ffd700] to-[#ff6b00] rounded-lg animate-border-rotate opacity-50" />
      <div className="relative bg-[#243042] rounded-lg p-0.5 shadow-2xl">
        <div className="relative z-10 rounded-lg overflow-hidden">
          <div className="flex h-12 bg-[#1a2234] text-white text-sm font-bold p-2 relative border-b border-[#ffd700]/20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00a8ff20] to-[#ff6b0020] opacity-30" />
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
                const isFirst = actualRank === 1
                const chickenCount = getChickenCount(team)
                const { placePoints, elimPoints } = calculateTotalStats(team)
                const totalPoints = placePoints + elimPoints

                return (
                  <motion.div
                    key={team._id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 120, damping: 12 }}
                    className={cn(
                      "relative flex h-14 border-b border-[#ffd700]/10 text-sm group",
                      isFirst ? "bg-gradient-to-r from-[#243042] to-[#1a2234]" : "bg-[#1a2234]",
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00a8ff10] to-[#ff6b0010] opacity-0 group-hover:opacity-50 transition-opacity" />
                    <div className="w-12 flex items-center justify-center font-bold text-lg z-10">
                      {isFirst ? (
                        <motion.div variants={trophyVariants} animate="animate" className="glow-gold">
                          <Trophy className="h-6 w-6 text-[#ffd700]" />
                        </motion.div>
                      ) : (
                        <span className="text-[#00a8ff] glow-text">{actualRank}</span>
                      )}
                    </div>
                    <div className="flex-1 flex items-center space-x-3 pl-2 z-10">
                      <div className="relative w-8 h-8 border border-[#ffd700]/30 rounded-sm glow-gold bg-[#1a2234]">
                        <Image
                          src={team.logo || "/placeholder.svg"}
                          alt={team.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold tracking-wide text-white">{team.name.toUpperCase()}</span>
                        {chickenCount > 0 && (
                          <div className="flex items-center gap-1">
                            <GiChickenOven className="h-4 w-4 text-[#ffd700]" />
                            {chickenCount > 1 && <span className="text-xs text-[#ffd700]">x{chickenCount}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-20 flex items-center justify-center font-bold text-base text-[#00a8ff] glow-text z-10">
                      {placePoints}
                    </div>
                    <div className="w-16 flex items-center justify-center font-bold text-base text-[#ff6b00] glow-text z-10">
                      {elimPoints}
                    </div>
                    <div className="w-16 flex items-center justify-center font-bold text-base text-[#ffd700] glow-text z-10">
                      {totalPoints}
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
    const aStats = a.rounds.reduce((acc, round) => acc + (round.positionPoints || 0) + (round.killPoints || 0), 0)
    const bStats = b.rounds.reduce((acc, round) => acc + (round.positionPoints || 0) + (round.killPoints || 0), 0)
    return bStats - aStats
  })

  return (
    <div className="flex flex-row justify-center gap-6 w-full">
      <TeamTable teams={sortedTeams} startIndex={0} endIndex={4} />
      <TeamTable teams={sortedTeams} startIndex={4} endIndex={8} />
    </div>
  )
}

