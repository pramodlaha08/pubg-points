"use client"
import SplitLeaderboard from "@/components/Leaderboard"
import axios from "axios"
import { useEffect, useState } from "react"

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


export default  function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);

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
        }
      } catch  {
        console.error("Error fetching teams:");
      }
    };

    fetchTeams();
    const interval = setInterval(fetchTeams, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen w-full bg-[#0d1117]">
      {/* 16:9 aspect ratio container */}
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <div className="absolute inset-0 flex flex-col">
          {/* Top section for additional content */}
          <div className="flex-1 p-6">
            <div className="w-full h-full rounded-lg border border-orange-500/20 bg-gradient-to-b from-[#1a1f2d]/80 to-[#2a3142]/80">
              {/* Add your additional content here */}
            </div>
          </div>

          {/* Bottom section for leaderboard */}
          <div className="p-6">
            <SplitLeaderboard teams={teams} />
          </div>
        </div>
      </div>
    </main>
  )
}

