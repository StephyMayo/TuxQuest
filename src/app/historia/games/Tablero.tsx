"use client";

import { useMemo, useRef, useState } from "react";
import { ACCIONES, SERVICIOS, type AccionServicio } from "@/data/minijuegos";
import { BOSSES } from "@/data/story";
import { shuffled } from "@/lib/story";
import { BossSprite } from "@/components/story/Enemies";
import type { GameProps } from "./types";

const COLOR: Record<string, string> = { activo: "text-ok", parado: "text-muted", fallido: "text-bad" };

/**
 * Tablero de servicios: llevar cada uno de su estado actual al que se pide,
 * eligiendo la acción de systemctl correcta.
 *
 * Lo que se practica es la diferencia entre start, restart, enable y status,
 * que es donde se equivoca todo el mundo al empezar con systemd.
 */
export function Tablero({ chapter, onFinish }: GameProps) {
  const rondas = useMemo(() => shuffled(SERVICIOS).slice(0, Math.min(chapter.rounds, SERVICIOS.length)), [chapter.rounds]);
  const [idx, setIdx] = useState(0);
  const [elegida, setElegida] = useState<AccionServicio | null>(null);
  const [score, setScore] = useState(0);
  const doneRef = useRef(false);

  const r = rondas[idx];
  const esUltima = idx === rondas.length - 1;
  const bien = elegida === r.answer;

  function elegir(a: AccionServicio) {
    if (elegida) return;
    setElegida(a);
    if (a === r.answer) setScore((s) => s + 1);
  }

  function siguiente() {
    if (esUltima) {
      if (!doneRef.current) {
        doneRef.current = true;
        onFinish(score, rondas.length);
      }
      return;
    }
    setIdx((i) => i + 1);
    setElegida(null);
  }

  return (
    <div>
      <div className="flex gap-1.5" aria-hidden="true">
        {rondas.map((_, i) => (
          <div key={i} className={`h-3 flex-1 border-2 border-ink ${i < idx ? "bg-ok" : i === idx ? "bg-accent" : "bg-bg-2"}`} />
        ))}
      </div>

      {chapter.boss && esUltima && (
        <div className="card-flat mt-4 flex items-center gap-3 p-3">
          <BossSprite id={chapter.boss} size={44} />
          <div>
            <p className="font-pixel text-[10px] text-pink">ÚLTIMO SERVICIO · {BOSSES[chapter.boss].name.toUpperCase()}</p>
            <p className="font-game text-base text-muted">{BOSSES[chapter.boss].taunt}</p>
          </div>
        </div>
      )}

      <section className={`card mt-4 p-5 sm:p-6 ${elegida && !bien ? "shake" : ""}`}>
        <div className="card-flat flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="font-crt text-2xl text-[var(--term-text)]">{r.name}.service</span>
          <span className={`chip font-game text-base ${COLOR[r.from]}`}>
            {r.from === "activo" ? "● activo" : r.from === "parado" ? "○ parado" : "✖ fallido"}
          </span>
        </div>

        <h2 className="mt-5 text-2xl font-semibold leading-snug">Hay que {r.goal}.</h2>
        <p className="mt-1 text-muted">¿Qué acción de systemctl usarías?</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(Object.keys(ACCIONES) as AccionServicio[]).map((a) => {
            const buena = elegida && a === r.answer;
            const fallada = elegida === a && a !== r.answer;
            return (
              <button
                key={a}
                onClick={() => elegir(a)}
                disabled={!!elegida}
                className={`btn justify-start text-left disabled:!opacity-100 ${
                  buena ? "bg-ok text-[#002a10]" : fallada ? "bg-bad text-[#2b0008]" : "btn-ghost"
                }`}
              >
                <span className="font-crt text-xl font-normal">
                  {ACCIONES[a]} {r.name}
                </span>
              </button>
            );
          })}
        </div>

        <div aria-live="assertive">
          {elegida && (
            <div
              className={`pop mt-5 border-[3px] border-ink p-4 ${bien ? "bg-ok/15" : "bg-bad/15"}`}
              style={{ boxShadow: "4px 4px 0 #06030f" }}
            >
              <p className={`font-pixel text-sm ${bien ? "text-ok" : "text-bad"}`}>{bien ? "¡ESA ES!" : "NO ERA ESA"}</p>
              <p className="mt-2 text-muted">{r.why}</p>
              <button className="btn btn-primary mt-4" onClick={siguiente} autoFocus>
                {esUltima ? "Ver resultado ▶" : "Siguiente servicio ▶"}
              </button>
            </div>
          )}
        </div>
      </section>

      <p className="mt-3 text-sm text-muted">
        Servicio {idx + 1} de {rondas.length} · {score} aciertos
      </p>
    </div>
  );
}
