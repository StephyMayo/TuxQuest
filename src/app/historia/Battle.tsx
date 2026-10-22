"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOSSES,
  COINS_PER_KILL,
  STORY,
  ENEMIES,
  chapterByTopic,
  storyKey,
  type BossId,
  type Chapter,
  type EnemyId,
} from "@/data/story";
import { OWN_SHARE, SPAWN, SPEED, commandsFor, shuffled, type ChapterCommands } from "@/lib/story";
import { BossSprite, EnemySprite } from "@/components/story/Enemies";
import { PixelCoin, PixelHeart, PixelTux } from "@/components/Pixel";
import { useGameParams } from "@/components/useGameParams";
import { useRequirePlayer } from "@/components/useRequirePlayer";

/** Un enemigo en pantalla. */
interface Live {
  key: number;
  kind: EnemyId | null;
  boss: BossId | null;
  cmd: string;
  /** 0 = encima de Tux, 100 = acaba de aparecer. */
  x: number;
  /** Carril vertical, para que no se solapen. */
  lane: number;
  speed: number;
  hitsLeft: number;
  /** Segundos que lleva vivo: la fuga de memoria acelera con esto. */
  age: number;
  /** Lo protege un demonio huérfano. */
  shielded: boolean;
  /** Trozo salido de un paquete roto: no cuenta como enemigo del capítulo. */
  shard?: boolean;
}

type Phase = "intro" | "fight" | "won" | "lost";

const LANES = 4;

