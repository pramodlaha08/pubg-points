"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { GiPodium, GiTrophy } from "react-icons/gi";
import { notifyError, ToastContainer } from "@/utils/ToastifyNotification";

interface Team {
  _id: string;
  name: string;
  slot: number;
  logo: string;
  totalPoints: number;
  currentRound: number;
  rounds: Array<{
    roundNumber: number;
    position: number;
    positionPoints: number;
    killPoints?: number;
  }>;
}

interface PositionData {
  [slot: number]: number;
}

export default function PositionUpdater() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(0);
  const [positions, setPositions] = useState<PositionData>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/team`
      );
      setTeams(response.data.data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  useEffect(() => {
    fetchTeams();
    // const interval = setInterval(fetchTeams, 2000);
    // return () => clearInterval(interval);
  }, []);

  const handlePositionChange = (slot: number, value: string) => {
    setPositions((prev) => ({
      ...prev,
      [slot]: parseInt(value) || 0,
    }));
  };

  const submitPositions = async () => {
    if (!roundNumber) {
      alert("Please enter round number");
      return;
    }

    const slotPositions = Object.entries(positions)
      .filter(([, pos]) => pos > 0) // ✅ No ESLint warning
      .map(([slot, position]) => ({
        slot: parseInt(slot),
        position: position,
      }));


    if (slotPositions.length === 0) {
      notifyError("Please enter at least one position");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:8000/api/v1/team/points", {
        roundNumber,
        slotPositions,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating positions:", error);
      alert("Error updating positions");
    } finally {
      setLoading(false);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <ToastContainer />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
          <GiTrophy className="text-4xl md:text-5xl text-yellow-400 animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-center">
            Position Updater
          </h1>
        </div>
        <div className="font-bold text-red-500 animate-pulse text-2xl">Please verify round number before updating position</div>

        {/* Round Input */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <input
            type="number"
            value={roundNumber}
            onChange={(e) => setRoundNumber(parseInt(e.target.value))}
            className="bg-gray-800 text-white px-4 py-3 rounded-lg border-2 border-blue-500/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 w-full sm:w-40 text-center text-lg"
            placeholder="Round Number"
            min="1"
          />
          <button
            onClick={submitPositions}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg w-full sm:w-auto text-lg font-semibold ${
              loading ? "bg-blue-600/50" : "bg-blue-600 hover:bg-blue-700"
            } text-white transition-all`}
          >
            <GiPodium className="text-xl" />
            {loading ? "Updating..." : "Submit Positions"}
          </button>
          {success && (
            <span className="text-green-400 text-sm sm:text-base animate-bounce">
              Positions updated successfully!
            </span>
          )}
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 relative flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-full border-2 border-blue-500/30"
                />
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-blue-400 truncate uppercase">
                    {team.name}
                  </h2>
                  <p className="text-sm text-gray-400 truncate">
                    Slot #{team.slot}
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={positions[team.slot] || ""}
                    onChange={(e) =>
                      handlePositionChange(team.slot, e.target.value)
                    }
                    className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-xl border-2 border-blue-500/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm md:text-base"
                    placeholder="Position"
                    min="1"
                  />
                  <span className="text-xs md:text-sm text-gray-400">
                    Current Round:{" "}
                    {team.rounds.length > 0 ? ` ${team.currentRound}` : "-"}
                  </span>
                </div>

                <div className="text-xs md:text-sm text-blue-300 flex justify-around">
                  <div>

                  Points:{" "}
                  {team.rounds.length > 0
                    ? team.rounds[team.rounds.length - 1].positionPoints
                    : "0"}
                    </div>
                  <div>

                 Kill Points:{" "}
                  {team.rounds.length > 0
                    ? team.rounds[team.rounds.length - 1].killPoints
                    : "0"}
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
