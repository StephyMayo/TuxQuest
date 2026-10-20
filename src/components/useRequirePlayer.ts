"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

/** Redirige al login si no hay sesión iniciada. */
export function useRequirePlayer() {
  const auth = useAuth();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (!auth.loading && !auth.player) {
      const qs = params.toString();
      router.replace(`/login?next=${encodeURIComponent(path + (qs ? `?${qs}` : ""))}`);
    }
  }, [auth.loading, auth.player, router, path, params]);

  return auth;
}
