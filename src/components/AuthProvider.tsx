"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBackend, type Backend, type Player } from "@/lib/backend";

interface AuthState {
  backend: Backend;
  player: Player | null;
  loading: boolean;
  setPlayer: (p: Player | null) => void;
  setCoins: (coins: number) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    backend
      .getPlayer()
      .then(setPlayer)
      .catch(() => setPlayer(null))
      .finally(() => setLoading(false));
  }, [backend]);

  const setCoins = useCallback((coins: number) => setPlayer((p) => (p ? { ...p, coins } : p)), []);
  const signOut = useCallback(async () => {
    await backend.signOut();
    setPlayer(null);
  }, [backend]);

  return <AuthContext.Provider value={{ backend, player, loading, setPlayer, setCoins, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
