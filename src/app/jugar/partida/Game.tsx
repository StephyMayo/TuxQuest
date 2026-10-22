"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MISSION_PASS_RATIO } from "@/data/catalog";
import type { ChallengeType, Question } from "@/data/types";
import { correctCommand, isCorrect } from "@/lib/answer";
import { missionsFor, pickQuestions, type Mission } from "@/lib/missions";
import { Shell } from "@/lib/shell";
import { Terminal, type TerminalHandle } from "@/components/Terminal";
import { PixelBulb, PixelClock, PixelCoin, PixelFire, PixelShield, PixelTux, Stars, starsFor } from "@/components/Pixel";
import { useGameParams } from "@/components/useGameParams";
import { useRequirePlayer } from "@/components/useRequirePlayer";
import { MascotTip } from "@/components/Mascot";

const TYPE_LABEL: Record<ChallengeType, string> = {
  choice: "Opción múltiple",
  complete: "Completa el comando",
  write: "Escribe el comando",
  fix: "Corrige el comando",
};

const NO_HINT: { shown: boolean; error: string | null; busy: boolean } = { shown: false, error: null, busy: false };

interface Result {
  correct: boolean;
  given: string | null;
  timedOut: boolean;
}

/** Segundos que añade el boost de tiempo. */
const TIME_BOOST = 15;

