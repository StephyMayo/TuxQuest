"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Inventory, Loadout } from "@/data/types";
import { getBackend, type Backend, type Player } from "@/lib/backend";

interface AuthState {
  backend: Backend;
  player: Player | null;
  loading: boolean;
  /** Cuántas unidades tiene de cada objeto. Vacío mientras carga o sin sesión. */
  inventory: Inventory;
  setPlayer: (p: Player | null) => void;
  setCoins: (coins: number) => void;
  setLoadout: (l: Loadout) => void;
  setInventory: (inv: Inventory) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [player, setPlayer] = useState<Player | null>(null);
  const [inventory, setInventory] = useState<Inventory>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    backend
      .getPlayer()
      .then(setPlayer)
      .catch(() => setPlayer(null))
      .finally(() => setLoading(false));
  }, [backend]);

  // Se carga el inventario al entrar. Al salir lo vacía signOut(), así que
  // aquí no hace falta tocarlo cuando no hay jugador.
  useEffect(() => {
    if (!player) return;
    let cancelled = false;
    backend
      .getInventory()
      .then((inv) => !cancelled && setInventory(inv))
      .catch(() => !cancelled && setInventory({}));
    return () => {
      cancelled = true;
    };
  }, [backend, player?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCoins = useCallback((coins: number) => setPlayer((p) => (p ? { ...p, coins } : p)), []);
  const setLoadout = useCallback((loadout: Loadout) => setPlayer((p) => (p ? { ...p, loadout } : p)), []);
  const signOut = useCallback(async () => {
    await backend.signOut();
    setPlayer(null);
    setInventory({});
  }, [backend]);

  return (
    <AuthContext.Provider value={{ backend, player, loading, inventory, setPlayer, setCoins, setLoadout, setInventory, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
