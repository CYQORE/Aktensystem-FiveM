"use client";

import { create } from "zustand";
import { API_BASE, api, setAccessToken } from "./api";

export interface AuthUser {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  isPlatformAdmin: boolean;
  clearance: string;
  memberships: Array<{
    factionId: string;
    callsign?: string | null;
    faction?: { shortName: string; name: string; color?: string | null } | null;
    rank?: { name: string; shareTier: number } | null;
  }>;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  init: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: "idle",

  /** Beim App-Start: Silent-Refresh -> /auth/me. */
  init: async () => {
    if (get().status === "loading") return;
    set({ status: "loading" });
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        set({ status: "anonymous", user: null, token: null });
        return;
      }
      const { accessToken } = (await res.json()) as { accessToken: string };
      setAccessToken(accessToken);
      const user = await api.get<AuthUser>("/auth/me");
      set({ user, token: accessToken, status: "authenticated" });
    } catch {
      set({ status: "anonymous", user: null, token: null });
    }
  },

  setToken: async (token: string) => {
    setAccessToken(token);
    set({ token, status: "loading" });
    try {
      const user = await api.get<AuthUser>("/auth/me");
      set({ user, status: "authenticated" });
    } catch {
      set({ status: "anonymous", user: null, token: null });
    }
  },

  login: () => {
    window.location.href = `${API_BASE}/auth/discord`;
  },

  logout: async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setAccessToken(null);
    set({ user: null, token: null, status: "anonymous" });
  },
}));