export function Game() {
  const { player, backend, setCoins, inventory, setInventory } = useRequirePlayer();
  const { family, distro, difficulty: rules, valid, query, mission: topic } = useGameParams();

  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [feedback, setFeedback] = useState<Result | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [hint, setHint] = useState(NO_HINT);
  const [saved, setSaved] = useState<{ coins: number; doubled: boolean } | null>(null);
  const [saveError, setSaveError] = useState(false);
  // Boosts: "x2" se activa para toda la misión, el resto se gastan al usarlos
  const [x2, setX2] = useState(false);
  const [boostBusy, setBoostBusy] = useState<string | null>(null);
  const [boostError, setBoostError] = useState<string | null>(null);
  const [shielded, setShielded] = useState(false);
  const savingRef = useRef(false);
  const termRef = useRef<TerminalHandle>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const mission = missions?.find((m) => m.topic === topic) ?? null;

  const start = useCallback(
    (m: Mission) => {
      setQuestions(pickQuestions(m, distro!.id));
      setIdx(0);
      setResults([]);
      setFeedback(null);
      setSaved(null);
      setSaveError(false);
      setLeft(rules?.seconds ?? null);
      setHint(NO_HINT);
      setX2(false);
      setShielded(false);
      setBoostError(null);
      savingRef.current = false;
    },
    [distro, rules],
  );

  // Cargar preguntas y armar la partida
  useEffect(() => {
    if (!player || !valid) return;
    backend
      .getQuestions()
      .then((qs) => {
        const ms = missionsFor(qs, family!.id, distro!.id, rules!.id);
        setMissions(ms);
        const m = ms.find((x) => x.topic === topic);
        if (m) start(m);
      })
      .catch(() => setLoadError("No se pudieron cargar las preguntas. Revisa tu conexión."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id, valid, backend, family, distro, rules, topic]);

  const q = questions[idx] as Question | undefined;
  const finished = questions.length > 0 && idx >= questions.length;

  const shell = useMemo(() => (q && distro ? new Shell(distro.hostname, distro.id, distro.familyId, distro.name, q.cwd ?? "~") : null), [q, distro]);

  const answer = useCallback(
    (given: string | null, timedOut = false) => {
      if (!q || feedback) return;
      const r: Result = { correct: !timedOut && given !== null && isCorrect(q, given), given, timedOut };
      setFeedback(r);
      setResults((rs) => [...rs, r]);
    },
    [q, feedback],
  );

  // Temporizador (medio: 60 s, difícil: 30 s)
  useEffect(() => {
    if (left === null || feedback || finished || !q) return;
    const t = setTimeout(() => {
      setLeft(left - 1);
      if (left <= 1) answer(null, true);
    }, 1000);
    return () => clearTimeout(t);
  }, [left, feedback, finished, q, answer]);

  useEffect(() => {
    if (feedback) nextRef.current?.focus();
  }, [feedback]);

  // Guardar resultado al terminar
  useEffect(() => {
    if (!finished || savingRef.current || !mission || !rules) return;
    savingRef.current = true;
    const correct = results.filter((r) => r.correct).length;
    // El servidor decide si el x2 se aplica (y lo descuenta); aquí solo avisamos.
    const doubled = x2 && (inventory.boost_monedas ?? 0) > 0;
    backend
      .finishMission(mission.key, correct, results.length, correct * rules.coins, doubled ? "boost_monedas" : null)
      .then((coins) => {
        setCoins(coins);
        setSaved({ coins, doubled });
        if (doubled) backend.getInventory().then(setInventory).catch(() => {});
      })
      .catch(() => setSaveError(true));
  }, [finished, mission, rules, results, backend, setCoins, x2, inventory, setInventory]);

  function next() {
    setFeedback(null);
    setLeft(rules?.seconds ?? null);
    setHint(NO_HINT);
    setShielded(false);
    setBoostError(null);
    setIdx((i) => i + 1);
  }

  /** Gasta un boost en el servidor y aplica su efecto si todo salió bien. */
  async function spendBoost(id: "boost_tiempo" | "boost_pista" | "boost_escudo", apply: () => void) {
    if (boostBusy) return;
    setBoostError(null);
    setBoostBusy(id);
    try {
      setInventory(await backend.consumeBoost(id));
      apply();
    } catch (e) {
      setBoostError(e instanceof Error ? e.message : "No se pudo usar el boost.");
    } finally {
      setBoostBusy(null);
    }
  }

  /** El escudo convierte el fallo actual en acierto. */
  function activateShield() {
    if (!feedback || feedback.correct || shielded) return;
    spendBoost("boost_escudo", () => {
      setShielded(true);
      setFeedback((f) => (f ? { ...f, correct: true } : f));
      setResults((rs) => rs.map((r, i) => (i === rs.length - 1 ? { ...r, correct: true } : r)));
    });
  }

  async function askHint() {
    if (!rules || rules.hintCost === null || hint.shown || hint.busy) return;
    if (rules.hintCost === 0) return setHint({ shown: true, error: null, busy: false });
    setHint((h) => ({ ...h, busy: true }));
    try {
      setCoins(await backend.spendCoins(rules.hintCost));
      setHint({ shown: true, error: null, busy: false });
    } catch (e) {
      setHint({ shown: false, error: e instanceof Error ? e.message : "No se pudo usar la pista.", busy: false });
    }
  }

  function onTerminalSubmit(command: string, typed: string): boolean {
    if (!q) return false;
    if (q.type === "choice") {
      const n = Number(typed.trim());
      const opt = q.options?.[n - 1] ?? q.options?.find((o) => o.toLowerCase() === typed.trim().toLowerCase());
      if (!opt) {
        termRef.current?.note(`Escribe el número de una opción (1-${q.options?.length}) o pulsa un botón.`);
        return false;
      }
      answer(opt);
      return false;
    }
    answer(command);
    return true;
  }

  // ---------- Render ----------
  if (!player) return null;
  if (!valid || (missions && !mission))
    return (
      <Centered>
        <PixelTux size={64} />
        <p className="mt-4 font-game text-xl">No encontramos esa misión.</p>
        <Link href="/jugar" className="btn btn-primary mt-4">
          Elegir partida
        </Link>
      </Centered>
    );
  if (loadError) return <Centered>{loadError}</Centered>;
  if (!mission || !questions.length)
    return (
      <Centered>
        <PixelTux size={64} bob />
        <p className="mt-4 font-pixel text-xs">
          CARGANDO<span className="blink">...</span>
        </p>
      </Centered>
    );

  const correctCount = results.filter((r) => r.correct).length;
  let streak = 0;
  for (let i = results.length - 1; i >= 0 && results[i].correct; i--) streak++;

  if (finished) {
    const pct = correctCount / results.length;
    const passed = pct >= MISSION_PASS_RATIO;
    const stars = starsFor(pct);
    const nextMission = missions![missions!.indexOf(mission) + 1];
    let best = 0;
    let run = 0;
    for (const r of results) best = Math.max(best, (run = r.correct ? run + 1 : 0));
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-12">
        {passed && <Confetti />}
        <div className="card pop relative p-6 text-center sm:p-10">
          <p className="font-pixel text-[11px] text-muted">{mission.title.toUpperCase()}</p>
          <h1 className={`pixel-title mt-4 text-xl sm:text-3xl ${passed ? "text-accent" : "text-bad"}`}>{passed ? "¡MISIÓN COMPLETADA!" : "GAME OVER"}</h1>
          <div className="mt-6 flex justify-center">
            <Stars count={stars} size={48} />
          </div>
          <PixelTux size={72} bob={passed} className={`mx-auto mt-6 ${passed ? "" : "opacity-70 grayscale"}`} />
          <dl className="mt-8 grid grid-cols-3 gap-3">
            <Stat label="Aciertos" value={`${correctCount}/${results.length}`} />
            <Stat label="Precisión" value={`${Math.round(pct * 100)}%`} tone={passed ? "ok" : "bad"} />
            <Stat label="Mejor racha" value={String(best)} />
          </dl>
          <div className="card-flat mt-6 flex items-center justify-center gap-3 p-4" aria-live="polite">
            <PixelCoin size={28} />
            <span className="font-pixel text-sm text-accent">+{correctCount * rules!.coins * (saved?.doubled ? 2 : 1)}</span>
            {saved?.doubled && <span className="chip font-pixel text-[10px] text-cyan">BOOST x2</span>}
            {saved && <span className="font-game text-lg text-muted">· total {saved.coins}</span>}
          </div>
          {saveError && <p className="mt-3 text-sm text-bad">No se pudo guardar el resultado. Revisa tu conexión.</p>}
          {!passed && <p className="mt-4 text-muted">Necesitas al menos {MISSION_PASS_RATIO * 100}% de aciertos para superar la misión. ¡Inténtalo otra vez!</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button className={`btn ${passed ? "btn-ghost" : "btn-primary"}`} onClick={() => start(mission)}>
              ↻ {passed ? "Repetir" : "Reintentar"}
            </button>
            <Link href={`/jugar/misiones?${query}`} className="btn btn-ghost">
              ☰ Mapa
            </Link>
            {passed && nextMission && (
              <Link href={`/jugar/partida?${query}&mision=${nextMission.topic}`} className="btn btn-primary">
                ▶ {nextMission.title}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!q || !shell) return null;
  const qty = (id: string) => inventory[id] ?? 0;
  const hasBoosts = ["boost_monedas", "boost_tiempo", "boost_pista", "boost_escudo"].some((id) => qty(id) > 0);
  const urgent = left !== null && left <= 10;
  const timePct = left !== null && rules!.seconds ? (left / rules!.seconds) * 100 : 100;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* HUD */}
      <div className="card flex flex-wrap items-center gap-x-5 gap-y-3 p-3 sm:p-4">
        <Link href={`/jugar/misiones?${query}`} className="btn btn-ghost btn-sm" aria-label="Volver al mapa de misiones">
          ◀
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-game text-xl leading-tight sm:text-2xl">{mission.title}</h1>
          <p className="truncate font-crt text-lg leading-none text-muted">
            {distro!.name} · {rules!.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip font-pixel text-[10px]">
            {idx + 1}/{questions.length}
          </span>
          <span className="chip relative font-pixel text-[10px] text-accent" aria-label={`${correctCount * rules!.coins} monedas ganadas en esta misión`}>
            <PixelCoin size={14} /> +{correctCount * rules!.coins}
            {feedback?.correct && (
              <span key={idx} className="float-up absolute -top-2 right-0 font-pixel text-[11px] text-accent" aria-hidden="true">
                +{rules!.coins}
              </span>
            )}
          </span>
          {streak >= 2 && (
            <span className="chip font-pixel text-[10px] text-[#ff9a3c]">
              <PixelFire size={14} /> x{streak}
            </span>
          )}
        </div>
      </div>

      {/* Barra de boosts (solo si el jugador tiene alguno) */}
      {hasBoosts && (
        <div className="card-flat mt-4 flex flex-wrap items-center gap-2.5 p-3">
          <span className="font-game text-lg text-muted">Boosts:</span>

          {qty("boost_monedas") > 0 && (
            <button
              className={`btn btn-sm ${x2 ? "btn-primary" : "btn-ghost"}`}
              aria-pressed={x2}
              onClick={() => setX2((v) => !v)}
              title="Duplica las monedas de esta misión. Se gasta al terminarla."
            >
              <PixelCoin size={14} /> x2 monedas {x2 ? "· ACTIVO" : `(${qty("boost_monedas")})`}
            </button>
          )}

          {qty("boost_tiempo") > 0 && left !== null && (
            <button
              className="btn btn-ghost btn-sm"
              disabled={!!feedback || boostBusy === "boost_tiempo"}
              onClick={() => spendBoost("boost_tiempo", () => setLeft((l) => (l === null ? l : l + TIME_BOOST)))}
            >
              <PixelClock size={14} /> +{TIME_BOOST}s ({qty("boost_tiempo")})
            </button>
          )}

          {qty("boost_pista") > 0 && !hint.shown && !feedback && (
            <button
              className="btn btn-ghost btn-sm"
              disabled={boostBusy === "boost_pista"}
              onClick={() => spendBoost("boost_pista", () => setHint({ shown: true, error: null, busy: false }))}
            >
              <PixelBulb size={14} /> Pista gratis ({qty("boost_pista")})
            </button>
          )}

          {qty("boost_escudo") > 0 && (
            <span className="chip font-game text-base text-cyan" title="Al fallar podrás usarlo para salvar el reto">
              <PixelShield size={14} /> Escudo x{qty("boost_escudo")}
            </span>
          )}

          {boostError && (
            <span className="font-game text-base text-bad" role="alert">
              {boostError}
            </span>
          )}
        </div>
      )}

      {/* Progreso de retos + tiempo */}
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-3 flex-1 border-2 border-ink ${i < results.length ? (results[i].correct ? "bg-ok" : "bg-bad") : i === idx ? "bg-accent" : "bg-bg-2"}`}
          />
        ))}
      </div>
      {left !== null && (
        <div className="mt-3 flex items-center gap-3">
          <PixelClock size={18} />
          <div className={`pixel-bar flex-1 ${urgent ? "text-bad" : "text-cyan"}`} role="timer" aria-label={`Quedan ${left} segundos`}>
            <span style={{ width: `${timePct}%`, transition: "width 1s steps(4)" }} />
          </div>
          <span className={`w-12 text-right font-pixel text-xs tabular-nums ${urgent ? "blink text-bad" : ""}`}>{left}s</span>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Reto */}
        <section key={idx} className={`card p-5 sm:p-6 ${feedback && !feedback.correct ? "shake" : ""}`} aria-labelledby="reto">
          <span className="chip text-cyan">{TYPE_LABEL[q.type]}</span>
          <h2 id="reto" className="mt-4 text-2xl font-semibold leading-snug">
            {q.prompt}
          </h2>
          {q.cwd && <p className="mt-2 font-crt text-lg text-muted">Estás en {q.cwd}</p>}

          {q.type === "fix" && (
            <div className="mt-4">
              <p className="font-game text-muted">Comando con error:</p>
              <code className="crt mt-1 block border-[3px] border-bad px-3 py-2 font-crt text-xl text-bad line-through decoration-2">{q.broken}</code>
              <p className="mt-2 text-sm text-muted">Escribe el comando corregido en la terminal.</p>
            </div>
          )}
          {q.type === "complete" && <p className="mt-3 text-muted">Escribe en la terminal solo lo que falta en el hueco.</p>}
          {q.type === "write" && <p className="mt-3 text-muted">Escribe el comando en la terminal y pulsa Enter. Tu primer comando cuenta como respuesta.</p>}

          {q.type === "choice" && (
            <div className="mt-5 grid gap-3" role="group" aria-label="Opciones">
              {q.options!.map((o, i) => {
                const chosen = feedback?.given === o;
                const right = feedback && o === q.answers[0];
                return (
                  <button
                    key={o}
                    onClick={() => answer(o)}
                    disabled={!!feedback}
                    className={`btn btn-sm justify-start text-left disabled:!opacity-100 ${right ? "bg-ok text-[#002a10]" : chosen ? "bg-bad text-[#2b0008]" : "btn-ghost"}`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center border-2 border-ink bg-bg-2 font-pixel text-[10px] text-accent">{i + 1}</span>
                    <span className={/^[a-z/.>|~-]/.test(o) && o.length < 40 ? "font-crt text-xl font-normal" : "font-sans text-base font-normal"}>{o}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pista */}
          {!feedback && rules!.hintCost !== null && (
            <div className="mt-6">
              {hint.shown ? (
                <p className="card-flat flex items-start gap-2 p-3">
                  <PixelBulb size={14} /> <span>{q.hint}</span>
                </p>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={askHint} disabled={hint.busy}>
                  <PixelBulb size={14} /> Pedir pista {rules!.hintCost === 0 ? "(gratis)" : `(${rules!.hintCost} monedas)`}
                </button>
              )}
              {hint.error && <p className="mt-2 text-sm text-bad">{hint.error}</p>}
            </div>
          )}

          {/* Corrección inmediata (RF-08) */}
          <div aria-live="assertive">
            {feedback && (
              <div className={`pop mt-6 border-[3px] border-ink p-4 ${feedback.correct ? "bg-ok/15" : "bg-bad/15"}`} style={{ boxShadow: "4px 4px 0 #06030f" }}>
                <p className={`font-pixel text-sm ${feedback.correct ? (shielded ? "text-cyan" : "text-ok") : "text-bad"}`}>
                  {shielded
                    ? `¡ESCUDO ACTIVADO! +${rules!.coins}`
                    : feedback.correct
                      ? `¡CORRECTO! +${rules!.coins}`
                      : feedback.timedOut
                        ? "¡TIEMPO!"
                        : "¡FALLASTE!"}
                </p>
                {(!feedback.correct || shielded) && (
                  <p className="mt-3">
                    Respuesta correcta:{" "}
                    <code className="crt inline-block border-2 border-ink px-2 font-crt text-xl text-[var(--term-text)]">{q.type === "choice" ? q.answers[0] : correctCommand(q)}</code>
                  </p>
                )}
                {/* Al fallar, la guía de la distribución explica el error */}
                {!feedback.correct || shielded ? (
                  <MascotTip familyId={family!.id} timedOut={feedback.timedOut} seed={idx}>
                    {q.explanation}
                  </MascotTip>
                ) : (
                  <p className="mt-2 text-muted">{q.explanation}</p>
                )}

                {/* El escudo convierte este fallo en acierto */}
                {!feedback.correct && !shielded && qty("boost_escudo") > 0 && (
                  <button className="btn btn-cyan mt-4 w-full" disabled={boostBusy === "boost_escudo"} onClick={activateShield}>
                    <PixelShield size={16} />
                    {boostBusy === "boost_escudo" ? "Usando…" : `Usar Escudo de Tux (${qty("boost_escudo")}) y salvar el reto`}
                  </button>
                )}

                <button ref={nextRef} className="btn btn-primary mt-4" onClick={next}>
                  {idx + 1 < questions.length ? "Siguiente reto ▶" : "Ver resultados ▶"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Terminal simulada (RF-05) */}
        <section aria-label="Terminal">
          <Terminal
            key={`${idx}-${q.id}`}
            ref={termRef}
            shell={shell}
            disabled={!!feedback}
            template={q.type === "complete" ? q.template : undefined}
            onSubmit={onTerminalSubmit}
            intro={
              q.type === "choice"
                ? "# Elige una opción con los botones o escribe su número y pulsa Enter."
                : `# ${distro!.name} (${family!.name}) · escribe tu respuesta y pulsa Enter.`
            }
          />
          <p className="mt-3 text-xs text-muted">↑/↓ historial · Tab autocompletar · Ctrl+L limpiar. Nada de lo que escribas afecta a tu computadora.</p>
        </section>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center text-muted">{children}</div>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) {
  return (
    <div className="card-flat p-3">
      <dt className="font-game text-muted">{label}</dt>
      <dd className={`mt-1 font-pixel text-base sm:text-lg ${tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : ""}`}>{value}</dd>
    </div>
  );
}

const CONFETTI_COLORS = ["#ffd23f", "#ff5d8f", "#3be8ff", "#4cff8f", "#ffffff"];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 48 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })),
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}