export function Battle() {
  const { player, backend, setCoins } = useRequirePlayer();
  const { family, difficulty, valid, query, mission: topic } = useGameParams();
  const chapter = topic ? chapterByTopic(topic) : undefined;

  const [phase, setPhase] = useState<Phase>("intro");
  const [enemies, setEnemies] = useState<Live[]>([]);
  const [typed, setTyped] = useState("");
  const [lives, setLives] = useState(3);
  const [kills, setKills] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [pool, setPool] = useState<ChapterCommands | null>(null);
  const [saved, setSaved] = useState<{ coins: number } | null>(null);
  const [loadError, setLoadError] = useState(false);

  const livesRef = useRef(3);
  const spawnedRef = useRef(0);
  const keyRef = useRef(0);
  const bossOutRef = useRef(false);
  const savingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- comandos del capítulo ---
  useEffect(() => {
    if (!player || !valid || !chapter) return;
    backend
      .getQuestions()
      .then((qs) => {
        const c = commandsFor(qs, family!.id, chapter, difficulty!.id);
        setPool({ own: shuffled(c.own), review: shuffled(c.review) });
      })
      .catch(() => setLoadError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id, valid, chapter?.topic, backend, family, difficulty]);

  /** Comando para un enemigo nuevo: casi siempre del capítulo, a veces de repaso. */
  const nextCmd = useCallback(() => {
    if (!pool) return "ls";
    const usaPropio = pool.own.length > 0 && (pool.review.length === 0 || Math.random() < OWN_SHARE);
    const lista = usaPropio ? pool.own : pool.review;
    return lista.length ? lista[Math.floor(Math.random() * lista.length)] : "ls";
  }, [pool]);

  // --- bucle del juego ---
  useEffect(() => {
    if (phase !== "fight" || !chapter || !difficulty) return;
    let raf = 0;
    let last = performance.now();
    let sinceSpawn = 0;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // aparición
      sinceSpawn += dt;
      const cadencia = SPAWN[difficulty.id] * (chapter.boss && spawnedRef.current >= chapter.waves ? 99 : 1);
      if (sinceSpawn >= cadencia) {
        sinceSpawn = 0;
        if (spawnedRef.current < chapter.waves) {
          spawnedRef.current++;
          const kind = chapter.enemies[Math.floor(Math.random() * chapter.enemies.length)];
          setEnemies((es) => [...es, make(keyRef.current++, kind, nextCmd(), difficulty.id, es)]);
        }
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
        // los huérfanos protegen al enemigo que tengan más cerca
        const guardias = vivos.filter((e) => e.kind === "huerfano");
        for (const v of vivos) v.shielded = false;
        for (const g of guardias) {
          let mejor: Live | null = null;
          for (const v of vivos) {
            if (v === g || v.kind === "huerfano") continue;
            if (!mejor || Math.abs(v.x - g.x) < Math.abs(mejor.x - g.x)) mejor = v;
          }
          if (mejor) mejor.shielded = true;
        }
        if (perdidas) {
          // Se lleva en una referencia para decidir aquí mismo si se acabó,
          // en vez de reaccionar al cambio de estado con otro efecto.
          livesRef.current = Math.max(0, livesRef.current - perdidas);
          setLives(livesRef.current);
          setCombo(0);
          setFlash("¡Se te coló!");
          if (livesRef.current === 0) setPhase("lost");
        }
        return vivos;
      });

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, chapter, difficulty, nextCmd]);

  // --- aparición del jefe y final del capítulo ---
  useEffect(() => {
    if (phase !== "fight" || !chapter) return;
    const quedan = enemies.length;
    const todosFuera = spawnedRef.current >= chapter.waves;
    if (!todosFuera || quedan > 0) return;

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
          speed: SPEED[difficulty!.id] * b.speed,
          hitsLeft: b.hits,
          age: 0,
          shielded: false,
        },
      ]);
      return;
    }
    if (!chapter.boss || bossOutRef.current) setPhase("won");
  }, [enemies.length, phase, chapter, difficulty, nextCmd]);

  // --- guardar al terminar ---
  useEffect(() => {
    if (phase !== "won" || savingRef.current || !chapter) return;
    savingRef.current = true;
    backend
      .finishMission(storyKey(chapter.topic), kills, chapter.waves, kills * COINS_PER_KILL)
      .then((coins) => {
        setCoins(coins);
        setSaved({ coins });
      })
      .catch(() => setSaved(null));
  }, [phase, chapter, kills, backend, setCoins]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    if (phase === "fight") inputRef.current?.focus();
  }, [phase]);

  /** El enemigo al que apunta lo escrito: el más cercano a Tux que encaje. */
  const target = useMemo(() => {
    if (!typed) return null;
    const t = typed.toLowerCase();
    return (
      [...enemies]
        .filter((e) => e.cmd.toLowerCase().startsWith(t))
        .sort((a, b) => a.x - b.x)[0] ?? null
    );
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
          for (const d of [-0.6, 0.6]) {
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
    setKills((k) => k + 1);
    setCombo((c) => {
      const n = c + 1;
      setBestCombo((b) => Math.max(b, n));
      return n;
    });
  }

  function start() {
    spawnedRef.current = 0;
    bossOutRef.current = false;
    savingRef.current = false;
    keyRef.current = 0;
    setEnemies([]);
    livesRef.current = 3;
    setLives(3);
    setKills(0);
    setCombo(0);
    setBestCombo(0);
    setTyped("");
    setSaved(null);
    setPhase("fight");
  }

  // ---------- Render ----------
  if (!player) return null;
  if (!valid || !chapter)
    return (
      <Centro>
        <PixelTux size={64} />
        <p className="mt-4 font-game text-xl">No encontramos ese capítulo.</p>
        <Link href="/historia" className="btn btn-primary mt-4">
          Volver al mapa
        </Link>
      </Centro>
    );
  if (loadError) return <Centro>No se pudieron cargar los comandos. Revisa tu conexión.</Centro>;
  if (!pool)
    return (
      <Centro>
        <PixelTux size={64} bob />
        <p className="mt-4 font-pixel text-xs">
          CARGANDO<span className="blink">...</span>
        </p>
      </Centro>
    );

  if (phase === "intro") return <Intro chapter={chapter} query={query} onStart={start} pool={pool} />;
  if (phase === "won" || phase === "lost")
    return (
      <Final
        chapter={chapter}
        query={query}
        won={phase === "won"}
        kills={kills}
        bestCombo={bestCombo}
        coins={saved?.coins}
        onRetry={start}
      />
    );

  const restantes = chapter.waves - kills;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* HUD */}
      <div className="card flex flex-wrap items-center gap-x-5 gap-y-3 p-3 sm:p-4">
        <Link href={`/historia?${query}`} className="btn btn-ghost btn-sm" aria-label="Volver al mapa">
          ◀
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-game text-xl leading-tight sm:text-2xl">{chapter.title}</h1>
          <p className="truncate font-crt text-lg leading-none text-muted">
            {chapter.place} · {family!.name}
          </p>
        </div>
        <span className="flex items-center gap-1" aria-label={`${lives} vidas`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < lives ? "" : "opacity-25 grayscale"}>
              <PixelHeart size={18} />
            </span>
          ))}
        </span>
        <span className="chip font-pixel text-[10px]">{Math.max(0, restantes)} quedan</span>
        {combo >= 3 && <span className="chip font-pixel text-[10px] text-[#ff9a3c]">COMBO x{combo}</span>}
      </div>

      {/* Arena */}
      <div className="card crt relative mt-4 h-[360px] overflow-hidden sm:h-[420px]">
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
              style={{
                left: `${e.x}%`,
                top: `${18 + (e.lane * 72) / LANES}%`,
                transition: "left 90ms linear",
              }}
            >
              <span className={e.shielded ? "rounded-full outline outline-2 outline-offset-2 outline-cyan" : ""}>
                {e.boss ? (
                  <BossSprite id={e.boss} size={92} />
                ) : (
                  <EnemySprite id={e.kind!} size={e.shard ? 28 : 40} />
                )}
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

      {/* Entrada */}
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
      <p className="mt-2 text-xs text-muted">
        Escribe el comando que lleva encima un enemigo para derribarlo. Si llega a Tux, pierdes una vida.
      </p>
    </div>
  );
}

