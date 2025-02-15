"use client";
import { useState, useCallback } from "react";
import axios from "axios";
import { GiDeathSkull, GiSpikedDragonHead } from "react-icons/gi";
import { Flame } from "lucide-react";

export default function RegisterTeam() {
  const [formData, setFormData] = useState({
    name: "",
    slot: "",
    logo: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: string;
    content: string;
  } | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData((prev) => ({ ...prev, logo: file }));
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("slot", formData.slot);
      if (formData.logo) formPayload.append("logo", formData.logo);

      const response = await axios.post(
        "http://localhost:8000/api/v1/team/",
        formPayload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage({ type: "success", content: "Team registered successfully!" });
      setFormData({ name: "", slot: "", logo: null });
      setPreview(null);
    } catch (error) {
      setMessage({
        type: "error",
        content: "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border-4 border-red-500/40 hover:border-red-500/60 transition-all duration-300 shadow-2xl hover:shadow-red-500/20 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <GiDeathSkull className="text-5xl text-red-500 animate-pulse" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
              Register New Team
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logo Upload Preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-48 rounded-full border-4 border-red-500/50 hover:border-red-500/70 transition-all group cursor-pointer">
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="logo" className="w-full h-full cursor-pointer">
                  {preview ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <img
                        src={preview}
                        alt="Team logo preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold">
                          Change Logo
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700/50 hover:bg-gray-700/70 rounded-full transition-all">
                      <GiSpikedDragonHead className="text-4xl text-red-500 mb-2" />
                      <span className="text-red-400 text-sm">
                        Upload Team Logo
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Team Name Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-red-400 text-lg">
                <Flame className="w-5 h-5" />
                Team Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-gray-700/50 border-2 border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
                placeholder="Enter team name"
                required
              />
            </div>

            {/* Slot Number Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-red-400 text-lg">
                <Flame className="w-5 h-5" />
                Slot Number
              </label>
              <input
                type="number"
                value={formData.slot}
                onChange={(e) =>
                  setFormData({ ...formData, slot: e.target.value })
                }
                className="w-full bg-gray-700/50 border-2 border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
                placeholder="Enter slot number"
                min="1"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading || !formData.name || !formData.slot || !formData.logo
              }
              className={`w-full py-4 text-xl font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                loading
                  ? "bg-red-600/50 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20"
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-pulse">Registering...</span>
                </>
              ) : (
                <>
                  <GiDeathSkull className="text-xl" />
                  <span>Create Team</span>
                </>
              )}
            </button>

            {/* Messages */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-800/50 text-green-300"
                    : "bg-red-800/50 text-red-300"
                }`}
              >
                {message.content}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
