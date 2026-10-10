import axios from "axios";

export const ADMIN_TOKEN_KEY = "pubg_admin_token";
export const ADMIN_COOKIE = "pubg_admin";
const COOKIE_MAX_AGE = 60 * 60 * 12;

export const PROTECTED_PREFIXES = [
  "/controller",
  "/teams",
  "/rounds",
  "/positions",
  "/settings",
];

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

export function setAdminSession(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  document.cookie = `${ADMIN_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  document.cookie = `${ADMIN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminToken());
}
