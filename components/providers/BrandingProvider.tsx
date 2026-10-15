"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import { DEFAULT_BRANDING, type Branding } from "@/types/branding";

interface BrandingContextValue {
  branding: Branding;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: DEFAULT_BRANDING,
  isLoading: true,
  refresh: async () => {},
});

function applyBranding(branding: Branding) {
  if (typeof document === "undefined") return;

  document.title = branding.systemName || DEFAULT_BRANDING.systemName;

  if (branding.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await api.get("/system/branding");
      const next: Branding = {
        ...DEFAULT_BRANDING,
        ...(response.data?.data ?? {}),
      };
      setBranding(next);
    } catch {
      // Keep the default branding if the request fails.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    applyBranding(branding);
  }, [branding]);

  const value = useMemo<BrandingContextValue>(
    () => ({ branding, isLoading, refresh: load }),
    [branding, isLoading, load]
  );

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
