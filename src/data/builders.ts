import type { Difficulty, FamilyId, Question, Topic } from "./types.ts";

interface Scope {
  familyId?: FamilyId | null;
  distroId?: string | null;
  cwd?: string;
}

const base = (s: Scope = {}) => ({
  familyId: s.familyId ?? null,
  distroId: s.distroId ?? null,
  ...(s.cwd ? { cwd: s.cwd } : {}),
});

/** Opción múltiple (fácil). La primera opción es la correcta; el juego las mezcla. */
export function choice(
  id: string,
  topic: Topic,
  prompt: string,
  options: string[],
  hint: string,
  explanation: string,
  scope?: Scope,
): Question {
  return { id, ...base(scope), difficulty: "facil", type: "choice", topic, prompt, answers: [options[0]], options, hint, explanation };
}

/** Completar el comando (fácil). La plantilla usa ___ para el hueco. */
export function complete(
  id: string,
  topic: Topic,
  prompt: string,
  template: string,
  answers: string[],
  hint: string,
  explanation: string,
  scope?: Scope,
): Question {
  return { id, ...base(scope), difficulty: "facil", type: "complete", topic, prompt, template, answers, hint, explanation };
}

/** Escribir el comando completo (medio o difícil). */
export function write(
  id: string,
  difficulty: Exclude<Difficulty, "facil">,
  topic: Topic,
  prompt: string,
  answers: string[],
  hint: string,
  explanation: string,
  scope?: Scope,
): Question {
  return { id, ...base(scope), difficulty, type: "write", topic, prompt, answers, hint, explanation };
}

/** Corregir un comando con error (difícil). */
export function fix(
  id: string,
  topic: Topic,
  prompt: string,
  broken: string,
  answers: string[],
  hint: string,
  explanation: string,
  scope?: Scope,
): Question {
  return { id, ...base(scope), difficulty: "dificil", type: "fix", topic, prompt, broken, answers, hint, explanation };
}
