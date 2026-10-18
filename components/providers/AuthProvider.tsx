"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, getAdminRole, setAdminRole } from "@/lib/api";
import {
  canScoreRole,
  isAdminRole,
  type AdminRole,
} from "@/types/admin";

interface AuthState {
  role: AdminRole | null;
  username: string | null;
  isAdmin: boolean;
  canScore: boolean;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({
  role: null,
  username: null,
  isAdmin: false,
  canScore: false,
  ready: false,
});

const buildState = (
  role: AdminRole | null,
  username: string | null,
  ready: boolean
): AuthState => ({
  role,
  username,
  isAdmin: isAdminRole(role),
  canScore: canScoreRole(role),
  ready,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    buildState(null, null, false)
  );

  useEffect(() => {
    // Use the cached role immediately, then confirm it with the server so a
    // role change made by an admin takes effect on the next page load.
    const cached = getAdminRole();
    if (cached) {
      setState(buildState(cached, null, true));
    }

    let active = true;
    api
      .get("/auth/me")
      .then((response) => {
        const admin = response.data?.data as
          | { username?: string; role?: AdminRole }
          | undefined;
        if (!active || !admin?.role) return;
        setAdminRole(admin.role);
        setState(buildState(admin.role, admin.username ?? null, true));
      })
      .catch(() => {
        // 401s are handled by the api interceptor (redirect to /login).
        if (active && !cached) setState(buildState(null, null, true));
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
