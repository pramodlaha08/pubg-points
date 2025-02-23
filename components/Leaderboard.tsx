"use client"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy } from "lucide-react"

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
    scale: [1, 1.1, 1],
    rotate: [-5, 0, 5, 0],
    transition: {
      duration: 2,
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

  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg overflow-hidden border border-orange-500/20">
        <div className="flex h-12 bg-gradient-to-r from-[#1a1f2d] to-[#2a3142] text-gray-200 text-sm font-bold p-2">
          <div className="w-12 flex items-center justify-center">RANK</div>
          <div className="flex-1 flex items-center justify-start pl-4">TEAM</div>
          <div className="w-20 flex items-center justify-center">PLACE</div>
          <div className="w-16 flex items-center justify-center">ELIMS</div>
          <div className="w-16 flex items-center justify-center">TOTAL</div>
        </div>
        <div className="flex-1">
          <AnimatePresence>
            {slicedTeams.map((team, index) => {
              const actualRank = startIndex + index + 1
              const currentRoundIndex = team.currentRound - 1
              const currentRound = team.rounds[currentRoundIndex]
              const isFirst = actualRank === 1

              // Calculate points for current round
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
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className={`flex h-14 border-b border-orange-500/20 text-sm ${
                     isFirst
                        ? "bg-gradient-to-r from-orange-900/40 to-amber-900/40 text-white"
                        : "bg-gradient-to-r from-[#1a1f2d]/90 to-[#2a3142]/90 text-white"
                  }`}
                >
                  <div className="w-12 flex items-center justify-center font-bold text-lg">
                    {isFirst ? (
                      <motion.div variants={trophyVariants} animate="animate">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      </motion.div>
                    ) : (
                      <span className="text-blue-400">{actualRank}</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center space-x-3 pl-2">
                    <div className="relative w-8 h-8">
                      <Image src={team.logo || "/placeholder.svg"} alt={team.name} fill className="object-contain" />
                    </div>
                    <span className="font-bold tracking-wide">{team.name.toUpperCase()}</span>
                  </div>
                  <div className="w-20 flex items-center justify-center font-bold text-base text-blue-400">
                    {placePoints}
                  </div>
                  <div className="w-16 flex items-center justify-center font-bold text-base text-orange-400">
                    {elimPoints}
                  </div>
                  <div className="w-16 flex items-center justify-center font-bold text-base">{roundTotal}</div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function SplitLeaderboard({ teams }: { readonly teams: Team[] }) {
  // Sort teams based on current round total points
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

