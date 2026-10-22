"use client";

import { useMemo, useRef, useState } from "react";
import type { GameProps } from "./types";

/**
 * Candado de permisos: marcar en la rejilla los nueve interruptores que
 * corresponden al permiso que se pide con palabras.
 *
 * Mientras se marca se ve a la vez la forma en letras (rwxr-xr--) y en
 * números (754), que es justo la traducción que cuesta interiorizar.
 */
const QUIEN = ["dueño", "grupo", "otros"] as const;
const QUE = ["r", "w", "x"] as const;
const NOMBRE: Record<string, string> = { r: "leer", w: "escribir", x: "ejecutar" };

/** Rondas: lo que se pide y los nueve bits esperados, por filas. */
const RONDAS: { text: string; bits: boolean[][]; why: string }[] = [
  {
    text: "El dueño puede hacer de todo y nadie más puede tocarlo.",
    bits: [[true, true, true], [false, false, false], [false, false, false]],
    why: "rwx------ es 700: lo típico de una carpeta privada como ~/.ssh.",
  },
  {
    text: "El dueño lo lee y lo escribe; el grupo y los demás solo lo leen.",
    bits: [[true, true, false], [true, false, false], [true, false, false]],
    why: "rw-r--r-- es 644: el permiso normal de un archivo de texto.",
  },
  {
    text: "Todo el mundo puede leerlo y ejecutarlo, pero solo el dueño escribirlo.",
    bits: [[true, true, true], [true, false, true], [true, false, true]],
    why: "rwxr-xr-x es 755: lo que lleva un programa o una carpeta que todos recorren.",
  },
  {
    text: "El dueño y el grupo trabajan con él; los demás ni lo ven.",
    bits: [[true, true, true], [true, true, true], [false, false, false]],
    why: "rwxrwx--- es 770: carpeta compartida por un equipo y cerrada al resto.",
  },
  {
    text: "Nadie puede escribirlo, ni siquiera su dueño. Solo leerlo.",
    bits: [[true, false, false], [true, false, false], [true, false, false]],
    why: "r--r--r-- es 444: un archivo que se deja de solo lectura a propósito.",
  },
  {
    text: "El dueño lo lee, lo escribe y lo ejecuta; el grupo lo lee; los demás nada.",
    bits: [[true, true, true], [true, false, false], [false, false, false]],
    why: "rwxr----- es 740: un script que solo el dueño corre y el grupo puede consultar.",
  },
];

const vacio = () => [
  [false, false, false],
  [false, false, false],
  [false, false, false],
];

const letras = (b: boolean[][]) => b.map((f) => QUE.map((q, i) => (f[i] ? q : "-")).join("")).join("");
const octal = (b: boolean[][]) => b.map((f) => (f[0] ? 4 : 0) + (f[1] ? 2 : 0) + (f[2] ? 1 : 0)).join("");

export function Candado({ chapter, onFinish }: GameProps) {
  const rondas = useMemo(() => RONDAS.slice(0, Math.min(chapter.rounds, RONDAS.length)), [chapter.rounds]);
  const [idx, setIdx] = useState(0);
  const [bits, setBits] = useState(vacio);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const doneRef = useRef(false);

  const r = rondas[idx];
  const bien = letras(bits) === letras(r.bits);

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
    setBits(vacio());
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
        <h2 className="text-2xl font-semibold leading-snug">{r.text}</h2>
        <p className="mt-1 text-muted">Marca los permisos en la rejilla.</p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[320px]">
            <thead>
              <tr>
                <th className="pb-2 pr-4 text-left font-game text-lg text-muted">Quién</th>
                {QUE.map((q) => (
                  <th key={q} className="px-2 pb-2 text-center font-game text-lg text-muted">
                    {NOMBRE[q]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bits.map((fila, f) => (
                <tr key={QUIEN[f]}>
                  <th className="py-1 pr-4 text-left font-game text-xl">{QUIEN[f]}</th>
                  {fila.map((on, c) => {
                    const esperado = r.bits[f][c];
                    const acertado = checked && on === esperado;
                    return (
                      <td key={c} className="px-2 py-1 text-center">
                        <button
                          className={`grid h-12 w-12 place-items-center border-[3px] border-ink font-crt text-2xl disabled:!opacity-100 ${
                            checked
                              ? acertado
                                ? "bg-ok text-[#002a10]"
                                : "bg-bad text-[#2b0008]"
                              : on
                                ? "bg-accent text-accent-ink"
                                : "bg-bg-2 text-muted"
                          }`}
                          style={{ boxShadow: "3px 3px 0 #06030f" }}
                          disabled={checked}
                          aria-pressed={on}
                          aria-label={`${NOMBRE[QUE[c]]} para ${QUIEN[f]}`}
                          onClick={() =>
                            setBits((b) => b.map((row, i) => (i === f ? row.map((v, j) => (j === c ? !v : v)) : row)))
                          }
                        >
                          {on ? QUE[c] : "-"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-flat mt-5 flex flex-wrap items-center justify-center gap-5 p-4">
          <span className="font-crt text-3xl text-[var(--term-text)]">{letras(bits)}</span>
          <span className="font-pixel text-lg text-accent">{octal(bits)}</span>
        </div>

        {!checked ? (
          <button className="btn btn-primary mt-5 w-full py-3" onClick={comprobar}>
            Cerrar el candado
          </button>
        ) : (
          <div
            className={`pop mt-5 border-[3px] border-ink p-4 ${bien ? "bg-ok/15" : "bg-bad/15"}`}
            style={{ boxShadow: "4px 4px 0 #06030f" }}
          >
            <p className={`font-pixel text-sm ${bien ? "text-ok" : "text-bad"}`}>{bien ? "¡ENCAJA!" : "NO ES ESE"}</p>
            {!bien && (
              <p className="mt-3 font-crt text-xl">
                Era <span className="text-accent">{letras(r.bits)}</span>, o sea{" "}
                <span className="text-accent">chmod {octal(r.bits)}</span>
              </p>
            )}
            <p className="mt-2 text-muted">{r.why}</p>
            <button className="btn btn-primary mt-4" onClick={siguiente} autoFocus>
              {idx + 1 < rondas.length ? "Siguiente candado ▶" : "Ver resultado ▶"}
            </button>
          </div>
        )}
      </section>

      <p className="mt-3 text-sm text-muted">
        Candado {idx + 1} de {rondas.length} · {score} aciertos
      </p>
    </div>
  );
}
