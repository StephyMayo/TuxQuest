"use client";

import { useMemo, useRef, useState } from "react";
import { RASTRO } from "@/data/minijuegos";
import { shuffled } from "@/lib/story";
import type { GameProps } from "./types";

/**
 * Sigue el rastro: dado un patrón, marcar las líneas que encajan.
 *
 * Es lo que hacen por dentro `find -name` y `grep`: comparar cada nombre o
 * cada línea contra un patrón. Aquí se practica el patrón, sin teclear.
 */
export function Rastro({ chapter, onFinish }: GameProps) {
  const rondas = useMemo(() => shuffled(RASTRO).slice(0, Math.min(chapter.rounds, RASTRO.length)), [chapter.rounds]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const doneRef = useRef(false);

  const r = rondas[idx];
  // Acierta si marcó exactamente las que encajan: ni una de menos ni una de más.
  const bien = r.lines.every((l, i) => l.match === picked.has(i));

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
    setPicked(new Set());
    setChecked(false);
  }

  return (
    <div>
      <div className="flex gap-1.5" aria-hidden="true">
        {rondas.map((_, i) => (
          <div key={i} className={`h-3 flex-1 border-2 border-ink ${i < idx ? "bg-ok" : i === idx ? "bg-accent" : "bg-bg-2"}`} />
        ))}
      </div>

      <section className={`card mt-4 p-5 sm:p-6 ${checked && !bien ? "shake" : ""}`}>
        <p className="font-game text-xl text-muted">Marca todas las líneas que encajan con este patrón:</p>
        <code className="crt mt-2 inline-block border-[3px] border-ink px-3 py-2 font-crt text-2xl text-accent">{r.pattern}</code>
        <p className="mt-2 font-crt text-lg text-muted">Como si escribieras: {r.tool}</p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {r.lines.map((l, i) => {
            const marcada = picked.has(i);
            const acertada = checked && l.match === marcada;
            return (
              <li key={i}>
                <button
                  className={`btn btn-sm w-full justify-start text-left disabled:!opacity-100 ${
                    checked
                      ? acertada
                        ? "bg-ok text-[#002a10]"
                        : "bg-bad text-[#2b0008]"
                      : marcada
                        ? "btn-cyan"
                        : "btn-ghost"
                  }`}
                  disabled={checked}
                  aria-pressed={marcada}
                  onClick={() =>
                    setPicked((p) => {
                      const n = new Set(p);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-bg-2 font-pixel text-[9px]">
                    {marcada ? "✔" : ""}
                  </span>
                  <span className="font-crt text-xl font-normal">{l.text}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {!checked ? (
          <button className="btn btn-primary mt-5 w-full py-3" onClick={comprobar}>
            Comprobar
          </button>
        ) : (
          <div className={`pop mt-5 border-[3px] border-ink p-4 ${bien ? "bg-ok/15" : "bg-bad/15"}`} style={{ boxShadow: "4px 4px 0 #06030f" }}>
            <p className={`font-pixel text-sm ${bien ? "text-ok" : "text-bad"}`}>{bien ? "¡EXACTO!" : "NO DEL TODO"}</p>
            <p className="mt-2 text-muted">{r.hint}</p>
            <button className="btn btn-primary mt-4" onClick={siguiente} autoFocus>
              {idx + 1 < rondas.length ? "Siguiente ▶" : "Ver resultado ▶"}
            </button>
          </div>
        )}
      </section>

      <p className="mt-3 text-sm text-muted">
        Ronda {idx + 1} de {rondas.length} · {score} aciertos
      </p>
    </div>
  );
}
