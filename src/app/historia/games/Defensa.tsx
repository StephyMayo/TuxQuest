"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOSSES, ENEMIES, type BossId, type EnemyId } from "@/data/story";
import { OWN_SHARE, SPAWN, SPEED, commandsFor, shuffled } from "@/lib/story";
import { BossSprite, EnemySprite } from "@/components/story/Enemies";
import { PixelHeart, PixelTux } from "@/components/Pixel";
import type { GameProps } from "./types";

/**
 * Defensa de la terminal: los enemigos avanzan hacia Tux con un comando
 * encima y se derriban escribiéndolo. Si uno llega, cuesta una vida.
 *
 * Es el único minijuego con prisa de verdad: el resto deja pensar.
 */
interface Live {
  key: number;
  kind: EnemyId | null;
  boss: BossId | null;
  cmd: string;
  /** 0 = encima de Tux, 100 = acaba de aparecer. */
  x: number;
  lane: number;
  speed: number;
  hitsLeft: number;
  age: number;
  shielded: boolean;
  shard?: boolean;
}

const LANES = 4;
const VIDAS = 3;

export function Defensa({ chapter, family, rules, questions, onFinish }: GameProps) {
  const pool = useMemo(() => {
    const c = commandsFor(questions, family.id, chapter, rules.id);
    return { own: shuffled(c.own), review: shuffled(c.review) };
  }, [questions, family, chapter, rules]);

  const [enemies, setEnemies] = useState<Live[]>([]);
  const [typed, setTyped] = useState("");
  const [lives, setLives] = useState(VIDAS);
  const [kills, setKills] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  const livesRef = useRef(VIDAS);
  const spawnedRef = useRef(0);
  const keyRef = useRef(0);
  const bossOutRef = useRef(false);
  const doneRef = useRef(false);
  const killsRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Comando para un enemigo nuevo: casi siempre del capítulo, a veces de repaso. */
  const nextCmd = useCallback(() => {
    const usaPropio = pool.own.length > 0 && (pool.review.length === 0 || Math.random() < OWN_SHARE);
    const lista = usaPropio ? pool.own : pool.review;
    return lista.length ? lista[Math.floor(Math.random() * lista.length)] : "ls";
  }, [pool]);

  const acabar = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onFinish(killsRef.current, chapter.rounds);
  }, [onFinish, chapter.rounds]);

  // --- bucle del juego ---
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let sinceSpawn = 0;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      sinceSpawn += dt;
      if (sinceSpawn >= SPAWN[rules.id] && spawnedRef.current < chapter.rounds) {
        sinceSpawn = 0;
        spawnedRef.current++;
        const kind = chapter.enemies[Math.floor(Math.random() * chapter.enemies.length)];
        setEnemies((es) => [...es, make(keyRef.current++, kind, nextCmd(), rules.id, es)]);
      }

      setEnemies((es) => {
        let perdidas = 0;
        const vivos: Live[] = [];
        for (const e of es) {
          const age = e.age + dt;
          // la fuga de memoria va cada vez más rápido
          const acel = e.kind === "fuga" ? 1 + Math.min(1.4, age / 7) : 1;
          const x = e.x - e.speed * acel * dt;
          if (x <= 0) {
            perdidas++;
            continue;
          }
          vivos.push({ ...e, x, age });
        }
        // los huérfanos protegen al que tengan más cerca
        for (const v of vivos) v.shielded = false;
        for (const g of vivos.filter((e) => e.kind === "huerfano")) {
          let mejor: Live | null = null;
          for (const v of vivos) {
            if (v === g || v.kind === "huerfano") continue;
            if (!mejor || Math.abs(v.x - g.x) < Math.abs(mejor.x - g.x)) mejor = v;
          }
          if (mejor) mejor.shielded = true;
        }
        if (perdidas) {
          livesRef.current = Math.max(0, livesRef.current - perdidas);
          setLives(livesRef.current);
          setCombo(0);
          setFlash("¡Se te coló!");
          if (livesRef.current === 0) acabar();
        }
        return vivos;
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [chapter, rules, nextCmd, acabar]);

  // --- jefe al final, y cierre del capítulo ---
  useEffect(() => {
    if (doneRef.current) return;
    if (spawnedRef.current < chapter.rounds || enemies.length > 0) return;

    if (chapter.boss && !bossOutRef.current) {
      bossOutRef.current = true;
      const b = BOSSES[chapter.boss];
      setFlash(b.taunt);
      setEnemies([
        {
          key: keyRef.current++,
          kind: null,
          boss: chapter.boss,
          cmd: nextCmd(),
          x: 100,
          lane: 1,
          speed: SPEED[rules.id] * b.speed,
          hitsLeft: b.hits,
          age: 0,
          shielded: false,
        },
      ]);
      return;
    }
    if (!chapter.boss || bossOutRef.current) acabar();
  }, [enemies.length, chapter, rules, nextCmd, acabar]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /** El enemigo al que apunta lo escrito: el más cercano a Tux que encaje. */
  const target = useMemo(() => {
    if (!typed) return null;
    const t = typed.toLowerCase();
    return [...enemies].filter((e) => e.cmd.toLowerCase().startsWith(t)).sort((a, b) => a.x - b.x)[0] ?? null;
  }, [enemies, typed]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = typed.trim();
    if (!t) return;
    const golpeado = [...enemies].filter((x) => x.cmd.toLowerCase() === t.toLowerCase()).sort((a, b) => a.x - b.x)[0];
    setTyped("");
    if (!golpeado) {
      setCombo(0);
      setFlash("Ese comando no es de ninguno");
      return;
    }
    if (golpeado.shielded) {
      setFlash("Protegido: quita antes al demonio huérfano");
      return;
    }
    setEnemies((es) => {
      const out: Live[] = [];
      for (const e of es) {
        if (e.key !== golpeado.key) {
          out.push(e);
          continue;
        }
        if (e.hitsLeft > 1) {
          out.push({ ...e, hitsLeft: e.hitsLeft - 1, cmd: nextCmd() });
          continue;
        }
        // el paquete roto se parte en dos trozos
        if (e.kind === "roto" && !e.shard) {
          for (const d of [-1, 1]) {
            out.push({
              ...e,
              key: keyRef.current++,
              cmd: nextCmd(),
              x: Math.min(100, e.x + 4),
              lane: (e.lane + (d < 0 ? 1 : LANES - 1)) % LANES,
              speed: e.speed * 1.15,
              hitsLeft: 1,
              shard: true,
            });
          }
        }
      }
      return out;
    });
    killsRef.current += 1;
    setKills(killsRef.current);
    setCombo((c) => c + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1" aria-label={`${lives} vidas`}>
          {Array.from({ length: VIDAS }, (_, i) => (
            <span key={i} className={i < lives ? "" : "opacity-25 grayscale"}>
              <PixelHeart size={18} />
            </span>
          ))}
        </span>
        <span className="chip font-pixel text-[10px]">{Math.max(0, chapter.rounds - kills)} quedan</span>
        {combo >= 3 && <span className="chip font-pixel text-[10px] text-[#ff9a3c]">COMBO x{combo}</span>}
      </div>

      <div className="card crt relative mt-3 h-[340px] overflow-hidden sm:h-[400px]">
        <div className="absolute bottom-3 left-3 z-10">
          <PixelTux size={54} bob />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-[58px] z-0 w-[3px] bg-bad/40" aria-hidden="true" />

        {enemies.map((e) => {
          const esObjetivo = target?.key === e.key;
          const hecho = esObjetivo ? e.cmd.slice(0, typed.length) : "";
          const resto = esObjetivo ? e.cmd.slice(typed.length) : e.cmd;
          return (
            <div
              key={e.key}
              className="absolute flex -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${e.x}%`, top: `${18 + (e.lane * 72) / LANES}%`, transition: "left 90ms linear" }}
            >
              <span className={e.shielded ? "outline outline-2 outline-offset-2 outline-cyan" : ""}>
                {e.boss ? <BossSprite id={e.boss} size={88} /> : <EnemySprite id={e.kind!} size={e.shard ? 28 : 40} />}
              </span>
              {e.hitsLeft > 1 && <span className="font-pixel text-[9px] text-bad">x{e.hitsLeft}</span>}
              <span
                className={`whitespace-nowrap border-2 border-ink px-1.5 py-0.5 font-crt text-lg leading-none ${
                  esObjetivo ? "bg-accent text-accent-ink" : "bg-bg-2 text-[var(--term-text)]"
                }`}
              >
                <span className="opacity-50">{hecho}</span>
                {resto}
              </span>
            </div>
          );
        })}

        {flash && (
          <p className="pop absolute left-1/2 top-4 z-20 -translate-x-1/2 border-[3px] border-ink bg-bg-2 px-3 py-1.5 text-center font-game text-lg text-accent">
            {flash}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex items-center gap-3">
        <span className="font-crt text-xl text-[var(--term-prompt)]">$</span>
        <label htmlFor="cmd" className="sr-only">
          Escribe el comando del enemigo
        </label>
        <input
          id="cmd"
          ref={inputRef}
          className="input flex-1 font-crt text-xl"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="escribe el comando y pulsa Enter"
        />
        <button type="submit" className="btn btn-primary">
          Enter
        </button>
      </form>
    </div>
  );
}

/** Crea un enemigo en un carril libre. */
function make(key: number, kind: EnemyId, cmd: string, dif: "easy" | "medium" | "hard", actuales: Live[]): Live {
  const usados = new Set(actuales.filter((e) => e.x > 72).map((e) => e.lane));
  const libres = [0, 1, 2, 3].filter((l) => !usados.has(l));
  const lane = libres.length ? libres[Math.floor(Math.random() * libres.length)] : Math.floor(Math.random() * LANES);
  return {
    key,
    kind,
    boss: null,
    cmd,
    x: 100,
    lane,
    speed: SPEED[dif] * ENEMIES[kind].speed,
    hitsLeft: ENEMIES[kind].hits,
    age: 0,
    shielded: false,
  };
}
