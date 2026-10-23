"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOSSES,
  COINS_PER_WIN,
  EPILOGUE,
  GAMES,
  INTERLUDES,
  PASS_RATIO,
  PROLOGUE,
  STORY,
  chapterByTopic,
  chapterIndex,
} from "@/data/story";
import type { Question } from "@/data/types";
import { PixelCoin, PixelTux, Stars, starsFor } from "@/components/Pixel";
import { BossSprite, EnemySprite } from "@/components/story/Enemies";
import { useGameParams } from "@/components/useGameParams";
import { useRequirePlayer } from "@/components/useRequirePlayer";
import { Candado } from "./games/Candado";
import { Defensa } from "./games/Defensa";
import { Memoria } from "./games/Memoria";
import { Montar } from "./games/Montar";
import { Procesos } from "./games/Procesos";
import { Rastro } from "./games/Rastro";
import { Ruta } from "./games/Ruta";
import { Tablero } from "./games/Tablero";
import { TerminalGuiada } from "./games/TerminalGuiada";
import type { GameProps } from "./games/types";

/** El capítulo se recorre en cuatro pasos. */
type Phase = "historia" | "reglas" | "juego" | "final";

const JUEGOS: Record<string, (p: GameProps) => React.ReactElement> = {
  terminal: TerminalGuiada,
  defensa: Defensa,
  montar: Montar,
  candado: Candado,
  rastro: Rastro,
  memoria: Memoria,
  processes: Procesos,
  tablero: Tablero,
  ruta: Ruta,
};

