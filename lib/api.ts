import axios from "axios";
import type { AdminRole } from "@/types/admin";

export const ADMIN_TOKEN_KEY = "pubg_admin_token";
export const ADMIN_ROLE_KEY = "pubg_admin_role";
export const ADMIN_COOKIE = "pubg_admin";
export const TOURNAMENT_STORAGE_KEY = "pubg_tournament_id";
const COOKIE_MAX_AGE = 60 * 60 * 12;

export const PROTECTED_PREFIXES = ["/admin"];

// Tournament scope resolution priority:
//   1. explicit ?tournamentId= in the current URL (OBS overlays pin this)
//   2. id selected in the admin switcher (module level) or persisted
//   3. none -> backend falls back to the default tournament
let explicitTournamentId: string | null = null;

export function setApiTournamentId(id: string | null) {
  explicitTournamentId = id || null;
}

export function getApiTournamentId(): string | null {
  if (typeof window !== "undefined") {
    const fromUrl = new URLSearchParams(window.location.search).get(
      "tournamentId"
    );
    if (fromUrl) return fromUrl;
  }
  if (explicitTournamentId) return explicitTournamentId;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(TOURNAMENT_STORAGE_KEY);
    if (stored) return stored;
  }
  return null;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tournamentId = getApiTournamentId();
    if (tournamentId) {
      config.headers["X-Tournament-Id"] = tournamentId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const path = window.location.pathname;
      if (PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
        clearAdminSession();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function setAdminSession(token: string, role?: AdminRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  if (role) {
    window.localStorage.setItem(ADMIN_ROLE_KEY, role);
  }
  document.cookie = `${ADMIN_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_ROLE_KEY);
  document.cookie = `${ADMIN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminRole(role: AdminRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_ROLE_KEY, role);
}

export function getAdminRole(): AdminRole | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_ROLE_KEY) as AdminRole | null;
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminToken());
}
