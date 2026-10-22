"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Goal } from "@/data/story";
import { Shell } from "@/lib/shell";
import { Terminal, type TerminalHandle } from "@/components/Terminal";
import { PixelTux } from "@/components/Pixel";
import type { GameProps } from "./types";

/**
 * Terminal guiada: la shell simulada de verdad, con una lista de objetivos
 * que se van marcando solos según lo que haga el jugador.
 *
 * Aquí no se pierde: se puede trastear todo lo que haga falta. Es el
 * minijuego de los capítulos en los que lo que toca es perder el miedo.
 */
export function TerminalGuiada({ chapter, family, onFinish }: GameProps) {
  const goals = useMemo<Goal[]>(() => chapter.goals ?? [], [chapter.goals]);
  // La distribución de referencia de la familia es la que da el prompt.
  const shell = useMemo(() => {
    const d = { debian: "debian", arch: "archlinux", redhat: "fedora", suse: "tumbleweed" }[family.id];
    return new Shell(d, d, family.id, family.name, "~");
  }, [family]);

  const [done, setDone] = useState<boolean[]>(() => goals.map(() => false));
  const termRef = useRef<TerminalHandle>(null);
  const doneRef = useRef(false);

  /** Mira la shell y marca los objetivos que ya estén cumplidos. */
  const revisar = useCallback(() => {
    setDone((prev) =>
      goals.map((g, i) => {
        if (prev[i]) return true; // lo cumplido no se descumple
        if (g.kind === "ran") return shell.hasRun(g.prefix);
        if (g.kind === "cwd") return shell.here === g.path;
        if (g.kind === "exists") return shell.peek(g.path) !== null;
        return shell.peek(g.path) === null;
      }),
    );
  }, [goals, shell]);

  const hechos = done.filter(Boolean).length;

  useEffect(() => {
    if (hechos !== goals.length || goals.length === 0 || doneRef.current) return;
    doneRef.current = true;
    const t = setTimeout(() => onFinish(goals.length, goals.length), 1200);
    return () => clearTimeout(t);
  }, [hechos, goals.length, onFinish]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className="card p-5" aria-labelledby="objetivos">
        <h2 id="objetivos" className="pixel-title text-sm">
          OBJETIVOS
        </h2>
        <div
          className="pixel-bar mt-3 text-ok"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goals.length}
          aria-valuenow={hechos}
          aria-label="Objetivos cumplidos"
        >
          <span style={{ width: `${(hechos / Math.max(1, goals.length)) * 100}%` }} />
        </div>

        <ol className="mt-5 space-y-3">
          {goals.map((g, i) => (
            <li key={i} className={`flex items-start gap-3 ${done[i] ? "text-ok" : "text-muted"}`}>
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-ink font-pixel text-[9px] ${
                  done[i] ? "bg-ok text-[#002a10]" : "bg-bg-2"
                }`}
              >
                {done[i] ? "✔" : i + 1}
              </span>
              <span className={done[i] ? "line-through" : ""}>{g.text}</span>
            </li>
          ))}
        </ol>

        {hechos === goals.length && goals.length > 0 && (
          <p className="pop mt-5 flex items-center gap-2 font-game text-xl text-accent">
            <PixelTux size={28} bob /> Todo hecho.
          </p>
        )}

        <p className="mt-6 text-sm text-muted">
          Aquí no se pierde nada: prueba lo que quieras. Si te atascas, <code className="font-crt text-lg">ls</code> y{" "}
          <code className="font-crt text-lg">pwd</code> casi siempre son el principio.
        </p>
      </section>

      <section aria-label="Terminal">
        <Terminal
          ref={termRef}
          shell={shell}
          onSubmit={() => {
            // Se revisa en el siguiente tick, cuando la shell ya ejecutó.
            setTimeout(revisar, 0);
            return true;
          }}
          intro={`# ${family.name} · escribe comandos y ve cumpliendo los objetivos.`}
        />
        <p className="mt-3 text-xs text-muted">
          ↑/↓ historial · Tab autocompletar · Ctrl+L limpiar. Nada de lo que escribas afecta a tu computadora.
        </p>
      </section>
    </div>
  );
}