export function Chapter() {
  const { player, backend, setCoins } = useRequirePlayer();
  const { family, difficulty, valid, query, mission: topic } = useGameParams();
  const chapter = topic ? chapterByTopic(topic) : undefined;
  const idx = topic ? chapterIndex(topic) : -1;

  const [phase, setPhase] = useState<Phase>("historia");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [saved, setSaved] = useState<{ coins: number } | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!player || !valid) return;
    backend
      .getQuestions()
      .then(setQuestions)
      .catch(() => setLoadError(true));
  }, [player, valid, backend]);

  const onFinish = useCallback((score: number, total: number) => {
    setResult({ score, total });
    setPhase("final");
  }, []);

  // guardar al terminar
  useEffect(() => {
    if (phase !== "final" || !result || !chapter || savingRef.current) return;
    savingRef.current = true;
    backend
      .finishRun(
        family!.id,
        difficulty!.id,
        "story",
        chapter.topic,
        result.score,
        Math.max(1, result.total),
        result.score * COINS_PER_WIN,
      )
      .then((coins) => {
        setCoins(coins);
        setSaved({ coins });
      })
      .catch(() => setSaved(null));
  }, [phase, result, chapter, backend, setCoins, family, difficulty]);

  function reiniciar() {
    savingRef.current = false;
    setResult(null);
    setSaved(null);
    setPhase("reglas");
  }

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
  if (!questions)
    return (
      <Centro>
        <PixelTux size={64} bob />
        <p className="mt-4 font-pixel text-xs">
          CARGANDO<span className="blink">...</span>
        </p>
      </Centro>
    );

  const game = GAMES[chapter.game];

  // ---------- 1. La historia ----------
  if (phase === "historia") {
    const prologo = idx === 0 ? PROLOGUE : null;
    const interludio = INTERLUDES[chapter.act] && STORY[idx - 1]?.act !== chapter.act ? INTERLUDES[chapter.act] : null;
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href={`/historia?${query}`} className="btn btn-ghost btn-sm">
          ◀ Mapa de la historia
        </Link>

        {prologo && <Narracion title={prologo.title} text={prologo.text} tone="prologo" />}
        {interludio && <Narracion title={interludio.title} text={interludio.text} tone="interludio" />}

        <div className="card mt-6 p-6 sm:p-8">
          <p className="font-pixel text-[11px] text-muted">
            ACTO {chapter.act} · CAPÍTULO {idx + 1}
          </p>
          <h1 className="pixel-title mt-3 text-lg sm:text-2xl">{chapter.title.toUpperCase()}</h1>
          <p className="mt-2 font-game text-xl text-muted">{chapter.place}</p>

          <div className="mt-6 space-y-3 text-lg leading-relaxed">
            {chapter.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <button className="btn btn-primary mt-8 w-full py-3 text-lg" onClick={() => setPhase("reglas")}>
            Continuar ▶
          </button>
        </div>
      </div>
    );
  }

  // ---------- 2. Cómo se juega ----------
  if (phase === "reglas") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <button className="btn btn-ghost btn-sm" onClick={() => setPhase("historia")}>
          ◀ Volver a la historia
        </button>

        <div className="card mt-6 p-6 sm:p-8">
          <p className="font-pixel text-[11px] text-muted">CÓMO SE JUEGA ESTE CAPÍTULO</p>
          <h1 className="pixel-title mt-3 text-lg sm:text-xl">{game.name.toUpperCase()}</h1>

          <ol className="mt-6 space-y-4">
            {game.rules.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-lg">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center border-2 border-ink bg-accent font-pixel text-[10px] text-accent-ink">
                  {i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ol>

          <div className="card-flat mt-6 p-4">
            <p className="font-game text-lg text-accent">Lo que aprendes aquí</p>
            <p className="mt-1 text-muted">{chapter.lesson}</p>
            <p className="mt-2 text-sm text-muted">
              Se supera acertando al menos el {Math.round(PASS_RATIO * 100)} %.
            </p>
          </div>

          {chapter.enemies.length > 0 && (
            <div className="mt-6">
              <p className="font-game text-lg">Con lo que te vas a encontrar</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {chapter.enemies.map((id) => (
                  <span key={id} className="card-flat flex items-center gap-2 p-2.5">
                    <EnemySprite id={id} size={28} />
                    <span className="min-w-0">
                      <span className="block font-game text-base leading-tight">{ENEMY_NAME[id]}</span>
                      <span className="block text-xs leading-tight text-muted">{ENEMY_TRAIT[id]}</span>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {chapter.boss && (
            <div className="card-flat mt-4 flex items-center gap-3 p-4">
              <BossSprite id={chapter.boss} size={52} />
              <div>
                <p className="font-pixel text-[10px] text-pink">AL FINAL TE ESPERA</p>
                <p className="font-game text-xl">{BOSSES[chapter.boss].name}</p>
              </div>
            </div>
          )}

          <button className="btn btn-primary mt-8 w-full py-3 text-lg" onClick={() => setPhase("juego")}>
            ▶ Empezar
          </button>
        </div>
      </div>
    );
  }

  // ---------- 3. El minijuego ----------
  if (phase === "juego") {
    const Juego = JUEGOS[chapter.game];
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="card flex flex-wrap items-center gap-x-5 gap-y-3 p-3 sm:p-4">
          <Link href={`/historia?${query}`} className="btn btn-ghost btn-sm" aria-label="Volver al mapa">
            ◀
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-game text-xl leading-tight sm:text-2xl">{chapter.title}</h1>
            <p className="truncate font-crt text-lg leading-none text-muted">
              {game.name} · {family!.name}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Juego chapter={chapter} family={family!} rules={difficulty!} questions={questions} onFinish={onFinish} />
        </div>
      </div>
    );
  }

  // ---------- 4. El desenlace ----------
  const { score, total } = result!;
  const ratio = total > 0 ? score / total : 0;
  const won = ratio >= PASS_RATIO;
  const stars = starsFor(ratio);
  const siguiente = won ? STORY[idx + 1] : undefined;
  const esFinal = won && idx === STORY.length - 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="card pop p-6 text-center sm:p-10">
        <p className="font-pixel text-[11px] text-muted">{chapter.title.toUpperCase()}</p>
        <h1 className={`pixel-title mt-4 text-xl sm:text-3xl ${won ? "text-accent" : "text-bad"}`}>
          {won ? "CAPÍTULO SUPERADO" : "NO HA SIDO ESTA VEZ"}
        </h1>
        <div className="mt-6 flex justify-center">
          <Stars count={stars} size={44} />
        </div>
        <PixelTux size={72} bob={won} className={`mx-auto mt-6 ${won ? "" : "opacity-70 grayscale"}`} />

        <dl className="mt-8 grid grid-cols-2 gap-3">
          <div className="card-flat p-3">
            <dt className="font-game text-muted">Aciertos</dt>
            <dd className="mt-1 font-pixel text-base">
              {score}/{total}
            </dd>
          </div>
          <div className="card-flat p-3">
            <dt className="font-game text-muted">Precisión</dt>
            <dd className={`mt-1 font-pixel text-base ${won ? "text-ok" : "text-bad"}`}>{Math.round(ratio * 100)}%</dd>
          </div>
        </dl>

        {won && (
          <div className="mt-6 space-y-3 text-left text-lg leading-relaxed">
            {chapter.outro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        {!won && (
          <p className="mt-6 text-muted">
            Hace falta acertar al menos el {Math.round(PASS_RATIO * 100)} % para seguir. Vuelve a intentarlo: ahora ya
            sabes de qué va.
          </p>
        )}

        {won && (
          <div className="card-flat mt-6 flex items-center justify-center gap-3 p-4" aria-live="polite">
            <PixelCoin size={28} />
            <span className="font-pixel text-sm text-accent">+{score * COINS_PER_WIN}</span>
            {saved && <span className="font-game text-lg text-muted">· total {saved.coins}</span>}
          </div>
        )}

        {esFinal && <Narracion title={EPILOGUE.title} text={EPILOGUE.text} tone="epilogo" />}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button className={`btn ${won ? "btn-ghost" : "btn-primary"}`} onClick={reiniciar}>
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

function Narracion({ title, text, tone }: { title: string; text: string[]; tone: "prologo" | "interludio" | "epilogo" }) {
  return (
    <div className={`card-flat mt-6 border-l-[6px] p-5 ${tone === "epilogo" ? "border-l-accent" : "border-l-pink"}`}>
      <p className="font-pixel text-[10px] text-muted">{title.toUpperCase()}</p>
      <div className="mt-3 space-y-3 text-left text-lg italic leading-relaxed text-muted">
        {text.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

const ENEMY_NAME: Record<string, string> = {
  bicho: "Bicho",
  zombi: "Proceso zombi",
  fuga: "Fuga de memoria",
  roto: "Paquete roto",
  huerfano: "Demonio huérfano",
};
const ENEMY_TRAIT: Record<string, string> = {
  bicho: "Avanza sin más.",
  zombi: "Lento, aguanta dos comandos.",
  fuga: "Acelera cuanto más vive.",
  roto: "Se parte en dos al romperlo.",
  huerfano: "Escuda al que tenga cerca.",
};

function Centro({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center text-muted">{children}</div>;
}
