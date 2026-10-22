"use client";

import { useMemo, useRef, useState } from "react";
import { PROCESOS, type Proceso } from "@/data/minijuegos";
import { BOSSES } from "@/data/story";
import { shuffled } from "@/lib/story";
import { BossSprite } from "@/components/story/Enemies";
import type { GameProps } from "./types";

/**
 * Sala de procesos: cerrar los que sobran sin tocar los del sistema.
 *
 * Se escribe `kill <pid>` de verdad, que es lo que se hace en una máquina.
 * Matar un proceso del sistema resta, para que no valga cerrarlos todos.
 */
export function Procesos({ chapter, onFinish }: GameProps) {
  const tabla = useMemo(() => {
    const lista = shuffled(PROCESOS).sort((a, b) => a.pid - b.pid);
    // El jefe del capítulo es un proceso más de la tabla, el que no se deja.
    if (!chapter.boss) return lista;
    const b = BOSSES[chapter.boss];
    return [
      ...lista,
      {
        pid: 9999,
        user: "root",
        cpu: 99.9,
        mem: 12.0,
        state: "R",
        cmd: `[${b.name.toLowerCase().replace(/ /g, "-")}]`,
        rogue: true,
        why: "Estaba consumiendo la máquina entera. Era el que mantenía todo lo demás colgado.",
      } as Proceso,
    ];
  }, [chapter.boss]);

  const sobran = tabla.filter((p) => p.rogue).length;
  const [muertos, setMuertos] = useState<number[]>([]);
  const [typed, setTyped] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [errores, setErrores] = useState(0);
  const [fin, setFin] = useState(false);
  const doneRef = useRef(false);

  const vivos = tabla.filter((p) => !muertos.includes(p.pid));
  const restantes = vivos.filter((p) => p.rogue).length;

  function matar(pid: number) {
    const p = tabla.find((x) => x.pid === pid);
    if (!p) return setAviso(`No hay ningún proceso con el PID ${pid}.`);
    if (muertos.includes(pid)) return setAviso(`El PID ${pid} ya estaba cerrado.`);

    setMuertos((m) => [...m, pid]);
    if (p.rogue) {
      setAviso(`✔ ${p.cmd} cerrado. ${p.why}`);
      if (restantes - 1 === 0) terminar([...muertos, pid]);
    } else {
      setErrores((e) => e + 1);
      setAviso(`✖ ${p.cmd} era del sistema. ${p.why}`);
    }
  }

  function terminar(cerrados: number[]) {
    if (doneRef.current) return;
    doneRef.current = true;
    setFin(true);
    const malos = cerrados.filter((pid) => !tabla.find((p) => p.pid === pid)?.rogue).length;
    setTimeout(() => onFinish(Math.max(0, sobran - malos), sobran), 900);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = typed.trim().match(/^kill\s+(?:-9\s+)?(\d+)$/i);
    setTyped("");
    if (!m) return setAviso("Escríbelo como en la terminal: kill seguido del PID. Por ejemplo: kill 2210");
    matar(Number(m[1]));
  }

  return (
    <div>
      <div className="flex items-center justify-between font-game text-lg">
        <span>
          {sobran - restantes}/{sobran} cerrados
        </span>
        <span className={errores ? "text-bad" : "text-muted"}>{errores} del sistema por error</span>
      </div>
      <div
        className="pixel-bar mt-1 text-ok"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={sobran}
        aria-valuenow={sobran - restantes}
        aria-label="Procesos cerrados"
      >
        <span style={{ width: `${((sobran - restantes) / sobran) * 100}%` }} />
      </div>

      <div className="card crt mt-4 overflow-x-auto p-4">
        <table className="w-full min-w-[560px] font-crt text-lg">
          <thead>
            <tr className="border-b-2 border-line text-left text-muted">
              <th className="py-1 pr-3 font-normal">PID</th>
              <th className="py-1 pr-3 font-normal">USUARIO</th>
              <th className="py-1 pr-3 font-normal">%CPU</th>
              <th className="py-1 pr-3 font-normal">%MEM</th>
              <th className="py-1 pr-3 font-normal">S</th>
              <th className="py-1 font-normal">COMANDO</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((p) => {
              const muerto = muertos.includes(p.pid);
              const alto = !muerto && (p.cpu > 50 || p.state === "Z");
              return (
                <tr
                  key={p.pid}
                  className={`${muerto ? "opacity-35 line-through" : ""} ${alto ? "text-bad" : "text-[var(--term-text)]"}`}
                >
                  <td className="py-0.5 pr-3 tabular-nums">{p.pid}</td>
                  <td className="py-0.5 pr-3">{p.user}</td>
                  <td className="py-0.5 pr-3 tabular-nums">{p.cpu.toFixed(1)}</td>
                  <td className="py-0.5 pr-3 tabular-nums">{p.mem.toFixed(1)}</td>
                  <td className="py-0.5 pr-3">{p.state}</td>
                  <td className="py-0.5">{p.cmd}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {chapter.boss && !muertos.includes(9999) && (
        <div className="card-flat mt-4 flex items-center gap-3 p-3">
          <BossSprite id={chapter.boss} size={44} />
          <div>
            <p className="font-pixel text-[10px] text-pink">{BOSSES[chapter.boss].name.toUpperCase()} · PID 9999</p>
            <p className="font-game text-base text-muted">{BOSSES[chapter.boss].taunt}</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-4 flex items-center gap-3">
        <span className="font-crt text-xl text-[var(--term-prompt)]">$</span>
        <label htmlFor="kill" className="sr-only">
          Comando para cerrar un proceso
        </label>
        <input
          id="kill"
          className="input flex-1 font-crt text-xl"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={fin}
          autoComplete="off"
          spellCheck={false}
          placeholder="kill 2210"
        />
        <button type="submit" className="btn btn-primary" disabled={fin}>
          Enter
        </button>
      </form>

      <p className="mt-3 min-h-[1.5rem] font-game text-lg" aria-live="polite">
        {aviso ?? "Cierra los procesos colgados y los zombis. Los del sistema se quedan."}
      </p>
    </div>
  );
}
