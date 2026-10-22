"use client";

import { useRef, useState } from "react";
import { RUTA } from "@/data/minijuegos";
import { BOSSES } from "@/data/story";
import { BossSprite } from "@/components/story/Enemies";
import { PixelTux } from "@/components/Pixel";
import type { GameProps } from "./types";

/**
 * Sigue la ruta: recorrer los saltos de la conexión y, en cada uno, elegir la
 * herramienta con la que se comprueba ese tramo.
 *
 * Los saltos van en orden a propósito: lo que se aprende es el orden en el que
 * se diagnostica una red, de dentro hacia fuera.
 */
export function Ruta({ chapter, onFinish }: GameProps) {
  const saltos = RUTA;
  const [idx, setIdx] = useState(0);
  const [elegida, setElegida] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const doneRef = useRef(false);

  const s = saltos[idx];
  const esUltimo = idx === saltos.length - 1;
  const bien = elegida === s.answer;

  function elegir(o: string) {
    if (elegida) return;
    setElegida(o);
    if (o === s.answer) setScore((n) => n + 1);
  }

  function siguiente() {
    if (esUltimo) {
      if (!doneRef.current) {
        doneRef.current = true;
        onFinish(score, saltos.length);
      }
      return;
    }
    setIdx((i) => i + 1);
    setElegida(null);
  }

  return (
    <div>
      {/* el camino del paquete */}
      <ol className="flex flex-wrap items-center gap-1.5" aria-label="Saltos de la ruta">
        {saltos.map((h, i) => (
          <li key={h.name} className="flex items-center gap-1.5">
            <span
              className={`chip font-game text-sm ${
                i < idx ? (saltos[i].broken ? "text-bad" : "text-ok") : i === idx ? "bg-accent text-accent-ink" : "text-muted"
              }`}
            >
              {i < idx ? (saltos[i].broken ? "✖" : "✔") : i + 1} {h.name}
            </span>
            {i < saltos.length - 1 && <span className="text-muted">›</span>}
          </li>
        ))}
      </ol>

      {chapter.boss && esUltimo && (
        <div className="card-flat mt-4 flex items-center gap-3 p-3">
          <BossSprite id={chapter.boss} size={44} />
          <div>
            <p className="font-pixel text-[10px] text-pink">AL OTRO LADO · {BOSSES[chapter.boss].name.toUpperCase()}</p>
            <p className="font-game text-base text-muted">{BOSSES[chapter.boss].taunt}</p>
          </div>
        </div>
      )}

      <section className={`card mt-4 p-5 sm:p-6 ${elegida && !bien ? "shake" : ""}`}>
        <p className="font-pixel text-[11px] text-muted">
          SALTO {idx + 1} · {s.name.toUpperCase()}
        </p>
        <h2 className="mt-3 text-2xl font-semibold leading-snug">{s.question}</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {s.options.map((o) => {
            const buena = elegida && o === s.answer;
            const fallada = elegida === o && o !== s.answer;
            return (
              <button
                key={o}
                onClick={() => elegir(o)}
                disabled={!!elegida}
                className={`btn justify-start text-left disabled:!opacity-100 ${
                  buena ? "bg-ok text-[#002a10]" : fallada ? "bg-bad text-[#2b0008]" : "btn-ghost"
                }`}
              >
                <span className="font-crt text-xl font-normal">{o}</span>
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
              <p className={`font-pixel text-sm ${bien ? "text-ok" : "text-bad"}`}>
                {bien ? "COMPROBADO" : "ESA NO COMPRUEBA ESTO"}
              </p>
              {bien && (
                <code className="crt mt-3 block border-2 border-ink px-2 py-1.5 font-crt text-lg text-[var(--term-text)]">
                  {s.result}
                </code>
              )}
              <p className="mt-2 text-muted">{s.why}</p>
              {bien && s.broken && (
                <p className="mt-2 flex items-center gap-2 font-game text-lg text-accent">
                  <PixelTux size={20} /> Aquí estaba la avería.
                </p>
              )}
              <button className="btn btn-primary mt-4" onClick={siguiente} autoFocus>
                {esUltimo ? "Ver resultado ▶" : "Siguiente salto ▶"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
