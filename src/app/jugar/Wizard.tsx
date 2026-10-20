"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DIFFICULTIES, FAMILIES, distrosOf, familyById } from "@/data/catalog";
import type { Difficulty, FamilyId } from "@/data/types";
import { FamilyBadge, PixelBulb, PixelClock, PixelCoin, PixelLock, PixelStar, PixelTux } from "@/components/Pixel";
import { useRequirePlayer } from "@/components/useRequirePlayer";

const STEP_NAMES = ["Mundo", "Distro", "Dificultad", "Modo"];
const STEP_TITLES = ["SELECCIONA TU MUNDO", "ELIGE TU DISTRO", "ELIGE LA DIFICULTAD", "ELIGE EL MODO"];

export function Wizard() {
  const { player } = useRequirePlayer();
  const router = useRouter();
  const params = useSearchParams();
  const welcome = params.get("bienvenida") === "1";

  const [step, setStep] = useState(0);
  const [family, setFamily] = useState<FamilyId | null>(null);
  const [distro, setDistro] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  if (!player) return null;

  const fam = family ? familyById(family) : null;
  const summary = [fam?.name, distro && distrosOf(fam!.id).find((d) => d.id === distro)?.name, difficulty && DIFFICULTIES.find((d) => d.id === difficulty)?.name].filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {welcome && (
        <div className="card pop mb-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <PixelTux size={56} bob className="shrink-0" />
          <div className="flex-1">
            <p className="font-game text-2xl">¡Bienvenido, {player.username}!</p>
            <p className="text-muted">
              Tienes <strong className="text-accent">{player.coins} monedas</strong> para empezar. ¿Primera vez? Prueba «Primeros pasos» en Ubuntu, nivel fácil.
            </p>
          </div>
          <Link href="/jugar/partida?familia=debian&categoria=ubuntu&dificultad=facil&mision=navegacion" className="btn btn-primary shrink-0">
            ▶ Primera misión
          </Link>
        </div>
      )}

      {/* Indicador de pasos */}
      <ol className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Pasos">
        {STEP_NAMES.map((name, i) => (
          <li key={name}>
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
              className={`w-full border-[3px] border-ink px-1 py-2 text-center font-game text-sm sm:text-base ${
                i === step ? "bg-accent text-accent-ink" : i < step ? "bg-ok/80 text-[#002a10] hover:brightness-110" : "bg-bg-2 text-muted"
              }`}
              style={{ boxShadow: "3px 3px 0 #06030f" }}
            >
              <span className="font-pixel text-[10px]">{i < step ? "✔" : i + 1}</span> <span className="hidden sm:inline">{name}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="pixel-title text-base sm:text-xl">{STEP_TITLES[step]}</h1>
        {summary.length > 0 && <p className="font-game text-lg text-muted">{summary.join(" › ")}</p>}
      </div>

      <section className="mt-6" aria-live="polite" key={step}>
        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {FAMILIES.map((f) => (
              <Option
                key={f.id}
                onClick={() => {
                  setFamily(f.id);
                  setDistro(null);
                  setStep(1);
                }}
                color={f.color}
              >
                <span className="flex items-center gap-4">
                  <FamilyBadge name={f.name} color={f.color} size={52} />
                  <span className="flex-1">
                    <span className="block font-game text-2xl leading-none">{f.name}</span>
                    <span className="font-crt text-xl text-accent">$ {f.packageManager}</span>
                  </span>
                </span>
                <span className="mt-3 block text-muted">{f.description}</span>
                <span className="mt-3 block text-sm text-muted/80">{distrosOf(f.id).length} distribuciones</span>
              </Option>
            ))}
          </div>
        )}

        {step === 1 && fam && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {distrosOf(fam.id).map((d) => (
              <Option
                key={d.id}
                onClick={() => {
                  setDistro(d.id);
                  setStep(2);
                }}
                color={fam.color}
              >
                <span className="font-crt text-lg text-muted">tux@{d.hostname}:~$</span>
                <span className="mt-1 block font-game text-2xl">{d.name}</span>
                <span className="mt-2 block text-muted">{d.description}</span>
              </Option>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 md:grid-cols-3">
            {DIFFICULTIES.map((d, i) => (
              <Option
                key={d.id}
                onClick={() => {
                  setDifficulty(d.id);
                  setStep(3);
                }}
                color={["#4cff8f", "#ffd23f", "#ff5c6c"][i]}
              >
                <span className="flex items-center justify-between">
                  <span className="font-game text-2xl">{d.name}</span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((s) => (
                      <PixelStar key={s} size={18} filled={s <= i} />
                    ))}
                  </span>
                </span>
                <span className="mt-2 block text-muted">{d.commands}</span>
                <span className="mt-4 grid gap-2 font-game text-lg">
                  <span className="flex items-center gap-2">
                    <PixelClock size={16} /> {d.seconds ? `${d.seconds} s por reto` : "Sin límite"}
                  </span>
                  <span className="flex items-center gap-2">
                    <PixelBulb size={14} /> {d.hintCost === null ? "Sin pistas" : d.hintCost === 0 ? "Pistas gratis" : `Pista: ${d.hintCost} monedas`}
                  </span>
                  <span className="flex items-center gap-2 text-accent">
                    <PixelCoin size={16} /> +{d.coins} por acierto
                  </span>
                </span>
              </Option>
            ))}
          </div>
        )}

        {step === 3 && family && distro && difficulty && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Option onClick={() => router.push(`/jugar/misiones?familia=${family}&categoria=${distro}&dificultad=${difficulty}`)} color="#3be8ff">
              <span className="flex items-center gap-4">
                <PixelTux size={48} />
                <span>
                  <span className="block font-game text-2xl">Solitario</span>
                  <span className="text-muted">1 jugador</span>
                </span>
              </span>
              <span className="mt-3 block text-muted">Completa misiones a tu ritmo en la terminal simulada.</span>
              <span className="btn btn-cyan btn-sm mt-4">▶ Jugar</span>
            </Option>
            <div className="card relative p-5 opacity-70" aria-disabled="true">
              <span className="flex items-center gap-4">
                <span className="flex -space-x-3">
                  <PixelTux size={40} />
                  <PixelTux size={40} />
                </span>
                <span>
                  <span className="block font-game text-2xl">Multijugador</span>
                  <span className="text-muted">2 a 4 jugadores</span>
                </span>
              </span>
              <span className="mt-3 block text-muted">Salas privadas con código para competir en tiempo real.</span>
              <span className="chip mt-4 text-muted">
                <PixelLock size={14} /> Próximamente
              </span>
            </div>
          </div>
        )}
      </section>

      {step > 0 && (
        <button className="btn btn-ghost btn-sm mt-8" onClick={() => setStep(step - 1)}>
          ◀ Atrás
        </button>
      )}
    </div>
  );
}

function Option({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} className="card pop group relative block w-full p-5 text-left transition-transform hover:-translate-y-1 focus-visible:-translate-y-1">
      <span className="absolute inset-x-0 top-0 h-2 border-b-[3px] border-ink" style={{ background: color }} aria-hidden="true" />
      <span className="mt-1 block">{children}</span>
      <span className="pointer-events-none absolute right-3 top-4 font-pixel text-xs text-accent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
        ▶
      </span>
    </button>
  );
}
