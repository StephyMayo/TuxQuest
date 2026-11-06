"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Inventory, Loadout } from "@/data/types";
import { getBackend, type Backend, type Player } from "@/lib/backend";

interface AuthState {
  backend: Backend;
  player: Player | null;
  loading: boolean;
  authError: string | null;
  inventory: Inventory;
  inventoryError: string | null;
  setPlayer: (p: Player | null) => void;
  setCoins: (coins: number) => void;
  setLoadout: (l: Loadout) => void;
  setInventory: (inv: Inventory) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [player, setPlayerState] = useState<Player | null>(null);
  const [inventory, setInventoryState] = useState<Inventory>({});
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const lastPlayerId = useRef<string | null>(null);

  const setPlayer = useCallback((next: Player | null) => {
    setPlayerState(next);
    const nextId = next?.id ?? null;
    if (lastPlayerId.current !== nextId) {
      lastPlayerId.current = nextId;
      setInventoryState({});
      setInventoryError(null);
    }
    if (next) setAuthError(null);
  }, []);
  const setInventory = useCallback((next: Inventory) => {
    setInventoryState(next);
    setInventoryError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    backend
      .getPlayer()
      .then((next) => {
        if (!cancelled) {
          setPlayer(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthError("No se pudo comprobar la sesión. Revisa tu conexión y recarga la página.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [backend, setPlayer]);

  // Se carga el inventario al entrar y se descarta al cambiar o cerrar sesión.
  useEffect(() => {
    if (!player?.id) return;
    let cancelled = false;
    backend
      .getInventory()
      .then((inv) => {
        if (!cancelled) setInventory(inv);
      })
      .catch(() => {
        if (!cancelled) {
          setInventoryError("No se pudo cargar el inventario. Revisa tu conexión y recarga la página.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [backend, player?.id, setInventory]);

  const setCoins = useCallback((coins: number) => setPlayerState((p) => (p ? { ...p, coins } : p)), []);
  const setLoadout = useCallback((loadout: Loadout) => setPlayerState((p) => (p ? { ...p, loadout } : p)), []);
  const signOut = useCallback(async () => {
    await backend.signOut();
    setPlayer(null);
    setInventory({});
  }, [backend, setInventory, setPlayer]);

  return (
    <AuthContext.Provider value={{ backend, player, loading, authError, inventory, inventoryError, setPlayer, setCoins, setLoadout, setInventory, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
