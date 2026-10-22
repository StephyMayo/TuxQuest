"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { correctCommand } from "@/lib/answer";
import { shuffled } from "@/lib/story";
import { PixelTux } from "@/components/Pixel";
import type { GameProps } from "./types";

/**
 * Panel de parejas: cada comando se empareja con lo que hace.
 *
 * El texto de «lo que hace» sale de la explicación de la pregunta, recortada
 * a una frase para que quepa en la carta.
 */
interface Card {
  id: number;
  pair: number;
  text: string;
  cmd: boolean;
}

/** Primera frase de la explicación, que es la que define el comando. */
const resumen = (t: string) => {
  const frase = t.split(/(?<=\.)\s/)[0] ?? t;
  return frase.length > 92 ? frase.slice(0, 89).trimEnd() + "…" : frase;
};

export function Memoria({ chapter, family, questions, onFinish }: GameProps) {
  const cards = useMemo(() => {
    const aptas = questions.filter(
      (q) =>
        q.active !== false &&
        q.topic === chapter.topic &&
        q.type !== "choice" &&
        q.explanation.length > 12 &&
        (q.familyId === null || q.familyId === family.id),
    );
    const vistos = new Set<string>();
    const parejas = [];
    for (const q of shuffled(aptas)) {
      const cmd = correctCommand(q).trim();
      if (!cmd || cmd.length > 24 || vistos.has(cmd)) continue;
      vistos.add(cmd);
      parejas.push({ cmd, desc: resumen(q.explanation) });
      if (parejas.length >= chapter.rounds) break;
    }
    const out: Card[] = [];
    parejas.forEach((p, i) => {
      out.push({ id: i * 2, pair: i, text: p.cmd, cmd: true });
      out.push({ id: i * 2 + 1, pair: i, text: p.desc, cmd: false });
    });
    return shuffled(out);
  }, [questions, chapter, family]);

  const total = cards.length / 2;
  const [abiertas, setAbiertas] = useState<number[]>([]);
  const [hechas, setHechas] = useState<number[]>([]);
  const [fallos, setFallos] = useState(0);
  const doneRef = useRef(false);

  const tapaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (tapaRef.current && clearTimeout(tapaRef.current)), []);

  /** Destapa una carta y, si ya había otra, resuelve la pareja ahí mismo. */
  function destapar(c: Card) {
    if (abiertas.length >= 2 || abiertas.includes(c.id) || hechas.includes(c.pair)) return;
    if (abiertas.length === 0) return setAbiertas([c.id]);

    const primera = cards.find((x) => x.id === abiertas[0])!;
    if (primera.pair === c.pair) {
      setHechas((h) => [...h, c.pair]);
      setAbiertas([]);
      return;
    }
    // no encajan: se enseñan un momento y se vuelven a tapar
    setAbiertas([abiertas[0], c.id]);
    setFallos((f) => f + 1);
    tapaRef.current = setTimeout(() => setAbiertas([]), 900);
  }

  useEffect(() => {
    if (hechas.length !== total || total === 0 || doneRef.current) return;
    doneRef.current = true;
    // Cada fallo se come un acierto, con un suelo: encontrar todas las
    // parejas a ciegas no puede salir peor que no encontrar ninguna.
    const t = setTimeout(() => onFinish(Math.max(0, total - Math.floor(fallos / 2)), total), 700);
    return () => clearTimeout(t);
  }, [hechas.length, total, fallos, onFinish]);

  if (total === 0)
    return <p className="card p-6 text-center font-game text-xl text-muted">No hay comandos suficientes para este panel.</p>;

  return (
    <div>
      <div className="flex items-center justify-between font-game text-lg">
        <span>
          {hechas.length}/{total} parejas
        </span>
        <span className="text-muted">{fallos} fallos</span>
      </div>
      <div
        className="pixel-bar mt-1 text-ok"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={hechas.length}
        aria-label="Parejas encontradas"
      >
        <span style={{ width: `${(hechas.length / total) * 100}%` }} />
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => {
          const resuelta = hechas.includes(c.pair);
          const abierta = resuelta || abiertas.includes(c.id);
          return (
            <li key={c.id}>
              <button
                className={`card flex h-32 w-full items-center justify-center p-3 text-center transition-transform ${
                  abierta ? "" : "hover:-translate-y-1"
                } ${resuelta ? "outline-[3px] outline-offset-2 outline-ok" : ""}`}
                onClick={() => destapar(c)}
                disabled={abierta}
                aria-label={abierta ? c.text : "Carta tapada"}
              >
                {abierta ? (
                  <span className={c.cmd ? "font-crt text-xl text-[var(--term-text)]" : "text-sm leading-tight text-muted"}>
                    {c.text}
                  </span>
                ) : (
                  <PixelTux size={38} />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted">Destapa dos cartas: un comando y lo que hace. Si encajan, se quedan.</p>
    </div>
  );
}
