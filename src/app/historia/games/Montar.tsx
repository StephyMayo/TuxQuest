"use client";

import { useMemo, useRef, useState } from "react";
import { tokenize } from "@/lib/answer";
import { correctCommand } from "@/lib/answer";
import { shuffled } from "@/lib/story";
import { PixelTux } from "@/components/Pixel";
import type { Question } from "@/data/types";
import type { GameProps } from "./types";

/**
 * Monta el comando: se da el objetivo y las piezas desordenadas, y hay que
 * pulsarlas en el orden correcto.
 *
 * No se escribe nada: lo que se practica es el orden de las partes y cuál
 * sobra, que es donde se atasca quien aún no tiene el comando memorizado.
 */
interface Ronda {
  prompt: string;
  /** Piezas en su orden correcto. */
  parts: string[];
  /** Piezas de más, para que no valga pulsarlas todas. */
  extra: string[];
  explanation: string;
}

/** Piezas señuelo según lo que haga el comando. */
const SENUELOS = ["--force", "-rf", "sudo", "-y", "all", "--now", "-a", "local"];

export function Montar({ chapter, family, questions, onFinish }: GameProps) {
  const rondas = useMemo<Ronda[]>(() => {
    const aptas = questions.filter(
      (q) =>
        q.active !== false &&
        q.topic === chapter.topic &&
        (q.type === "write" || q.type === "complete") &&
        (q.familyId === null || q.familyId === family.id),
    );
    const vistos = new Set<string>();
    const out: Ronda[] = [];
    for (const q of shuffled(aptas)) {
      const cmd = correctCommand(q as Question).trim();
      const parts = tokenize(cmd);
      // Con menos de tres piezas no hay nada que ordenar.
      if (parts.length < 3 || parts.length > 6 || vistos.has(cmd)) continue;
      vistos.add(cmd);
      const extra = shuffled(SENUELOS.filter((s) => !parts.includes(s))).slice(0, 2);
      out.push({ prompt: q.prompt, parts, extra, explanation: q.explanation });
      if (out.length >= chapter.rounds) break;
    }
    return out;
  }, [questions, chapter, family]);

  const [idx, setIdx] = useState(0);
  const [puestas, setPuestas] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const doneRef = useRef(false);

  const r = rondas[idx];
  const piezas = useMemo(() => (r ? shuffled([...r.parts, ...r.extra]) : []), [r]);
  const bien = !!r && puestas.length === r.parts.length && puestas.every((p, i) => p === r.parts[i]);

  function comprobar() {
    setChecked(true);
    if (bien) setScore((s) => s + 1);
  }

  function siguiente() {
    if (idx + 1 >= rondas.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onFinish(score, rondas.length);
      }
      return;
    }
    setIdx((i) => i + 1);
    setPuestas([]);
    setChecked(false);
  }

  if (!r)
    return <p className="card p-6 text-center font-game text-xl text-muted">No hay comandos de varias piezas para este tema.</p>;

  // cada pieza se puede usar tantas veces como aparezca en el comando
  const disponibles = piezas.filter((p) => {
    const cabe = [...r.parts, ...r.extra].filter((x) => x === p).length;
    return puestas.filter((x) => x === p).length < cabe;
  });

  return (
    <div>
      <div className="flex gap-1.5" aria-hidden="true">
        {rondas.map((_, i) => (
          <div key={i} className={`h-3 flex-1 border-2 border-ink ${i < idx ? "bg-ok" : i === idx ? "bg-accent" : "bg-bg-2"}`} />
        ))}
      </div>

      <section className={`card mt-4 p-5 sm:p-6 ${checked && !bien ? "shake" : ""}`}>
        <h2 className="text-2xl font-semibold leading-snug">{r.prompt}</h2>

        {/* lo montado hasta ahora */}
        <div className="crt mt-5 flex min-h-[64px] flex-wrap items-center gap-2 border-[3px] border-ink p-3">
          <span className="font-crt text-xl text-[var(--term-prompt)]">$</span>
          {puestas.length === 0 && <span className="font-crt text-xl text-muted">pulsa las piezas en orden…</span>}
          {puestas.map((p, i) => (
            <span
              key={i}
              className={`border-2 border-ink px-2 py-0.5 font-crt text-xl ${
                checked ? (p === r.parts[i] ? "bg-ok text-[#002a10]" : "bg-bad text-[#2b0008]") : "bg-panel-2 text-[var(--term-text)]"
              }`}
            >
              {p}
            </span>
          ))}
        </div>

        {!checked && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {disponibles.map((p, i) => (
                <button key={`${p}-${i}`} className="btn btn-ghost btn-sm font-crt" onClick={() => setPuestas((s) => [...s, p])}>
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setPuestas((s) => s.slice(0, -1))} disabled={!puestas.length}>
                ◀ Quitar la última
              </button>
              <button className="btn btn-primary flex-1" onClick={comprobar} disabled={!puestas.length}>
                Ejecutar
              </button>
            </div>
          </>
        )}

        {checked && (
          <div
            className={`pop mt-5 border-[3px] border-ink p-4 ${bien ? "bg-ok/15" : "bg-bad/15"}`}
            style={{ boxShadow: "4px 4px 0 #06030f" }}
          >
            <p className={`font-pixel text-sm ${bien ? "text-ok" : "text-bad"}`}>{bien ? "¡MONTADO!" : "ASÍ NO ARRANCA"}</p>
            {!bien && (
              <p className="mt-3 font-crt text-xl">
                Era: <span className="text-accent">{r.parts.join(" ")}</span>
              </p>
            )}
            <p className="mt-2 text-muted">{r.explanation}</p>
            <button className="btn btn-primary mt-4" onClick={siguiente} autoFocus>
              {idx + 1 < rondas.length ? "Siguiente ▶" : "Ver resultado ▶"}
            </button>
          </div>
        )}
      </section>

      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <PixelTux size={18} /> Comando {idx + 1} de {rondas.length} · {score} aciertos · dos de las piezas sobran
      </p>
    </div>
  );
}