/** Crea un enemigo en un carril libre. */
function make(key: number, kind: EnemyId, cmd: string, dif: "facil" | "medio" | "dificil", actuales: Live[]): Live {
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

function Intro({ chapter, query, onStart, pool }: { chapter: Chapter; query: string; onStart: () => void; pool: ChapterCommands }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/historia?${query}`} className="btn btn-ghost btn-sm">
        ◀ Mapa de la historia
      </Link>
      <div className="card mt-6 p-6 sm:p-8">
        <p className="font-pixel text-[11px] text-muted">ACTO {chapter.act}</p>
        <h1 className="pixel-title mt-3 text-lg sm:text-2xl">{chapter.title.toUpperCase()}</h1>
        <p className="mt-2 font-game text-xl text-muted">{chapter.place}</p>

        <div className="mt-6 space-y-3 text-lg leading-relaxed">
          {chapter.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="card-flat mt-6 p-4">
          <p className="font-game text-lg text-accent">Lo que aprendes aquí</p>
          <p className="mt-1 text-muted">{chapter.lesson}</p>
          <p className="mt-2 text-sm text-muted">
            {chapter.waves} enemigos · {pool.own.length} comandos del capítulo
            {pool.review.length > 0 && ` y ${pool.review.length} de repaso`}
            {chapter.boss && ` · jefe: ${BOSSES[chapter.boss].name}`}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {chapter.enemies.map((id) => (
            <span key={id} className="card-flat flex items-center gap-2 p-2.5">
              <EnemySprite id={id} size={28} />
              <span className="min-w-0">
                <span className="block font-game text-base leading-tight">{ENEMIES[id].name}</span>
                <span className="block text-xs leading-tight text-muted">{ENEMIES[id].trait}</span>
              </span>
            </span>
          ))}
        </div>

        <button className="btn btn-primary mt-8 w-full py-3 text-lg" onClick={onStart}>
          ▶ Empezar capítulo
        </button>
      </div>
    </div>
  );
}

function Final({
  chapter,
  query,
  won,
  kills,
  bestCombo,
  coins,
  onRetry,
}: {
  chapter: Chapter;
  query: string;
  won: boolean;
  kills: number;
  bestCombo: number;
  coins?: number;
  onRetry: () => void;
}) {
  const siguiente = won ? chapterByTopic(nextTopic(chapter) ?? "") : undefined;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="card pop p-6 text-center sm:p-10">
        <p className="font-pixel text-[11px] text-muted">{chapter.title.toUpperCase()}</p>
        <h1 className={`pixel-title mt-4 text-xl sm:text-3xl ${won ? "text-accent" : "text-bad"}`}>
          {won ? "CAPÍTULO SUPERADO" : "EL NÚCLEO TE VENCIÓ"}
        </h1>
        <PixelTux size={72} bob={won} className={`mx-auto mt-6 ${won ? "" : "opacity-70 grayscale"}`} />

        {won && <p className="mt-6 text-lg leading-relaxed">{chapter.outro}</p>}

        <dl className="mt-8 grid grid-cols-2 gap-3">
          <div className="card-flat p-3">
            <dt className="font-game text-muted">Derribados</dt>
            <dd className="mt-1 font-pixel text-base">
              {kills}/{chapter.waves}
            </dd>
          </div>
          <div className="card-flat p-3">
            <dt className="font-game text-muted">Mejor combo</dt>
            <dd className="mt-1 font-pixel text-base">x{bestCombo}</dd>
          </div>
        </dl>

        {won && (
          <div className="card-flat mt-4 flex items-center justify-center gap-3 p-4" aria-live="polite">
            <PixelCoin size={28} />
            <span className="font-pixel text-sm text-accent">+{kills * COINS_PER_KILL}</span>
            {coins !== undefined && <span className="font-game text-lg text-muted">· total {coins}</span>}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button className={`btn ${won ? "btn-ghost" : "btn-primary"}`} onClick={onRetry}>
            ↻ {won ? "Repetir" : "Reintentar"}
          </button>
          <Link href={`/historia?${query}`} className="btn btn-ghost">
            ☰ Mapa
          </Link>
          {siguiente && (
            <Link href={`/historia/capitulo?${query}&mision=${siguiente.topic}`} className="btn btn-primary">
              ▶ {siguiente.title}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tema del capítulo siguiente, si lo hay. */
function nextTopic(c: Chapter) {
  const i = STORY.findIndex((x) => x.topic === c.topic);
  return STORY[i + 1]?.topic;
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center text-muted">{children}</div>;
}
