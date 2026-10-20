"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { PixelCoin, PixelTux } from "./Pixel";

export function Coins({ value }: { value: number }) {
  return (
    <span className="chip bg-bg-2 font-pixel text-[11px] text-accent" aria-label={`${value} monedas`}>
      <PixelCoin size={16} />
      {value}
    </span>
  );
}

export function Header() {
  const { player, loading, signOut, backend } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-bg-2/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="TuxQuest, inicio">
          <PixelTux size={30} className="transition-transform group-hover:-translate-y-0.5" />
          <span className="pixel-title text-[13px] sm:text-[15px]">
            TUX<span className="text-accent">QUEST</span>
          </span>
          {backend.mode === "demo" && (
            <span className="chip hidden text-[11px] text-muted sm:inline-flex" title="Sin Supabase: los datos se guardan solo en este navegador">
              DEMO
            </span>
          )}
        </Link>

        <nav className="flex shrink-0 items-center gap-2" aria-label="Principal">
          {loading ? null : player ? (
            <>
              <Link href="/jugar" className="btn btn-cyan btn-sm hidden sm:inline-flex">
                ▶ Jugar
              </Link>
              <Coins value={player.coins} />
              <span className="hidden font-game text-muted md:inline">@{player.username}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Entrar
              </Link>
              <Link href="/registro" className="btn btn-primary btn-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
