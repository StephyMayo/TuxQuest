"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MISSION_PASS_RATIO, MISSION_SIZE } from "@/data/catalog";
import { findRun, missionsFor, type Mission, type ProgressRow } from "@/lib/missions";
import { Stars, PixelTux, starsFor } from "@/components/Pixel";
import { FamilyBadge } from "@/components/Logos";
import { MascotPortrait } from "@/components/Mascot";
import { guideFor } from "@/data/mascots";
import { useGameParams } from "@/components/useGameParams";
import { useRequirePlayer } from "@/components/useRequirePlayer";

export function MissionList() {
  const { player, backend } = useRequirePlayer();
  const { family, distro, difficulty, valid, query } = useGameParams();
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player || !valid) return;
    Promise.all([backend.getQuestions(), backend.getProgress()])
      .then(([qs, pr]) => {
        setMissions(missionsFor(qs, family!.id, difficulty!.id));
        setProgress(pr);
      })
      .catch(() => setError("No se pudieron cargar las misiones. Revisa tu conexión."));
  }, [player, valid, backend, family, distro, difficulty]);

  const guide = guideFor(family?.id ?? "");

  if (!player) return null;
  if (!valid)
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p className="font-game text-xl">La selección no es válida.</p>
        <Link href="/jugar" className="btn btn-primary mt-4">
          Volver a elegir
        </Link>
      </div>
    );

  const avance = (topic: string) => findRun(progress, family!.id, difficulty!.id, "mision", topic);
  const done = missions?.filter((m) => avance(m.topic)?.completed).length ?? 0;
  const nextKey = missions?.find((m) => !avance(m.topic)?.completed)?.key;
  const totalStars =
    missions?.reduce((s, m) => {
      const p = avance(m.topic);
      return s + (p ? starsFor(p.bestCorrect / p.bestTotal) : 0);
    }, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/jugar" className="btn btn-ghost btn-sm">
        ◀ Cambiar selección
      </Link>

      <div className="card mt-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <FamilyBadge id={family!.id} name={family!.name} color={family!.color} size={56} />
        <div className="flex-1">
          <h1 className="pixel-title text-base sm:text-lg">MAPA DE MISIONES</h1>
          <p className="mt-2 font-game text-xl text-muted">
            {family!.name} › {difficulty!.name}
          </p>
          <p className="mt-1 font-game text-lg text-muted">
            Te acompaña <span style={{ color: guide.color }}>{guide.name}</span>, {guide.role}.
          </p>
        </div>
        <MascotPortrait familyId={family!.id} width={76} className="hidden shrink-0 sm:block" />
        {missions && (
          <div className="w-full sm:w-56">
            <div className="flex justify-between font-game text-lg">
              <span>
                {done}/{missions.length} completadas
              </span>
              <span className="text-accent">★ {totalStars}</span>
            </div>
            <div className="pixel-bar mt-1 text-ok" role="progressbar" aria-valuemin={0} aria-valuemax={missions.length} aria-valuenow={done} aria-label="Misiones completadas">
              <span style={{ width: `${(done / Math.max(1, missions.length)) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-muted">
        Cada misión tiene hasta {MISSION_SIZE} retos. Supérala acertando al menos el {MISSION_PASS_RATIO * 100}%. Consigue 3 estrellas acertando todo.
      </p>

      {error && <p className="mt-6 text-bad">{error}</p>}
      {!missions && !error && <p className="mt-6 font-game text-xl text-muted">Cargando misiones…</p>}

      <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {missions?.map((m, i) => {
          const p = avance(m.topic);
          const stars = p ? starsFor(p.bestCorrect / p.bestTotal) : 0;
          const isNext = m.key === nextKey;
          const final = m.topic === "final";
          return (
            <li key={m.key} className={`card relative flex flex-col p-5 pt-7 ${isNext ? "outline-[3px] outline-offset-4 outline-accent" : ""}`}>
              <span
                className={`pixel-title absolute -top-4 left-4 border-[3px] border-ink px-2 py-1 text-[11px] ${final ? "bg-pink text-white" : p?.completed ? "bg-ok text-[#002a10]" : "bg-accent text-accent-ink"}`}
                style={{ textShadow: "none" }}
              >
                {final ? "JEFE FINAL" : `NIVEL ${String(i + 1).padStart(2, "0")}`}
              </span>
              {isNext && (
                <span className="absolute -top-5 right-4 flex items-center gap-1 font-game text-sm text-accent">
                  <PixelTux size={26} bob /> ¡Aquí!
                </span>
              )}
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-2xl font-semibold leading-tight">{m.title}</h2>
              </div>
              <p className="mt-1 flex-1 text-muted">{m.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <Stars count={stars} size={20} />
                <span className="font-crt text-lg text-muted">
                  {Math.min(MISSION_SIZE, m.pool.length)} retos{p && ` · ${Math.round((p.bestCorrect / p.bestTotal) * 100)}%`}
                </span>
              </div>
              <Link href={`/jugar/partida?${query}&mision=${m.topic}`} className={`btn mt-4 ${p?.completed ? "btn-ghost" : final ? "btn-pink" : "btn-primary"}`}>
                {p?.completed ? "↻ Repetir" : p ? "▶ Reintentar" : "▶ Jugar"}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
