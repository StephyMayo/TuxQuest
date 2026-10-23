"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACTS, BOSSES, GAMES, STORY } from "@/data/story";
import { findRun, type ProgressRow } from "@/lib/missions";
import { BossSprite, EnemySprite } from "@/components/story/Enemies";
import { FamilyBadge } from "@/components/Logos";
import { PixelLock, PixelTux, Stars, starsFor } from "@/components/Pixel";
import { useGameParams } from "@/components/useGameParams";
import { useRequirePlayer } from "@/components/useRequirePlayer";

export function StoryMap() {
  const { player, backend } = useRequirePlayer();
  const { family, difficulty, valid, query } = useGameParams();
  const [progress, setProgress] = useState<ProgressRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!player || !valid) return;
    backend
      .getProgress()
      .then(setProgress)
      .catch(() => setError(true));
  }, [player, valid, backend]);

  if (!player) return null;
  if (!valid)
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p className="font-game text-xl">Primero elige mundo y dificultad.</p>
        <Link href="/jugar" className="btn btn-primary mt-4">
          Ir a elegir
        </Link>
      </div>
    );

  // El progreso de la historia es de esta familia y dificultad, no global.
  const avance = (topic: string) =>
    progress ? findRun(progress, family!.id, difficulty!.id, "story", topic) : undefined;
  const hechos = STORY.filter((c) => avance(c.topic)?.completed).length;
  // Se avanza en orden: un capítulo se abre al superar el anterior.
  const abierto = (i: number) => i === 0 || !!avance(STORY[i - 1].topic)?.completed;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`/jugar?${query}`} className="btn btn-ghost btn-sm">
        ◀ Cambiar selección
      </Link>

      <div className="card mt-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <FamilyBadge id={family!.id} name={family!.name} color={family!.color} size={56} />
        <div className="flex-1">
          <h1 className="pixel-title text-base sm:text-lg">EL CAMINO DE LA TERMINAL</h1>
          <p className="mt-2 font-game text-xl text-muted">
            {family!.name} › {difficulty!.name}
          </p>
          <p className="mt-1 text-muted">
            Nueve capítulos, nueve minijuegos distintos. En cada uno aprendes un grupo de comandos y lo pones a prueba de otra manera.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <div className="flex justify-between font-game text-lg">
            <span>
              {hechos}/{STORY.length} capítulos
            </span>
          </div>
          <div
            className="pixel-bar mt-1 text-ok"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={STORY.length}
            aria-valuenow={hechos}
            aria-label="Capítulos superados"
          >
            <span style={{ width: `${(hechos / STORY.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {error && <p className="mt-6 text-bad">No se pudo cargar tu progreso. Revisa tu conexión.</p>}
      {!progress && !error && <p className="mt-6 font-game text-xl text-muted">Cargando la historia…</p>}

      {progress &&
        [1, 2, 3].map((act) => (
          <section key={act} className="mt-10" aria-labelledby={`acto-${act}`}>
            <h2 id={`acto-${act}`} className="pixel-title text-sm">
              {ACTS[act].title.toUpperCase()}
            </h2>
            <p className="mt-2 text-muted">{ACTS[act].subtitle}</p>

            <ol className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {STORY.map((c, i) => ({ c, i })).filter(({ c }) => c.act === act).map(({ c, i }) => {
                const p = avance(c.topic);
                const libre = abierto(i);
                const stars = p ? starsFor(p.bestCorrect / p.bestTotal) : 0;
                const siguiente = libre && !p?.completed;
                return (
                  <li
                    key={c.topic}
                    className={`card relative flex flex-col p-5 pt-7 ${siguiente ? "outline-[3px] outline-offset-4 outline-accent" : ""} ${
                      libre ? "" : "opacity-60"
                    }`}
                  >
                    <span
                      className={`pixel-title absolute -top-4 left-4 border-[3px] border-ink px-2 py-1 text-[11px] ${
                        p?.completed ? "bg-ok text-[#002a10]" : c.boss ? "bg-pink text-white" : "bg-accent text-accent-ink"
                      }`}
                      style={{ textShadow: "none" }}
                    >
                      CAP. {String(i + 1).padStart(2, "0")}
                    </span>
                    {siguiente && (
                      <span className="absolute -top-5 right-4 flex items-center gap-1 font-game text-sm text-accent">
                        <PixelTux size={26} bob /> ¡Aquí!
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-2xl font-semibold leading-tight">{c.title}</h3>
                        <p className="font-crt text-lg leading-none text-muted">{c.place}</p>
                      </div>
                      {c.boss && <BossSprite id={c.boss} size={44} className="shrink-0" />}
                    </div>

                    <p className="mt-2 flex-1 text-muted">{c.lesson}</p>

                    <div className="mt-3 flex items-center gap-2">
                      {c.enemies.map((e) => (
                        <EnemySprite key={e} id={e} size={22} />
                      ))}
                      <span className="ml-auto chip font-game text-sm text-cyan">{GAMES[c.game].name}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Stars count={stars} size={20} />
                      {c.boss && <span className="font-game text-base text-pink">{BOSSES[c.boss].name}</span>}
                    </div>

                    {libre ? (
                      <Link
                        href={`/historia/capitulo?${query}&mision=${c.topic}`}
                        className={`btn mt-4 ${p?.completed ? "btn-ghost" : c.boss ? "btn-pink" : "btn-primary"}`}
                      >
                        {p?.completed ? "↻ Repetir" : p ? "▶ Reintentar" : "▶ Jugar"}
                      </Link>
                    ) : (
                      <p className="card-flat mt-4 flex items-center gap-2 p-3 text-sm text-muted">
                        <PixelLock size={16} /> Supera el capítulo anterior
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
    </div>
  );
}
