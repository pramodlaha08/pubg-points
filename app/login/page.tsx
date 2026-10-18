"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { GiCrossedSabres, GiDeathSkull } from "react-icons/gi";
import { api, setAdminSession } from "@/lib/api";
import { notifyError, ToastContainer } from "@/utils/ToastifyNotification";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { username, password });
      const token = response?.data?.data?.token as string | undefined;
      const role = response?.data?.data?.admin?.role as
        | "admin"
        | "scorer"
        | "commentator"
        | "viewer"
        | undefined;
      if (!token) {
        throw new Error("No token returned by server");
      }
      setAdminSession(token, role);
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/admin/overview");
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : undefined;
      notifyError(message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 sm:p-8 border-4 border-red-500/40 shadow-2xl">
          <div className="flex flex-col items-center gap-3 mb-8">
            <GiDeathSkull className="text-5xl text-red-500 animate-pulse" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
              Admin Login
            </h1>
            <p className="text-gray-400 text-sm text-center">
              Sign in to manage matches, teams and the points table design.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-red-400 text-sm" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-gray-700/50 border-2 border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-red-400 text-sm" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-gray-700/50 border-2 border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-lg font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                loading
                  ? "bg-red-600/50 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20"
              }`}
            >
              {loading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  <GiCrossedSabres className="text-xl" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <ToastContainer />
      <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
