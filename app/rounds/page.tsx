"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {ToastContainer, notifyError, notifySuccess} from "@/utils/ToastifyNotification"

interface Team {
  _id: string;
  slot: number;
  collegeName: string;
  name: string;
  isEliminated: boolean;
  rounds: Array<{
    roundNumber: number;
    status: string;
  }>;
}

export default function RoundManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [roundNumber, setRoundNumber] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all teams

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/team`
        );
        setTeams(response.data.data);
      } catch  {
        setError("Failed to load teams");
      }
    };
    fetchTeams();
  }, []);

  // Handle checkbox changes
  const handleCheckboxChange = (slot: number) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  // Select/Deselect all
  const toggleAllTeams = () => {
    if (selectedSlots.length === teams.length) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots(teams.map((t) => t.slot));
    }
  };

  // Create Round
  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlots.length === 0) {
      notifyError("Please select at least one team before creating a round.");
      return;
    }

    try {
      setLoadingCreate(true);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/team/rounds`, {
        slots: selectedSlots,
        roundNumber: Number(roundNumber),
      });
      setSuccess(`Round ${roundNumber} created successfully!`);
      notifySuccess(`Round ${roundNumber} created successfully!`);
      // Refresh data by fetching teams again
      // Refresh the page after success
      setTimeout(() => window.location.reload(), 1000);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "An error occurred");
         notifyError(err.response.data.message || "Failed to create round.");
      } else {
        setError("Failed to create round");
         notifyError("Failed to create round.");
      }
    } finally {
      setLoadingCreate(false);
    }
  };

  // Delete Round
  const handleDeleteRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlots.length === 0) {
      notifyError("Please select at least one team before deleting a round.");
      return;
    }
    try {
      setLoadingDelete(true);
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/team/rounds/delete`,
        {
          data: {
            slots: selectedSlots,
            roundNumber: Number(roundNumber),
          },
        }
      );
      setSuccess(`Round ${roundNumber} deleted successfully!`);
      notifySuccess(`Round ${roundNumber} deleted successfully!`);
      // Refresh the page after success
      setTimeout(() => window.location.reload(), 1000);
      setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Failed to delete round");
       notifyError("Failed to delete round.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <ToastContainer   />
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800 rounded-xl p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-red-500 mb-6 border-b border-red-500/30 pb-4">
            Tournament Round Manager
          </h1>

          {/* Round Number Input */}
          <div className="mb-8">
            <label htmlFor="round" className="block text-red-400 mb-2 text-lg">
              Round Number
            </label>
            <input
              type="number"
              id="round"
              value={roundNumber}
              onChange={(e) => setRoundNumber(e.target.value)}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border-2 border-red-500/30 focus:border-red-500 outline-none"
            />
          </div>

          {/* Team Selection */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-red-400">Select Teams</h2>
              <button
                type="button"
                onClick={toggleAllTeams}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                {selectedSlots.length === teams.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <motion.div
                  key={team._id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border-2 ${
                    selectedSlots.includes(team.slot)
                      ? "border-red-500 bg-red-500/10"
                      : "border-gray-700 hover:border-red-500/30"
                  } transition-all cursor-pointer`}
                  onClick={() => handleCheckboxChange(team.slot)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">
                        Slot #{team.slot}
                      </h3>
                      <p className="text-red-300 uppercase">{team.name}</p>
                      <p className="text-gray-400 text-sm">
                        {team.collegeName}
                      </p>
                      {team.rounds.length > 0 ? (
                        team.rounds.map((round) => (
                          <p
                            key={round.roundNumber}
                            className="text-gray-400 text-sm"
                          >
                            Rounds: {round.roundNumber}
                          </p>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">No rounds found</p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedSlots.includes(team.slot)}
                      onChange={() => handleCheckboxChange(team.slot)}
                      className="h-5 w-5 text-red-500 rounded focus:ring-red-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleCreateRound}
              disabled={loadingCreate}
              className="p-4 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-white font-bold hover:shadow-red-500/20 hover:shadow-lg transition-all"
            >
              {loadingCreate ? "Creating..." : "Create Round"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleDeleteRound}
              disabled={loadingDelete}
              className="p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg text-red-400 font-bold border-2 border-red-500/30 hover:border-red-500 transition-all"
            >
              {loadingDelete ? "Deleting..." : "Delete Round"}
            </motion.button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 text-red-300 rounded-lg animate-pulse">
              {error}
            </div>
          )}

          {success && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="mt-6 p-4 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30"
            >
              {success}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
