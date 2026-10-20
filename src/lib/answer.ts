import type { Question } from "@/data/types";

/** Divide una línea en palabras respetando comillas simples y dobles (las comillas se quitan). */
export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: string | null = null;
  let has = false;
  for (const ch of line.trim()) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (/\s/.test(ch)) {
      if (has || cur) tokens.push(cur);
      cur = "";
      has = false;
    } else {
      cur += ch;
      has = true;
    }
  }
  if (has || cur) tokens.push(cur);
  return tokens;
}

const SHORT_FLAGS = /^-[a-zA-Z]+$/;

/**
 * Forma canónica de un comando para compararlo:
 * - espacios y comillas normalizados
 * - opciones cortas seguidas se unen y se ordenan (ls -l -a == ls -al == ls -la)
 * - barra final en rutas ignorada (Imagenes/ == Imagenes)
 */
export function canonical(cmd: string): string {
  const out: string[] = [];
  for (const raw of tokenize(cmd.replace(/\s*(\|\||&&|\||>>|>)\s*/g, " $1 "))) {
    const t = raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw;
    const prev = out[out.length - 1];
    if (SHORT_FLAGS.test(t) && prev && SHORT_FLAGS.test(prev)) {
      out[out.length - 1] = "-" + [...(prev.slice(1) + t.slice(1))].sort().join("");
    } else if (SHORT_FLAGS.test(t)) {
      out.push("-" + [...t.slice(1)].sort().join(""));
    } else {
      out.push(t);
    }
  }
  return out.join(" ");
}

/** Comprueba la respuesta del jugador según el tipo de reto. */
export function isCorrect(q: Question, input: string): boolean {
  const given = canonical(input);
  if (!given) return false;
  if (q.type === "choice") return q.answers.some((a) => a === input);
  if (q.type === "complete" && q.template) {
    // Se acepta el hueco ("install") o el comando completo ("sudo apt install firefox").
    return q.answers.some((a) => canonical(a) === given || canonical(q.template!.replace("___", a)) === given);
  }
  return q.answers.some((a) => canonical(a) === given);
}

/** Comando completo que representa la respuesta correcta, para mostrarlo al jugador. */
export function correctCommand(q: Question): string {
  if (q.type === "complete" && q.template) return q.template.replace("___", q.answers[0]);
  return q.answers[0];
}
